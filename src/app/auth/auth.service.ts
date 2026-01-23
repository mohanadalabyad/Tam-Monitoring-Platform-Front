import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { User, AuthResponse, LoginCredentials, LoginResponse } from './user.model';
import { ApiResponse } from '../models/api-response.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = environment.tokenKey;
  private readonly USER_KEY = environment.userKey;
  private currentUserSubject = new BehaviorSubject<User | null>(this.getStoredUser());
  public currentUser$ = this.currentUserSubject.asObservable();
  private permissionsSubject = new BehaviorSubject<string[]>(this.getStoredPermissions());
  public permissions$ = this.permissionsSubject.asObservable();

  constructor(private http: HttpClient) {
    // Check if token is expired on service initialization
    if (this.isAuthenticated() && this.isTokenExpired()) {
      this.logout();
    }
  }

  /**
   * Decode JWT token to extract claims
   * @param token JWT token string
   * @returns Decoded token payload or null if invalid
   */
  private decodeToken(token: string): any {
    try {
      // JWT format: header.payload.signature
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }

      // Decode base64url encoded payload
      const payload = parts[1];
      // Replace URL-safe base64 characters
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      // Add padding if needed
      const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);
      // Decode
      const decoded = atob(padded);
      return JSON.parse(decoded);
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  /**
   * Extract IsSuperAdmin from JWT token
   * @param token JWT token string
   * @returns true if IsSuperAdmin claim is "True" or true, false otherwise
   */
  private getIsSuperAdminFromToken(token: string): boolean {
    const decoded = this.decodeToken(token);
    if (!decoded) {
      return false;
    }

    // Check for IsSuperAdmin claim (case-insensitive, handle both string and boolean)
    const isSuperAdmin = decoded.IsSuperAdmin || decoded.isSuperAdmin || decoded['IsSuperAdmin'] || decoded['isSuperAdmin'];
    
    // Handle string "True" or boolean true
    if (typeof isSuperAdmin === 'string') {
      return isSuperAdmin.toLowerCase() === 'true';
    }
    return isSuperAdmin === true;
  }

  login(credentials: LoginCredentials): Observable<AuthResponse> {
    return this.http.post<ApiResponse<LoginResponse>>(
      `${environment.apiUrl}/auth/login`,
      credentials
    ).pipe(
      map(response => {
        // Check if the response indicates failure (even with 200 status)
        // Backend returns 200 with success: false for invalid credentials
        if (!response.success || !response.data) {
          const errorMessage = response.message || 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
          // Create an error object that will be caught by catchError
          const error = new Error(errorMessage);
          (error as any).response = response;
          throw error;
        }

        const loginResponse = response.data;
        
        // Convert LoginResponse to User
        // Check if user is super admin - prioritize IsSuperAdmin from token,
        // then isSuperAdmin flag from backend response,
        // then check for SuperAdmin role in roles array
        const isSuperAdminFromToken = this.getIsSuperAdminFromToken(loginResponse.token);
        const isSuperAdmin = isSuperAdminFromToken ||
                            loginResponse.isSuperAdmin === true || 
                            loginResponse.roles?.includes('SuperAdmin') || 
                            loginResponse.roles?.some(role => role?.toLowerCase().includes('superadmin')) ||
                            false;
        
        const user: User = {
          id: loginResponse.userId,
          userName: loginResponse.userName,
          email: loginResponse.email,
          fullName: loginResponse.fullName,
          isSuperAdmin: isSuperAdmin,
          roles: loginResponse.roles || [],
          permissions: loginResponse.permissions || []
        };

        const authResponse: AuthResponse = {
          token: loginResponse.token,
          user: user
        };

        // Store auth data
        // Convert expiresAt string to Date object if it's a string
        const expiresAtDate = typeof loginResponse.expiresAt === 'string' 
          ? new Date(loginResponse.expiresAt) 
          : loginResponse.expiresAt;
        
        this.storeAuthData(authResponse, expiresAtDate);
        this.currentUserSubject.next(user);
        this.permissionsSubject.next(loginResponse.permissions);

        return authResponse;
      }),
      catchError(error => {
        // Handle both HTTP errors and business logic errors (success: false with 200 status)
        let errorMessage = 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
        
        // If it's an Error object we threw, use its message
        if (error instanceof Error) {
          errorMessage = error.message;
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem('tam_auth_expires_at');
    localStorage.removeItem('tam_auth_permissions');
    this.currentUserSubject.next(null);
    this.permissionsSubject.next([]);
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    return !!token && !this.isTokenExpired();
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  getUserPermissions(): string[] {
    return this.permissionsSubject.value;
  }

  private getStoredUser(): User | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        // If user exists but isSuperAdmin might be outdated, check token
        const token = this.getToken();
        if (token && !this.isTokenExpired()) {
          const isSuperAdminFromToken = this.getIsSuperAdminFromToken(token);
          if (isSuperAdminFromToken !== user.isSuperAdmin) {
            // Update isSuperAdmin from token
            user.isSuperAdmin = isSuperAdminFromToken;
            // Update stored user
            localStorage.setItem(this.USER_KEY, JSON.stringify(user));
          }
        }
        return user;
      } catch {
        return null;
      }
    }
    // If no stored user but token exists, try to get isSuperAdmin from token
    const token = this.getToken();
    if (token && !this.isTokenExpired()) {
      const isSuperAdminFromToken = this.getIsSuperAdminFromToken(token);
      if (isSuperAdminFromToken) {
        // Return a minimal user object with isSuperAdmin flag
        // This is a fallback - normally user should be stored
        return {
          id: '',
          userName: '',
          email: '',
          fullName: '',
          isSuperAdmin: true,
          roles: [],
          permissions: []
        };
      }
    }
    return null;
  }

  private getStoredPermissions(): string[] {
    const permissionsStr = localStorage.getItem('tam_auth_permissions');
    if (permissionsStr) {
      try {
        return JSON.parse(permissionsStr);
      } catch {
        return [];
      }
    }
    return [];
  }

  private storeAuthData(authResponse: AuthResponse, expiresAt: Date | string): void {
    localStorage.setItem(this.TOKEN_KEY, authResponse.token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(authResponse.user));
    
    // Convert to Date if it's a string, then store as ISO string
    const expiresAtDate = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt;
    localStorage.setItem('tam_auth_expires_at', expiresAtDate.toISOString());
    
    if (authResponse.user.permissions) {
      localStorage.setItem('tam_auth_permissions', JSON.stringify(authResponse.user.permissions));
    }
  }

  private isTokenExpired(): boolean {
    const expiresAtStr = localStorage.getItem('tam_auth_expires_at');
    if (!expiresAtStr) return true;

    try {
      const expiresAt = new Date(expiresAtStr);
      return Date.now() >= expiresAt.getTime();
    } catch {
      return true;
    }
  }
}
