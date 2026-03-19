#Requires -Version 5.1
$ErrorActionPreference = "Stop"

$RootDir = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$Jobs = @()

function Write-Log   { param($Msg) Write-Host "[+] $Msg" -ForegroundColor Green }
function Write-Warn  { param($Msg) Write-Host "[!] $Msg" -ForegroundColor Yellow }
function Write-Err   { param($Msg) Write-Host "[x] $Msg" -ForegroundColor Red }
function Write-Info  { param($Msg) Write-Host "[-] $Msg" -ForegroundColor Cyan }

Write-Host ""
Write-Host "========================================="
Write-Host "  GymManager - Start All Services"
Write-Host "========================================="
Write-Host ""

# -------------------------------------------
# 1. Check prerequisites
# -------------------------------------------
Write-Info "Checking prerequisites..."

foreach ($cmd in @("docker", "dotnet", "node", "npm")) {
    if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
        Write-Err "'$cmd' is not installed or not in PATH."
        exit 1
    }
}

$dockerInfo = docker info 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Err "Docker daemon is not running. Please start Docker Desktop."
    exit 1
}
Write-Log "All prerequisites found."

# -------------------------------------------
# 2. Start Docker containers
# -------------------------------------------
Write-Info "Starting Docker containers (PostgreSQL + RabbitMQ)..."
docker compose -f "$RootDir\docker-compose.yml" up -d
if ($LASTEXITCODE -ne 0) { Write-Err "Docker compose failed."; exit 1 }

Write-Info "Waiting for PostgreSQL to be healthy..."
$maxRetries = 30
for ($i = 0; $i -lt $maxRetries; $i++) {
    $result = docker exec gymmanager-postgres pg_isready -U postgres 2>&1
    if ($LASTEXITCODE -eq 0) { break }
    Start-Sleep -Seconds 1
}
Write-Log "PostgreSQL is ready."

Write-Info "Waiting for RabbitMQ to be healthy..."
for ($i = 0; $i -lt $maxRetries; $i++) {
    $result = docker exec gymmanager-rabbitmq rabbitmq-diagnostics ping 2>&1
    if ($LASTEXITCODE -eq 0) { break }
    Start-Sleep -Seconds 1
}
Write-Log "RabbitMQ is ready."

# -------------------------------------------
# 3. Build .NET solution
# -------------------------------------------
Write-Info "Building .NET solution..."
dotnet build "$RootDir" --verbosity quiet
if ($LASTEXITCODE -ne 0) { Write-Err "Build failed."; exit 1 }
Write-Log ".NET build succeeded."

# -------------------------------------------
# 4. Apply EF Core migrations
# -------------------------------------------
$efCheck = dotnet ef --version 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Info "Applying EF Core migrations..."
    dotnet ef database update `
        --project "$RootDir\src\core\GymManager.Infrastructure" `
        --startup-project "$RootDir\src\apps\GymManager.Api" `
        --no-build 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Log "Migrations applied."
    } else {
        Write-Warn "Migration step skipped (may already be up to date)."
    }
} else {
    Write-Warn "dotnet-ef not installed - skipping migrations. Run: dotnet tool install --global dotnet-ef"
}

# -------------------------------------------
# 5. Start API
# -------------------------------------------
Write-Info "Starting GymManager.Api..."
$Jobs += Start-Job -ScriptBlock {
    param($Root)
    dotnet run --project "$Root\src\apps\GymManager.Api" --no-build
} -ArgumentList $RootDir

# -------------------------------------------
# 6. Start Background Services
# -------------------------------------------
Write-Info "Starting GymManager.BackgroundServices..."
$Jobs += Start-Job -ScriptBlock {
    param($Root)
    dotnet run --project "$Root\src\apps\GymManager.BackgroundServices" --no-build
} -ArgumentList $RootDir

# -------------------------------------------
# 7. Start Frontend (Next.js)
# -------------------------------------------
$WebDir = Join-Path $RootDir "src\apps\gymmanager-web"
if (Test-Path $WebDir) {
    Write-Info "Installing frontend dependencies..."
    npm install --prefix "$WebDir" --silent 2>$null
    Write-Info "Starting Next.js frontend..."
    $Jobs += Start-Job -ScriptBlock {
        param($Dir)
        Set-Location $Dir
        npm run dev
    } -ArgumentList $WebDir
} else {
    Write-Warn "Frontend directory not found - skipping."
}

# -------------------------------------------
# Done
# -------------------------------------------
Write-Host ""
Write-Host "========================================="
Write-Log "All services are running!"
Write-Host ""
Write-Host "  API:          http://localhost:5000"
Write-Host "  Frontend:     http://localhost:3000"
Write-Host "  RabbitMQ UI:  http://localhost:15672  (guest/guest)"
Write-Host "  PostgreSQL:   localhost:5432          (postgres/postgres)"
Write-Host ""
Write-Host "  Press Ctrl+C to stop all services."
Write-Host "========================================="
Write-Host ""

try {
    Write-Host "Streaming service logs (Ctrl+C to stop)..." -ForegroundColor Gray
    while ($true) {
        foreach ($job in $Jobs) {
            Receive-Job -Job $job -ErrorAction SilentlyContinue
        }
        Start-Sleep -Seconds 2
    }
} finally {
    Write-Host "`nShutting down all services..."
    $Jobs | ForEach-Object { Stop-Job -Job $_ -ErrorAction SilentlyContinue }
    $Jobs | ForEach-Object { Remove-Job -Job $_ -Force -ErrorAction SilentlyContinue }
    Write-Host "All services stopped."
}
