using System.Data.Common;
using GymManager.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Logging;

namespace GymManager.Infrastructure.Persistence.Interceptors;

/// <summary>
/// EF Core connection interceptor that sets the PostgreSQL session variable
/// <c>app.current_tenant_id</c> on every connection open.
/// This variable is used by Row-Level Security policies to enforce tenant isolation.
///
/// Uses <c>set_config(..., false)</c> (session-scoped) with a parameterized value to prevent
/// SQL injection. The interceptor fires on every connection open (including pooled reuse),
/// so stale values from a previous request are always overwritten or reset.
///
/// When ICurrentUser is not authenticated (e.g., during EnsureCreatedAsync, migrations,
/// or background job superuser context), the variable is explicitly reset to prevent
/// leaking a previous tenant's context from a pooled connection.
/// </summary>
public sealed class TenantConnectionInterceptor(
    ICurrentUser currentUser,
    ILogger<TenantConnectionInterceptor> logger) : DbConnectionInterceptor
{
    public const string PgSessionVariable = "app.current_tenant_id";

    public override async Task ConnectionOpenedAsync(
        DbConnection connection,
        ConnectionEndEventData eventData,
        CancellationToken cancellationToken = default)
    {
        try
        {
            await using var cmd = connection.CreateCommand();

            if (!currentUser.IsAuthenticated || currentUser.TenantId == Guid.Empty)
            {
                // Reset to prevent stale tenant ID from a previous pooled connection.
                // RESET removes the variable so current_setting(..., true) returns empty string,
                // and the RLS policy cast to uuid fails safely (blocking all rows).
                cmd.CommandText = $"RESET {PgSessionVariable}";
                await cmd.ExecuteNonQueryAsync(cancellationToken);
                return;
            }

            // Session-scoped (is_local=false) with parameterized value to prevent SQL injection.
            // Safe because the interceptor fires on EVERY ConnectionOpenedAsync, so each request
            // always overwrites the previous value — no stale tenant IDs leak across pool reuse.
            cmd.CommandText = $"SELECT set_config('{PgSessionVariable}', @tenantId, false)";
            var param = cmd.CreateParameter();
            param.ParameterName = "tenantId";
            param.Value = currentUser.TenantId.ToString();
            cmd.Parameters.Add(param);
            await cmd.ExecuteNonQueryAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex,
                "Failed to set {Variable} for tenant {TenantId}. RLS may not enforce correctly.",
                PgSessionVariable, currentUser.TenantId);
        }
    }
}
