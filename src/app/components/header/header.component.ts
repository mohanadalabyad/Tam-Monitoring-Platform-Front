import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { User } from '../../auth/user.model';
import { WebsiteContentService } from '../../services/website-content.service';
import { HeaderContent } from '../../models/website-content.model';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  menuActive = false;
  isAuthenticated = false;
  currentUser: User | null = null;
  headerContent: HeaderContent | null = null;

  constructor(
    private authService: AuthService,
    private router: Router,
    private websiteContentService: WebsiteContentService
  ) {}

  ngOnInit(): void {
    this.isAuthenticated = this.authService.isAuthenticated();
    this.currentUser = this.authService.getCurrentUser();

    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.isAuthenticated = !!user;
    });

    this.websiteContentService.getPublicContent().subscribe(content => {
      this.headerContent = (content?.['Header'] as HeaderContent) ?? null;
    });
  }

  toggleMenu() {
    this.menuActive = !this.menuActive;
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
