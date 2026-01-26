import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { PublishedViolationService } from '../../../services/published-violation.service';
import { CategoryService } from '../../../services/category.service';
import { CityService } from '../../../services/city.service';
import { PublishedViolationDto, PublishedViolationFilter, PublishedAttachmentDto } from '../../../models/published-violation.model';
import { CategoryDto } from '../../../models/category.model';
import { CityDto } from '../../../models/city.model';
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
  cities: CityDto[] = [];
  loading = true;
  totalPublishedCount: number = 0;
  showFilters = false;
  loadingCities = false;
  
  filterForm!: FormGroup;

  constructor(
    private publishedViolationService: PublishedViolationService,
    private categoryService: CategoryService,
    private cityService: CityService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.initFilterForm();
    this.loadCategories();
    this.loadCities();
    this.loadViolations();
  }

  initFilterForm(): void {
    this.filterForm = this.fb.group({
      cityId: [null],
      categoryId: [null],
      dateFrom: [null],
      dateTo: [null]
    });
  }

  loadCities(): void {
    this.loadingCities = true;
    this.cityService.getPublicLookup().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.cities = Array.isArray(response.data) ? response.data : [];
        }
        this.loadingCities = false;
      },
      error: (error: any) => {
        console.error('Error loading cities:', error);
        this.loadingCities = false;
      }
    });
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
    const filter = this.buildFilter();
    
    this.publishedViolationService.getAllPublishedViolationsWithFilter(filter, undefined, undefined).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          // Check if data is paginated response
          if (response.data && typeof response.data === 'object' && 'items' in response.data) {
            const paginatedData = response.data as any;
            this.violations = paginatedData.items || [];
            this.filteredViolations = this.violations;
            this.totalPublishedCount = paginatedData.totalCount || 0;
          } else if (Array.isArray(response.data)) {
            this.violations = response.data;
            this.filteredViolations = this.violations;
            this.totalPublishedCount = response.data.length;
          } else {
            this.violations = [];
            this.filteredViolations = [];
            this.totalPublishedCount = 0;
          }
        }
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error loading violations:', error);
        this.loading = false;
      }
    });
  }

  buildFilter(): PublishedViolationFilter {
    if (!this.filterForm) {
      return {};
    }
    
    const formValue = this.filterForm.value;
    const filter: PublishedViolationFilter = {};
    
    if (formValue.cityId) {
      filter.cityId = Number(formValue.cityId);
    }
    if (formValue.categoryId) {
      filter.categoryId = Number(formValue.categoryId);
    }
    if (formValue.dateFrom) {
      // Convert to ISO string with time (start of day)
      const date = new Date(formValue.dateFrom);
      date.setHours(0, 0, 0, 0);
      filter.dateFrom = date.toISOString();
    }
    if (formValue.dateTo) {
      // Convert to ISO string with time (end of day)
      const date = new Date(formValue.dateTo);
      date.setHours(23, 59, 59, 999);
      filter.dateTo = date.toISOString();
    }
    
    return filter;
  }

  applyFilters(): void {
    this.loadViolations();
  }

  resetFilters(): void {
    this.filterForm.reset();
    this.loadViolations();
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
