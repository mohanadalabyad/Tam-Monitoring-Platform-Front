import { Component, OnInit } from '@angular/core';
import { ViolationService } from '../../../services/violation.service';
import { UserService } from '../../../services/user.service';
import { Violation } from '../../../models/violation.model';
import { UserDto } from '../../../models/user-management.model';

@Component({
  selector: 'app-statistics',
  templateUrl: './statistics.component.html',
  styleUrls: ['./statistics.component.scss']
})
export class StatisticsComponent implements OnInit {
  totalViolations = 0;
  pendingViolations = 0;
  resolvedViolations = 0;
  totalUsers = 0;
  recentViolations: Violation[] = [];
  loading = true;

  constructor(
    private violationService: ViolationService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.loadStatistics();
  }

  loadStatistics(): void {
    this.loading = true;
    
    // Load violations
    this.violationService.getViolations().subscribe({
      next: (violations) => {
        this.totalViolations = violations.length;
        this.pendingViolations = violations.filter(v => v.status === 'pending').length;
        this.resolvedViolations = violations.filter(v => v.status === 'resolved').length;
        this.recentViolations = violations.slice(0, 5);
      },
      error: (error) => {
        console.error('Error loading violations:', error);
      }
    });

    // Load users
    this.userService.getAllUsers().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          // Handle both array and paginated response
          if (Array.isArray(response.data)) {
            this.totalUsers = response.data.length;
          } else if (response.data && 'items' in response.data) {
            this.totalUsers = response.data.items?.length || 0;
          } else {
            this.totalUsers = 0;
          }
        } else {
          this.totalUsers = 0;
        }
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error loading users:', error);
        this.loading = false;
        this.totalUsers = 0;
      }
    });
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'pending': 'قيد المراجعة',
      'investigating': 'قيد التحقيق',
      'resolved': 'تم الحل',
      'rejected': 'مرفوض'
    };
    return labels[status] || status;
  }
}
