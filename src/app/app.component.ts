import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd, Event } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'TAM Monitoring Platform';
  isDashboardRoute = false;

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Check initial route
    this.isDashboardRoute = this.router.url.startsWith('/dashboard') || this.router.url.startsWith('/login');
    
    // Listen for route changes
    this.router.events
      .pipe(filter((event: Event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.isDashboardRoute = event.url.startsWith('/dashboard') || event.url.startsWith('/login');
      });
  }
}
