import { Component, OnInit } from '@angular/core';
import { ViolationService } from '../../../services/violation.service';
import { UserService } from '../../../services/user.service';
import { ViolationDto, AcceptanceStatus, getAcceptanceStatusLabel } from '../../../models/violation.model';
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
  recentViolations: ViolationDto[] = [];
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
    this.violationService.getAllViolations(undefined, undefined, true).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const violations: ViolationDto[] = Array.isArray(response.data) 
            ? response.data 
            : response.data.items || [];
          
          this.totalViolations = violations.length;
          this.pendingViolations = violations.filter((v: ViolationDto) => v.acceptanceStatus === AcceptanceStatus.Pending).length;
          this.resolvedViolations = violations.filter((v: ViolationDto) => v.acceptanceStatus === AcceptanceStatus.Approved).length;
          this.recentViolations = violations.slice(0, 5);
        }
      },
      error: (error: any) => {
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

  getStatusLabel(status: AcceptanceStatus): string {
    return getAcceptanceStatusLabel(status);
  }
}
