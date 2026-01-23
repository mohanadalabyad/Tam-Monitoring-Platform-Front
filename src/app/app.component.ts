import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd, Event } from '@angular/router';
import { filter } from 'rxjs/operators';
import { ConfirmationDialogService } from './services/confirmation-dialog.service';
import { ConfirmationConfig } from './components/confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'TAM Monitoring Platform';
  isDashboardRoute = false;
  confirmationState: { show: boolean; config: ConfirmationConfig } | null = null;

  constructor(
    private router: Router,
    private confirmationService: ConfirmationDialogService
  ) {}

  ngOnInit(): void {
    // Check initial route
    this.isDashboardRoute = this.router.url.startsWith('/dashboard') || this.router.url.startsWith('/login');
    
    // Listen for route changes
    this.router.events
      .pipe(filter((event: Event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.isDashboardRoute = event.url.startsWith('/dashboard') || event.url.startsWith('/login');
      });

    // Subscribe to confirmation dialog service
    this.confirmationService.getConfirmation().subscribe(state => {
      if (state) {
        this.confirmationState = {
          show: state.show,
          config: state.config
        };
      } else {
        this.confirmationState = null;
      }
    });
  }

  onConfirmationConfirmed(): void {
    this.confirmationService.confirm();
  }

  onConfirmationCancelled(): void {
    this.confirmationService.cancel();
  }

  onConfirmationClosed(): void {
    // Ensure state is cleared when dialog is closed
    this.confirmationService.cancel();
  }
}
