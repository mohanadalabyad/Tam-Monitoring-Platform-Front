import { Component, Input, OnInit, HostListener } from '@angular/core';
import { PermissionCheckService } from '../../../services/permission-check.service';

interface MenuItem {
  label: string;
  icon: string;
  route: string;
  badge?: number;
  permission?: string; // Permission required to show this menu item
}

@Component({
  selector: 'app-dashboard-sidebar',
  templateUrl: './dashboard-sidebar.component.html',
  styleUrls: ['./dashboard-sidebar.component.scss']
})
export class DashboardSidebarComponent implements OnInit {
  @Input() collapsed: boolean = false;
  isMobile: boolean = false;

  menuItems: MenuItem[] = [
    {
      label: 'الإحصائيات',
      icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 6a2 2 0 002 2h2a2 2 0 002-2v-6a2 2 0 00-2-2h-2a2 2 0 00-2 2v6zm6 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
      route: '/dashboard'
    },
    {
      label: 'الإعدادات',
      icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
      route: '/dashboard/settings',
      permission: 'Settings' // Special permission check handled in isMenuItemVisible
    },
    {
      label: 'البلاغات العامة',
      icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      route: '/dashboard/public-violations',
      permission: 'PublicViolation.Read'
    },
    {
      label: 'بلاغاتي الخاصة',
      icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      route: '/dashboard/my-private-violations'
      // No permission property - authenticated users only
    },
    {
      label: 'إدارة البلاغات',
      icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      route: '/dashboard/private-violations',
      permission: 'PrivateViolation.Read'
    }
  ];

  constructor(private permissionService: PermissionCheckService) {}

  ngOnInit(): void {
    this.checkScreenSize();
  }

  @HostListener('window:resize')
  onResize(): void {
    this.checkScreenSize();
  }

  checkScreenSize(): void {
    this.isMobile = window.innerWidth <= 991;
  }

  // On mobile, show text when sidebar is visible (collapsed = true)
  // On desktop, show text when sidebar is expanded (collapsed = false)
  get showLabels(): boolean {
    if (this.isMobile) {
      return this.collapsed; // On mobile, show when sidebar is visible
    }
    return !this.collapsed; // On desktop, show when sidebar is expanded
  }

  // Check if menu item should be visible based on permissions
  isMenuItemVisible(item: MenuItem): boolean {
    if (!item.permission) {
      return true; // No permission required
    }
    
    // Super admin sees everything
    if (this.permissionService.isSuperAdmin()) {
      return true;
    }

    // Special handling for Settings menu item
    // Settings should be visible if user has ANY of the settings permissions
    if (item.permission === 'Settings') {
      return this.permissionService.hasAnyPermission([
        'City.Read',
        'User.Read',
        'Role.Read',
        'Permission.Read',
        'Category.Read',
        'SubCategory.Read',
        'Question.Read',
        'EducationLevel.Read'
      ]);
    }

    // Check permission using the full permission string (e.g., "User.Read")
    // Split the permission string to get type and value
    const [type, value] = item.permission.split('.');
    return this.permissionService.hasPermission(type, value);
  }

  // Get visible menu items
  get visibleMenuItems(): MenuItem[] {
    return this.menuItems.filter(item => this.isMenuItemVisible(item));
  }

}
