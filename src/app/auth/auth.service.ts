import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject, throwError } from 'rxjs';
import { delay, tap } from 'rxjs/operators';
import { User, AuthResponse, LoginCredentials } from './user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'tam_auth_token';
  private readonly USER_KEY = 'tam_auth_user';
  private currentUserSubject = new BehaviorSubject<User | null>(this.getStoredUser());
  public currentUser$ = this.currentUserSubject.asObservable();

  // Mock users for development
  private mockUsers: User[] = [
    {
      id: '1',
      email: 'admin@tam.ps',
      name: 'مدير النظام',
      role: 'admin',
      status: 'active',
      createdAt: new Date('2024-01-01'),
      lastLogin: new Date()
    },
    {
      id: '2',
      email: 'moderator@tam.ps',
      name: 'مشرف',
      role: 'moderator',
      status: 'active',
      createdAt: new Date('2024-01-15'),
      lastLogin: new Date()
    }
  ];

  constructor() {
    // Check if token is expired on service initialization
    if (this.isAuthenticated() && this.isTokenExpired()) {
      this.logout();
    }
  }

  login(credentials: LoginCredentials): Observable<AuthResponse> {
    // Mock authentication - in production, this would call an API
    const user = this.mockUsers.find(
      u => u.email === credentials.email && credentials.password === 'password123'
    );

    if (!user) {
      return throwError(() => new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة'));
    }

    // Generate mock JWT token
    const token = this.generateMockToken(user);
    const authResponse: AuthResponse = {
      token,
      user: { ...user, lastLogin: new Date() }
    };

    return of(authResponse).pipe(
      delay(800), // Simulate API delay
      tap(response => {
        this.storeAuthData(response);
        this.currentUserSubject.next(response.user);
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUserSubject.next(null);
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

  private storeAuthData(authResponse: AuthResponse): void {
    localStorage.setItem(this.TOKEN_KEY, authResponse.token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(authResponse.user));
  }

  private generateMockToken(user: User): string {
    // In production, this would be a real JWT from the server
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    };
    return btoa(JSON.stringify(payload));
  }

  private isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;

    try {
      const payload = JSON.parse(atob(token));
      const expirationTime = payload.exp * 1000; // Convert to milliseconds
      return Date.now() >= expirationTime;
    } catch {
      return true;
    }
  }

  refreshToken(): Observable<string> {
    // Mock token refresh - in production, this would call an API
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      return throwError(() => new Error('No user logged in'));
    }

    const newToken = this.generateMockToken(currentUser);
    return of(newToken).pipe(
      delay(300),
      tap(token => {
        localStorage.setItem(this.TOKEN_KEY, token);
      })
    );
  }
}
