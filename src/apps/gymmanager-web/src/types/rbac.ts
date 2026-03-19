export interface RoleDefinition {
  name: string;
  value: number;
  isAssignable: boolean;
}

export interface PermissionDefinition {
  name: string;
  bitPosition: number;
  category: string;
}

export interface RouteAccessRule {
  path: string;
  allowedRoles: string[];
}

export interface RolesMetadata {
  roles: RoleDefinition[];
  permissions: PermissionDefinition[];
  routeAccess: RouteAccessRule[];
}
