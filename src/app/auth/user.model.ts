export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'moderator' | 'viewer';
  status: 'active' | 'inactive' | 'suspended';
  createdAt: Date;
  lastLogin?: Date;
  avatar?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}
