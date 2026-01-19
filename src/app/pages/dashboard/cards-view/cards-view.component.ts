import { Component, OnInit } from '@angular/core';
import { ViolationService } from '../../../services/violation.service';
import { Violation } from '../../../models/violation.model';

@Component({
  selector: 'app-cards-view',
  templateUrl: './cards-view.component.html',
  styleUrls: ['./cards-view.component.scss']
})
export class CardsViewComponent implements OnInit {
  violations: Violation[] = [];
  filteredViolations: Violation[] = [];
  loading = false;
  searchTerm = '';
  statusFilter = 'all';
  categoryFilter = 'all';
  currentPage = 1;
  pageSize = 12;
  totalPages = 1;

  categories: string[] = [];

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
    let filtered = [...this.violations];

    // Search filter
    if (this.searchTerm) {
      const searchLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(v =>
        v.title.toLowerCase().includes(searchLower) ||
        v.description.toLowerCase().includes(searchLower) ||
        v.location.toLowerCase().includes(searchLower)
      );
    }

    // Status filter
    if (this.statusFilter !== 'all') {
      filtered = filtered.filter(v => v.status === this.statusFilter);
    }

    // Category filter
    if (this.categoryFilter !== 'all') {
      filtered = filtered.filter(v => v.category === this.categoryFilter);
    }

    this.filteredViolations = filtered;
    this.updatePagination();
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredViolations.length / this.pageSize);
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = this.totalPages;
    }
  }

  getPaginatedViolations(): Violation[] {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.filteredViolations.slice(start, end);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
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

  getStatusColor(status: string): 'primary' | 'success' | 'warning' | 'danger' | 'info' {
    const colors: { [key: string]: 'primary' | 'success' | 'warning' | 'danger' | 'info' } = {
      'pending': 'warning',
      'investigating': 'info',
      'resolved': 'success',
      'rejected': 'danger'
    };
    return colors[status] || 'primary';
  }

  Math = Math;

  onCardClick(violation: Violation): void {
    // Navigate to violation details or open modal
    console.log('Clicked violation:', violation);
  }
}
