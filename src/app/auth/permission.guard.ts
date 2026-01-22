import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { PermissionCheckService } from '../services/permission-check.service';
import { ToasterService } from '../services/toaster.service';

@Injectable({
  providedIn: 'root'
})
export class PermissionGuard implements CanActivate {
  constructor(
    private permissionService: PermissionCheckService,
    private router: Router,
    private toasterService: ToasterService
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    // Super admin has access to everything
    if (this.permissionService.isSuperAdmin()) {
      return true;
    }

    // Check for single permission
    const permission = route.data['permission'] as string;
    if (permission) {
      const [type, value] = permission.split('.');
      if (this.permissionService.hasPermission(type, value)) {
        return true;
      }
    }

    // Check for multiple permissions
    const permissions = route.data['permissions'] as string[];
    if (permissions && permissions.length > 0) {
      const requireAll = route.data['requireAll'] as boolean || false;
      const hasAccess = requireAll
        ? this.permissionService.hasAllPermissions(permissions)
        : this.permissionService.hasAnyPermission(permissions);

      if (hasAccess) {
        return true;
      }
    }

    // No permission required or user has no access
    if (!permission && (!permissions || permissions.length === 0)) {
      return true; // No permission check required
    }

    // Access denied
    this.toasterService.showError('ليس لديك صلاحية للوصول إلى هذه الصفحة', 'صلاحية مرفوضة');
    this.router.navigate(['/dashboard']);
    return false;
  }
}
