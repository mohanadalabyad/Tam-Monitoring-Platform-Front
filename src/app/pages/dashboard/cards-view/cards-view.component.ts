import { Component, OnInit } from '@angular/core';
import { ViolationService } from '../../../services/violation.service';
import { CategoryService } from '../../../services/category.service';
import { ViolationDto, AcceptanceStatus, getAcceptanceStatusLabel } from '../../../models/violation.model';
import { CategoryDto } from '../../../models/category.model';

@Component({
  selector: 'app-cards-view',
  templateUrl: './cards-view.component.html',
  styleUrls: ['./cards-view.component.scss']
})
export class CardsViewComponent implements OnInit {
  violations: ViolationDto[] = [];
  filteredViolations: ViolationDto[] = [];
  loading = false;
  searchTerm = '';
  statusFilter: AcceptanceStatus | 'all' = 'all';
  categoryFilter: number | 'all' = 'all';
  currentPage = 1;
  pageSize = 12;
  totalPages = 1;

  categories: CategoryDto[] = [];

  constructor(
    private violationService: ViolationService,
    private categoryService: CategoryService
  ) {}

  ngOnInit(): void {
    this.loadCategories();
    this.loadViolations();
  }

  loadCategories(): void {
    this.categoryService.getAllCategories(true).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.categories = Array.isArray(response.data) ? response.data : response.data.items || [];
        }
      },
      error: (error: any) => {
        console.error('Error loading categories:', error);
      }
    });
  }

  loadViolations(): void {
    this.loading = true;
    this.violationService.getAllViolations(undefined, undefined, true).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.violations = Array.isArray(response.data) ? response.data : response.data.items || [];
          this.applyFilters();
        }
        this.loading = false;
      },
      error: (error: any) => {
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
        v.description.toLowerCase().includes(searchLower) ||
        v.location.toLowerCase().includes(searchLower) ||
        (v.city?.name && v.city.name.toLowerCase().includes(searchLower))
      );
    }

    // Status filter
    if (this.statusFilter !== 'all') {
      filtered = filtered.filter(v => v.acceptanceStatus === this.statusFilter);
    }

    // Category filter
    if (this.categoryFilter !== 'all') {
      filtered = filtered.filter(v => v.categoryId === this.categoryFilter);
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

  getPaginatedViolations(): ViolationDto[] {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.filteredViolations.slice(start, end);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  getStatusLabel(status: AcceptanceStatus): string {
    return getAcceptanceStatusLabel(status);
  }

  getStatusColor(status: AcceptanceStatus): 'primary' | 'success' | 'warning' | 'danger' | 'info' {
    const colors: { [key: number]: 'primary' | 'success' | 'warning' | 'danger' | 'info' } = {
      1: 'warning', // Pending
      2: 'success', // Approved
      3: 'danger'    // Rejected
    };
    return colors[status] || 'primary';
  }

  Math = Math;

  onCardClick(violation: ViolationDto): void {
    // Navigate to violation details or open modal
    console.log('Clicked violation:', violation);
  }
}
