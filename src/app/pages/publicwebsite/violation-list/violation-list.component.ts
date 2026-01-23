import { Component, OnInit } from '@angular/core';
import { ViolationService } from '../../../services/violation.service';
import { CategoryService } from '../../../services/category.service';
import { ViolationDto, AcceptanceStatus, getAcceptanceStatusLabel } from '../../../models/violation.model';
import { CategoryDto } from '../../../models/category.model';

@Component({
  selector: 'app-violation-list',
  templateUrl: './violation-list.component.html',
  styleUrls: ['./violation-list.component.scss']
})
export class ViolationListComponent implements OnInit {
  violations: ViolationDto[] = [];
  filteredViolations: ViolationDto[] = [];
  categories: CategoryDto[] = [];
  statusFilter: AcceptanceStatus | 'all' = 'all';
  categoryFilter: number | 'all' = 'all';
  loading = true;

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
    this.filteredViolations = this.violations.filter((v: ViolationDto) => {
      const statusMatch = this.statusFilter === 'all' || v.acceptanceStatus === this.statusFilter;
      const categoryMatch = this.categoryFilter === 'all' || v.categoryId === this.categoryFilter;
      return statusMatch && categoryMatch;
    });
  }

  getCountByStatus(status: AcceptanceStatus): number {
    return this.violations.filter((v: ViolationDto) => v.acceptanceStatus === status).length;
  }

  getStatusLabel(status: AcceptanceStatus): string {
    return getAcceptanceStatusLabel(status);
  }
}
