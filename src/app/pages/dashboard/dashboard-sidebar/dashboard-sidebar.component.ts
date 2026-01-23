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
      label: 'الحوادث',
      icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      route: '/dashboard/violations',
      permission: 'Violation.Read'
    },
    {
      label: 'الفئات',
      icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z',
      route: '/dashboard/categories',
      permission: 'Category.Read'
    },
    {
      label: 'الفئات الفرعية',
      icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
      route: '/dashboard/subcategories',
      permission: 'SubCategory.Read'
    },
    {
      label: 'الأسئلة',
      icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      route: '/dashboard/questions',
      permission: 'Question.Read'
    },
    {
      label: 'المدن',
      icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z',
      route: '/dashboard/cities',
      permission: 'City.Read'
    },
    {
      label: 'المستخدمون',
      icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
      route: '/dashboard/users',
      permission: 'User.Read'
    },
    {
      label: 'الأدوار',
      icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
      route: '/dashboard/roles',
      permission: 'Role.Read'
    },
    {
      label: 'الصلاحيات',
      icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
      route: '/dashboard/permissions',
      permission: 'Permission.Read'
    },
    {
      label: 'عرض البطاقات',
      icon: 'M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z',
      route: '/dashboard/cards'
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
