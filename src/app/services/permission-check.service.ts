import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthService } from '../auth/auth.service';

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
    return user?.isSuperAdmin || false;
  }
}
