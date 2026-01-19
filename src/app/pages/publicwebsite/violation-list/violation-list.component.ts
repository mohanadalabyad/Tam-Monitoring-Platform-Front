import { Component, OnInit } from '@angular/core';
import { ViolationService } from '../../../services/violation.service';
import { Violation } from '../../../models/violation.model';

@Component({
  selector: 'app-violation-list',
  templateUrl: './violation-list.component.html',
  styleUrls: ['./violation-list.component.scss']
})
export class ViolationListComponent implements OnInit {
  violations: Violation[] = [];
  filteredViolations: Violation[] = [];
  categories: string[] = [];
  statusFilter = 'all';
  categoryFilter = 'all';
  loading = true;

  constructor(private violationService: ViolationService) {}

  ngOnInit(): void {
    this.categories = this.violationService.getCategories();
    this.loadViolations();
  }

  loadViolations(): void {
    this.loading = true;
    this.violationService.getViolations().subscribe({
      next: (data) => {
        this.violations = data;
        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading violations:', error);
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    this.filteredViolations = this.violations.filter(v => {
      const statusMatch = this.statusFilter === 'all' || v.status === this.statusFilter;
      const categoryMatch = this.categoryFilter === 'all' || v.category === this.categoryFilter;
      return statusMatch && categoryMatch;
    });
  }

  getCountByStatus(status: string): number {
    return this.violations.filter(v => v.status === status).length;
  }

  getStatusLabel(status: string): string {
    const statusLabels: { [key: string]: string } = {
      'pending': 'قيد المراجعة',
      'investigating': 'قيد التحقيق',
      'resolved': 'تم الحل',
      'rejected': 'مرفوض'
    };
    return statusLabels[status] || status;
  }
}
