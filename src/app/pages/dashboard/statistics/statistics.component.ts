import { Component, OnInit } from '@angular/core';
import { StatisticsService } from '../../../services/statistics.service';
import { UserService } from '../../../services/user.service';
import { UserDto } from '../../../models/user-management.model';

@Component({
  selector: 'app-statistics',
  templateUrl: './statistics.component.html',
  styleUrls: ['./statistics.component.scss']
})
export class StatisticsComponent implements OnInit {
  totalViolations = 0;
  publishedViolations = 0;
  underReviewViolations = 0;
  totalUsers = 0;
  loading = true;

  // Chart data
  pieChartData: { label: string; value: number; percentage: number; color: string }[] = [];
  barChartData: { label: string; value: number; percentage: number; color: string }[] = [];

  constructor(
    private statisticsService: StatisticsService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.loadStatistics();
  }

  loadStatistics(): void {
    this.loading = true;
    
    // Load violation statistics from new API
    this.statisticsService.getStatistics().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.totalViolations = response.data.totalViolations || 0;
          this.publishedViolations = response.data.publishedViolations || 0;
          this.underReviewViolations = response.data.underReviewViolations || 0;
          
          // Calculate chart data
          this.calculatePieChartData();
          this.calculateBarChartData();
        }
      },
      error: (error: any) => {
        console.error('Error loading statistics:', error);
        this.loading = false;
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

  calculatePieChartData(): void {
    const total = this.publishedViolations + this.underReviewViolations;
    if (total === 0) {
      this.pieChartData = [];
      return;
    }

    this.pieChartData = [
      {
        label: 'منشور',
        value: this.publishedViolations,
        percentage: (this.publishedViolations / total) * 100,
        color: this.getChartColor(0)
      },
      {
        label: 'قيد المراجعة',
        value: this.underReviewViolations,
        percentage: (this.underReviewViolations / total) * 100,
        color: this.getChartColor(1)
      }
    ];
  }

  calculateBarChartData(): void {
    const maxValue = Math.max(this.totalViolations, this.publishedViolations, this.underReviewViolations);
    if (maxValue === 0) {
      this.barChartData = [];
      return;
    }

    this.barChartData = [
      {
        label: 'إجمالي البلاغات',
        value: this.totalViolations,
        percentage: (this.totalViolations / maxValue) * 100,
        color: this.getChartColor(0)
      },
      {
        label: 'منشور',
        value: this.publishedViolations,
        percentage: (this.publishedViolations / maxValue) * 100,
        color: this.getChartColor(1)
      },
      {
        label: 'قيد المراجعة',
        value: this.underReviewViolations,
        percentage: (this.underReviewViolations / maxValue) * 100,
        color: this.getChartColor(2)
      }
    ];
  }

  getChartColor(index: number): string {
    const colors = [
      'var(--primary-color)',
      'var(--success-color)',
      'var(--warning-color)',
      'var(--info-color)',
      'var(--danger-color)'
    ];
    return colors[index % colors.length];
  }

  // Calculate pie chart path for SVG
  getPieChartPath(index: number): string {
    if (this.pieChartData.length === 0) return '';
    
    const data = this.pieChartData[index];
    const total = this.pieChartData.reduce((sum, d) => sum + d.percentage, 0);
    const startAngle = this.pieChartData.slice(0, index).reduce((sum, d) => sum + (d.percentage / 100) * 360, 0);
    const endAngle = startAngle + (data.percentage / 100) * 360;
    
    const radius = 80;
    const centerX = 100;
    const centerY = 100;
    
    const startRad = (startAngle - 90) * (Math.PI / 180);
    const endRad = (endAngle - 90) * (Math.PI / 180);
    
    const x1 = centerX + radius * Math.cos(startRad);
    const y1 = centerY + radius * Math.sin(startRad);
    const x2 = centerX + radius * Math.cos(endRad);
    const y2 = centerY + radius * Math.sin(endRad);
    
    const largeArcFlag = data.percentage > 50 ? 1 : 0;
    
    return `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
  }
}
