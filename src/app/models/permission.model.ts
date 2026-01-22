// Permission DTOs matching backend structure
export interface PermissionDto {
  id: number;
  name: string;
  type: string;
  value: string;
  isActive: boolean;
}

export interface UpdatePermissionDto {
  id: number;
  name: string;
}

export interface PermissionFilter {
  name?: string;
  type?: string;
  value?: string;
  isActive?: boolean;
}

export interface AssignPermissionToRoleDto {
  roleId: string;
  permissionId: number;
}

export interface UnassignPermissionFromRoleDto {
  roleId: string;
  permissionId: number;
}
