import { Component, OnInit } from '@angular/core';
import { ExportViolationService } from '../../../services/export-violation.service';
import { CityService } from '../../../services/city.service';
import { CategoryService } from '../../../services/category.service';
import { SubCategoryService } from '../../../services/subcategory.service';
import { ToasterService } from '../../../services/toaster.service';
import { PermissionCheckService } from '../../../services/permission-check.service';
import {
  ExportColumnDefinition,
  ExportViolationRequest
} from '../../../models/export-violation.model';
import { PrivateViolationFilter } from '../../../models/violation.model';
import { PublicViolationFilter } from '../../../models/public-violation.model';
import { CityDto } from '../../../models/city.model';
import { CategoryDto } from '../../../models/category.model';
import { SubCategoryDto } from '../../../models/subcategory.model';
import { AcceptanceStatus, PublishStatus } from '../../../models/violation.model';
import {
  ViolationVerificationStatus,
  ViolationPublishStatus,
  PublicViolationType
} from '../../../models/public-violation.model';

@Component({
  selector: 'app-export-violations',
  templateUrl: './export-violations.component.html',
  styleUrls: ['./export-violations.component.scss']
})
export class ExportViolationsComponent implements OnInit {
  violationType: 'Private' | 'Public' = 'Private';
  columns: ExportColumnDefinition[] = [];
  selectedKeys: Set<string> = new Set();
  includeAttachmentsSheet = false;
  includeFollowUpsSheet = false;
  loadingColumns = false;
  exporting = false;

  /** Section toggles (all expanded by default) */
  showViolationType = true;
  showColumns = true;
  showOptions = true;
  showFilters = false;
  showExportActions = true;

  cities: CityDto[] = [];
  categories: CategoryDto[] = [];
  subCategories: SubCategoryDto[] = [];
  loadingCities = false;
  loadingCategories = false;
  loadingSubCategories = false;

  filterPrivate = {
    acceptanceStatus: null as number | null,
    publishStatus: null as number | null,
    cityId: null as number | null,
    categoryId: null as number | null,
    subCategoryId: null as number | null
  };
  filterPublic = {
    violationType: null as number | null,
    verificationStatus: null as number | null,
    publishStatus: null as number | null,
    cityId: null as number | null,
    categoryId: null as number | null,
    subCategoryId: null as number | null,
    perpetratorTypeId: null as number | null
  };

  constructor(
    private exportService: ExportViolationService,
    private cityService: CityService,
    private categoryService: CategoryService,
    private subCategoryService: SubCategoryService,
    private toaster: ToasterService,
    private permissionService: PermissionCheckService
  ) {}

  /** User can export private violations only with PrivateViolation.Export */
  get canExportPrivate(): boolean {
    return this.permissionService.isSuperAdmin() || this.permissionService.hasPermission('PrivateViolation', 'Export');
  }

  /** User can export public violations only with PublicViolation.Export */
  get canExportPublic(): boolean {
    return this.permissionService.isSuperAdmin() || this.permissionService.hasPermission('PublicViolation', 'Export');
  }

  /** User can perform export for the currently selected violation type */
  get canExportCurrentType(): boolean {
    return this.violationType === 'Private' ? this.canExportPrivate : this.canExportPublic;
  }

  ngOnInit(): void {
    // Default to the first type the user is allowed to export
    if (!this.canExportPrivate && this.canExportPublic) {
      this.violationType = 'Public';
    } else if (this.canExportPrivate && !this.canExportPublic) {
      this.violationType = 'Private';
    }
    this.loadColumns();
    this.loadCities();
    this.loadCategories();
  }

  get groups(): string[] {
    const set = new Set(this.columns.map((c) => c.group));
    return Array.from(set);
  }

  columnsByGroup(group: string): ExportColumnDefinition[] {
    return this.columns.filter((c) => c.group === group);
  }

  isSelected(key: string): boolean {
    return this.selectedKeys.has(key);
  }

  toggleColumn(key: string): void {
    if (this.selectedKeys.has(key)) {
      this.selectedKeys.delete(key);
    } else {
      this.selectedKeys.add(key);
    }
    this.selectedKeys = new Set(this.selectedKeys);
  }

  selectAllInGroup(group: string): void {
    const keys = this.columnsByGroup(group).map((c) => c.key);
    keys.forEach((k) => this.selectedKeys.add(k));
    this.selectedKeys = new Set(this.selectedKeys);
  }

  deselectAllInGroup(group: string): void {
    const keys = this.columnsByGroup(group).map((c) => c.key);
    keys.forEach((k) => this.selectedKeys.delete(k));
    this.selectedKeys = new Set(this.selectedKeys);
  }

  onViolationTypeChange(): void {
    this.selectedKeys.clear();
    this.loadColumns();
  }

  loadColumns(): void {
    this.loadingColumns = true;
    this.exportService.getAvailableColumns(this.violationType).subscribe({
      next: (cols) => {
        this.columns = cols;
        this.selectedKeys = new Set(cols.map((c) => c.key));
        this.loadingColumns = false;
      },
      error: () => {
        this.loadingColumns = false;
        this.toaster.showError('فشل تحميل الأعمدة');
      }
    });
  }

  loadCities(): void {
    this.loadingCities = true;
    this.cityService.getPublicLookup().subscribe({
      next: (res) => {
        this.cities = res.data ?? [];
        this.loadingCities = false;
      },
      error: () => (this.loadingCities = false)
    });
  }

  loadCategories(): void {
    this.loadingCategories = true;
    this.categoryService.getPublicLookup().subscribe({
      next: (res) => {
        this.categories = res.data ?? [];
        this.loadingCategories = false;
      },
      error: () => (this.loadingCategories = false)
    });
  }

  onCategoryChange(): void {
    const id = this.violationType === 'Private'
      ? this.filterPrivate.categoryId
      : this.filterPublic.categoryId;
    this.subCategories = [];
    if (id == null) return;
    this.loadingSubCategories = true;
    this.subCategoryService.getPublicLookup(id).subscribe({
      next: (res) => {
        this.subCategories = res.data ?? [];
        this.loadingSubCategories = false;
      },
      error: () => (this.loadingSubCategories = false)
    });
  }

  buildPrivateFilter(): PrivateViolationFilter {
    const f = this.filterPrivate;
    const filter: PrivateViolationFilter = {};
    if (f.acceptanceStatus != null) filter.acceptanceStatus = f.acceptanceStatus as AcceptanceStatus;
    if (f.publishStatus != null) filter.publishStatus = f.publishStatus as PublishStatus;
    if (f.cityId != null) filter.cityId = f.cityId;
    if (f.categoryId != null) filter.categoryId = f.categoryId;
    if (f.subCategoryId != null) filter.subCategoryId = f.subCategoryId;
    return filter;
  }

  buildPublicFilter(): PublicViolationFilter {
    const f = this.filterPublic;
    const filter: PublicViolationFilter = {};
    if (f.violationType != null) filter.violationType = f.violationType as PublicViolationType;
    if (f.verificationStatus != null) filter.verificationStatus = f.verificationStatus as ViolationVerificationStatus;
    if (f.publishStatus != null) filter.publishStatus = f.publishStatus as ViolationPublishStatus;
    if (f.cityId != null) filter.cityId = f.cityId;
    if (f.categoryId != null) filter.categoryId = f.categoryId;
    if (f.subCategoryId != null) filter.subCategoryId = f.subCategoryId;
    if (f.perpetratorTypeId != null) filter.perpetratorTypeId = f.perpetratorTypeId;
    return filter;
  }

  export(): void {
    if (!this.canExportCurrentType) {
      this.toaster.showError('ليس لديك صلاحية تصدير هذا النوع من البلاغات');
      return;
    }
    if (this.selectedKeys.size === 0) {
      this.toaster.showError('اختر عموداً واحداً على الأقل');
      return;
    }
    const request: ExportViolationRequest = {
      violationType: this.violationType,
      selectedColumnKeys: Array.from(this.selectedKeys),
      includeAttachmentsSheet: this.includeAttachmentsSheet,
      includeFollowUpsSheet: this.includeFollowUpsSheet
    };
    if (this.violationType === 'Private') {
      request.privateFilter = this.buildPrivateFilter();
    } else {
      request.publicFilter = this.buildPublicFilter();
    }
    this.exporting = true;
    this.exportService.exportViolations(request).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `violations-export-${this.violationType.toLowerCase()}-${new Date().toISOString().slice(0, 10)}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.exporting = false;
        this.toaster.showSuccess('تم تصدير الملف بنجاح');
      },
      error: () => {
        this.exporting = false;
        this.toaster.showError('فشل التصدير');
      }
    });
  }
}
