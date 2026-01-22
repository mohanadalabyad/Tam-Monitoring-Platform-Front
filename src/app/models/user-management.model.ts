// User DTOs matching backend structure
export interface UserDto {
  id: string;
  userName: string;
  email: string;
  fullName: string;
  profileImagePath?: string;
  isSuperAdmin: boolean;
  roles: string[];
  isActive?: boolean;
}

export interface AddUserDto {
  id?: string; // Optional - will be generated if not provided
  userName: string;
  email: string;
  password: string;
  fullName: string;
  profileImagePath?: string;
  isSuperAdmin: boolean;
  roleNames: string[];
}

export interface UpdateUserDto {
  id: string;
  userName: string;
  email: string;
  password?: string;
  fullName: string;
  profileImagePath?: string;
  isSuperAdmin: boolean;
  roleNames: string[];
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface UserFilter {
  userName?: string;
  email?: string;
  fullName?: string;
  roleNames?: string[];
  isSuperAdmin?: boolean;
}
