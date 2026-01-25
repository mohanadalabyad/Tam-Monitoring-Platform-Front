import { Component, OnInit } from '@angular/core';
import { PublishedViolationService } from '../../../services/published-violation.service';
import { CategoryService } from '../../../services/category.service';
import { PublishedViolationDto, PublishedViolationFilter, PublishedAttachmentDto } from '../../../models/published-violation.model';
import { CategoryDto } from '../../../models/category.model';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-violation-list',
  templateUrl: './violation-list.component.html',
  styleUrls: ['./violation-list.component.scss']
})
export class ViolationListComponent implements OnInit {
  violations: PublishedViolationDto[] = [];
  filteredViolations: PublishedViolationDto[] = [];
  categories: CategoryDto[] = [];
  categoryFilter: number | string | 'all' = 'all';
  loading = true;
  totalPublishedCount: number = 0;

  constructor(
    private publishedViolationService: PublishedViolationService,
    private categoryService: CategoryService
  ) {}

  ngOnInit(): void {
    this.loadCategories();
    this.loadViolations();
  }

  loadCategories(): void {
    this.categoryService.getPublicLookup().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.categories = Array.isArray(response.data) ? response.data : [];
        }
      },
      error: (error: any) => {
        console.error('Error loading categories:', error);
      }
    });
  }

  loadViolations(): void {
    this.loading = true;
    this.publishedViolationService.getAllPublishedViolations(undefined, undefined).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          // Check if data is paginated response
          if (response.data && typeof response.data === 'object' && 'items' in response.data) {
            const paginatedData = response.data as any;
            this.violations = paginatedData.items || [];
            this.totalPublishedCount = paginatedData.totalCount || 0;
          } else if (Array.isArray(response.data)) {
            this.violations = response.data;
            this.totalPublishedCount = response.data.length;
          } else {
            this.violations = [];
            this.totalPublishedCount = 0;
          }
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
    this.filteredViolations = this.violations.filter((v: PublishedViolationDto) => {
      if (this.categoryFilter === 'all') {
        return true;
      }
      // Convert categoryFilter to number for comparison (select returns string)
      const filterCategoryId = typeof this.categoryFilter === 'string' 
        ? Number(this.categoryFilter) 
        : this.categoryFilter;
      return v.categoryId === filterCategoryId;
    });
  }

  getLocation(violation: PublishedViolationDto): string {
    // Public violations use address, Private violations use location
    return violation.violationType === 'Public' 
      ? (violation.address || 'غير محدد')
      : (violation.location || 'غير محدد');
  }

  isImage(fileType: string): boolean {
    if (!fileType) return false;
    const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', '.png', '.jpg', '.jpeg', '.gif', '.webp'];
    return imageTypes.some(type => fileType.toLowerCase().includes(type.toLowerCase()));
  }

  getAttachmentUrl(filePath: string): string {
    if (!filePath) return '';
    // If filePath already contains http/https, return as is
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
      return filePath;
    }
    // Otherwise, construct full URL from API base URL
    const baseUrl = environment.apiUrl.replace('/api', '');
    return `${baseUrl}${filePath.startsWith('/') ? '' : '/'}${filePath}`;
  }

  openAttachment(attachment: PublishedAttachmentDto): void {
    const url = this.getAttachmentUrl(attachment.filePath);
    if (url) {
      window.open(url, '_blank');
    }
  }

  getCountByCategory(categoryId: number): number {
    return this.violations.filter((v: PublishedViolationDto) => v.categoryId === categoryId).length;
  }
}
