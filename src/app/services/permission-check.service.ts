import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PermissionCheckService {
  private permissionsSubject = new BehaviorSubject<string[]>([]);
  public permissions$: Observable<string[]> = this.permissionsSubject.asObservable();

  constructor(private authService: AuthService) {
    // Subscribe to auth service to get permissions
    this.authService.permissions$.subscribe(permissions => {
      this.permissionsSubject.next(permissions);
    });

    // Initialize with stored permissions
    const storedPermissions = this.authService.getUserPermissions();
    if (storedPermissions.length > 0) {
      this.permissionsSubject.next(storedPermissions);
    }
  }

  /**
   * Check if user has a specific permission
   * @param permission Permission string in format "Type.Value" (e.g., "User.Read") or type and value separately
   * @param value Optional permission value if type is provided separately
   * @returns true if user has the permission
   */
  hasPermission(permission: string, value?: string): boolean {
    const permissions = this.permissionsSubject.value;
    let permissionString: string;
    
    if (value !== undefined) {
      // Two parameters: type and value
      permissionString = `${permission}.${value}`;
    } else {
      // Single parameter: full permission string
      permissionString = permission;
    }
    
    return permissions.includes(permissionString);
  }

  /**
   * Check if user has any of the provided permissions
   * @param permissions Array of permission strings in format "Type.Value"
   * @returns true if user has at least one permission
   */
  hasAnyPermission(permissions: string[]): boolean {
    const userPermissions = this.permissionsSubject.value;
    return permissions.some(permission => userPermissions.includes(permission));
  }

  /**
   * Check if user has all of the provided permissions
   * @param permissions Array of permission strings in format "Type.Value"
   * @returns true if user has all permissions
   */
  hasAllPermissions(permissions: string[]): boolean {
    const userPermissions = this.permissionsSubject.value;
    return permissions.every(permission => userPermissions.includes(permission));
  }

  /**
   * Get all user permissions
   * @returns Array of permission strings
   */
  getUserPermissions(): string[] {
    return [...this.permissionsSubject.value];
  }

  /**
   * Check if user is super admin
   * @returns true if user is super admin
   */
  isSuperAdmin(): boolean {
    const user = this.authService.getCurrentUser();
    if (user) {
      return user.isSuperAdmin || false;
    }

    // If user is not available, try to get from stored user
    const storedUserStr = localStorage.getItem(environment.userKey || 'tam_auth_user');
    if (storedUserStr) {
      try {
        const storedUser = JSON.parse(storedUserStr);
        if (storedUser?.isSuperAdmin !== undefined) {
          return storedUser.isSuperAdmin || false;
        }
      } catch {
        // Continue to token check
      }
    }

    // Last resort: check token directly
    const token = this.authService.getToken();
    if (token) {
      try {
        // Decode token to check IsSuperAdmin claim
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = parts[1];
          const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
          const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);
          const decoded = atob(padded);
          const tokenData = JSON.parse(decoded);
          
          const isSuperAdmin = tokenData.IsSuperAdmin || tokenData.isSuperAdmin || 
                              tokenData['IsSuperAdmin'] || tokenData['isSuperAdmin'];
          
          if (typeof isSuperAdmin === 'string') {
            return isSuperAdmin.toLowerCase() === 'true';
          }
          return isSuperAdmin === true;
        }
      } catch (error) {
        console.error('Error decoding token in permission check:', error);
      }
    }

    return false;
  }
}
