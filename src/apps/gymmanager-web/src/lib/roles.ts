/**
 * Role type for frontend usage.
 *
 * The hardcoded Role constant has been removed in favour of the dynamic
 * role list derived from the RBAC metadata API (/roles/metadata).
 * Use `useRbacStore().roles` to get the full list of roles.
 * Use `useRbacStore().assignableRoles` for roles that can be assigned to users.
 *
 * RoleType is kept as `string` because the set of valid roles is now determined
 * at runtime from the API, not at compile time.
 */
export type RoleType = string;
