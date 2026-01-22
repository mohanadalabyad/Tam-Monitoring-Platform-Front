// User model matching backend UserDto
export interface User {
  id: string;
  userName: string;
  email: string;
  fullName: string;
  profileImagePath?: string;
  isSuperAdmin: boolean;
  roles: string[];
  permissions?: string[]; // From login response
}

// Login response matching backend LoginResponseDto
export interface LoginResponse {
  token: string;
  userId: string;
  email: string;
  userName: string;
  fullName: string;
  roles: string[];
  permissions: string[];
  expiresAt: Date | string; // Backend returns as ISO string, we convert to Date
}

// Auth response wrapper
export interface AuthResponse {
  token: string;
  user: User;
}

// Login credentials matching backend LoginDto
export interface LoginCredentials {
  userName: string;
  password: string;
}
