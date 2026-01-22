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
        // Check if user has SuperAdmin role
        const isSuperAdmin = loginResponse.roles.includes('SuperAdmin') || 
                            loginResponse.roles.some(role => role.toLowerCase().includes('superadmin'));
        
        const user: User = {
          id: loginResponse.userId,
          userName: loginResponse.userName,
          email: loginResponse.email,
          fullName: loginResponse.fullName,
          isSuperAdmin: isSuperAdmin,
          roles: loginResponse.roles,
          permissions: loginResponse.permissions
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
        return JSON.parse(userStr);
      } catch {
        return null;
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
