#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PIDS=()

cleanup() {
    echo ""
    echo "Shutting down all services..."
    for pid in "${PIDS[@]}"; do
        kill "$pid" 2>/dev/null || true
    done
    wait 2>/dev/null
    echo "All services stopped."
    exit 0
}
trap cleanup SIGINT SIGTERM

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log()  { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
err()  { echo -e "${RED}[✗]${NC} $1"; }
info() { echo -e "${CYAN}[→]${NC} $1"; }

echo ""
echo "========================================="
echo "  GymManager — Start All Services"
echo "========================================="
echo ""

# -------------------------------------------
# 1. Check prerequisites
# -------------------------------------------
info "Checking prerequisites..."

for cmd in docker dotnet node npm; do
    if ! command -v "$cmd" &>/dev/null; then
        err "'$cmd' is not installed or not in PATH."
        exit 1
    fi
done

if ! docker info &>/dev/null; then
    err "Docker daemon is not running. Please start Docker Desktop."
    exit 1
fi
log "All prerequisites found."

# -------------------------------------------
# 2. Start Docker containers
# -------------------------------------------
info "Starting Docker containers (PostgreSQL + RabbitMQ)..."
docker compose -f "$ROOT_DIR/docker-compose.yml" up -d

info "Waiting for PostgreSQL to be healthy..."
until docker exec gymmanager-postgres pg_isready -U postgres &>/dev/null; do
    sleep 1
done
log "PostgreSQL is ready."

info "Waiting for RabbitMQ to be healthy..."
until docker exec gymmanager-rabbitmq rabbitmq-diagnostics ping &>/dev/null; do
    sleep 1
done
log "RabbitMQ is ready."

# -------------------------------------------
# 3. Build .NET solution
# -------------------------------------------
info "Building .NET solution..."
dotnet build "$ROOT_DIR" --verbosity quiet
log ".NET build succeeded."

# -------------------------------------------
# 4. Apply EF Core migrations (if dotnet-ef is installed)
# -------------------------------------------
if dotnet ef --version &>/dev/null 2>&1; then
    info "Applying EF Core migrations..."
    dotnet ef database update \
        --project "$ROOT_DIR/src/core/GymManager.Infrastructure" \
        --startup-project "$ROOT_DIR/src/apps/GymManager.Api" \
        --no-build 2>/dev/null && log "Migrations applied." || warn "Migration step skipped (may already be up to date)."
else
    warn "dotnet-ef not installed — skipping migrations. Run: dotnet tool install --global dotnet-ef"
fi

# -------------------------------------------
# 5. Start API
# -------------------------------------------
info "Starting GymManager.Api..."
dotnet run --project "$ROOT_DIR/src/apps/GymManager.Api" --no-build &
PIDS+=($!)

# -------------------------------------------
# 6. Start Background Services
# -------------------------------------------
info "Starting GymManager.BackgroundServices..."
dotnet run --project "$ROOT_DIR/src/apps/GymManager.BackgroundServices" --no-build &
PIDS+=($!)

# -------------------------------------------
# 7. Start Frontend (Next.js)
# -------------------------------------------
WEB_DIR="$ROOT_DIR/src/apps/gymmanager-web"
if [ -d "$WEB_DIR" ]; then
    info "Installing frontend dependencies..."
    npm install --prefix "$WEB_DIR" --silent
    info "Starting Next.js frontend..."
    npm run dev --prefix "$WEB_DIR" &
    PIDS+=($!)
else
    warn "Frontend directory not found — skipping."
fi

# -------------------------------------------
# Done
# -------------------------------------------
echo ""
echo "========================================="
log "All services are running!"
echo ""
echo "  API:          http://localhost:5050"
echo "  Frontend:     http://localhost:3000"
echo "  RabbitMQ UI:  http://localhost:15672  (guest/guest)"
echo "  PostgreSQL:   localhost:5432          (postgres/postgres)"
echo ""
echo "  Press Ctrl+C to stop all services."
echo "========================================="
echo ""

wait
