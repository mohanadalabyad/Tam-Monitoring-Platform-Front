import { Component, OnInit, HostListener } from '@angular/core';

@Component({
  selector: 'app-dashboard-layout',
  templateUrl: './dashboard-layout.component.html',
  styleUrls: ['./dashboard-layout.component.scss']
})
export class DashboardLayoutComponent implements OnInit {
  sidebarCollapsed = false;
  currentYear = new Date().getFullYear();
  isMobile = false;

  ngOnInit(): void {
    this.checkScreenSize();
  }

  @HostListener('window:resize', ['$event'])
  onResize(): void {
    this.checkScreenSize();
    if (!this.isMobile && this.sidebarCollapsed) {
      this.sidebarCollapsed = false;
    }
  }

  checkScreenSize(): void {
    this.isMobile = window.innerWidth <= 991;
    if (this.isMobile) {
      this.sidebarCollapsed = false; // Sidebar hidden by default on mobile
    }
  }

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  closeSidebar(): void {
    if (this.isMobile) {
      this.sidebarCollapsed = false;
    }
  }
}
