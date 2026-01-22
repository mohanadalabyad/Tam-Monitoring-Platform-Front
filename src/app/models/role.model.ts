// Role DTOs matching backend structure
export interface RoleDto {
  id: string;
  name: string;
  createdAt?: Date;
  isSuperAdminRole: boolean;
  isDeleted: boolean;
  isActive: boolean;
  permissionIds: number[];
}

export interface AddRoleDto {
  name: string;
}

export interface UpdateRoleDto {
  id: string;
  name: string;
}

export interface RoleAssignPermissionDto {
  roleId: string;
  permissionId: number;
}

export interface RoleUnassignPermissionDto {
  roleId: string;
  permissionId: number;
}

export interface AssignRoleToUserDto {
  userId: string;
  roleId: string;
}
