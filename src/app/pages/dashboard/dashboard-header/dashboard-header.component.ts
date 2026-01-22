import { Component, Output, EventEmitter, OnInit, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../auth/auth.service';
import { User } from '../../../auth/user.model';

@Component({
  selector: 'app-dashboard-header',
  templateUrl: './dashboard-header.component.html',
  styleUrls: ['./dashboard-header.component.scss']
})
export class DashboardHeaderComponent implements OnInit {
  @Output() toggleSidebar = new EventEmitter<void>();
  currentUser: User | null = null;
  showUserMenu = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.user-menu-wrapper')) {
      this.showUserMenu = false;
    }
  }

  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
  }

  closeUserMenu(): void {
    this.showUserMenu = false;
  }

  goToProfile(): void {
    this.router.navigate(['/dashboard/profile']);
    this.closeUserMenu();
  }

  goToSettings(): void {
    this.router.navigate(['/dashboard/settings']);
    this.closeUserMenu();
  }

  getRolesLabel(roles: string[]): string {
    if (!roles || roles.length === 0) {
      return 'لا يوجد أدوار';
    }
    return roles.join(', ');
  }

  getUserInitials(): string {
    if (this.currentUser?.fullName) {
      return this.currentUser.fullName.charAt(0).toUpperCase();
    }
    return 'U';
  }
}
