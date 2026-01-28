import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PublicViolationService } from '../../../services/public-violation.service';
import { ViolationFollowUpService } from '../../../services/violation-follow-up.service';
import { FollowUpStatusService } from '../../../services/follow-up-status.service';
import { CityService } from '../../../services/city.service';
import { CategoryService } from '../../../services/category.service';
import { SubCategoryService } from '../../../services/subcategory.service';
import { ToasterService } from '../../../services/toaster.service';
import { PermissionCheckService } from '../../../services/permission-check.service';
import { ConfirmationDialogService } from '../../../services/confirmation-dialog.service';
import { 
  PublicViolationDto, 
  PublicViolationFilter,
  PublicViolationType,
  ViolationVerificationStatus,
  ViolationPublishStatus,
  getPublicViolationTypeLabel,
  getVerificationStatusLabel,
  getPublishStatusLabel
} from '../../../models/public-violation.model';
import { ViolationFollowUpDto, AddViolationFollowUpDto } from '../../../models/violation-follow-up.model';
import { FollowUpStatusDto } from '../../../models/follow-up-status.model';
import { CityDto } from '../../../models/city.model';
import { CategoryDto } from '../../../models/category.model';
import { SubCategoryDto } from '../../../models/subcategory.model';
import { TableColumn, TableAction } from '../../../components/unified-table/unified-table.component';
import { ViewMode } from '../../../components/view-toggle/view-toggle.component';
import { Eye, Pencil, Trash2, CheckCircle, XCircle, Upload, Download, ClipboardList } from 'lucide-angular';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-public-violations-management',
  templateUrl: './public-violations-management.component.html',
  styleUrls: ['./public-violations-management.component.scss']
})
export class PublicViolationsManagementComponent implements OnInit {
  publicViolations: PublicViolationDto[] = [];
  filteredViolations: PublicViolationDto[] = []; // For client-side search
  loading = false;
  viewMode: ViewMode = 'table';
  showModal = false;
  modalTitle = '';
  descriptionForm!: FormGroup;
  editingViolation: PublicViolationDto | null = null;
  showDetailsModal = false;
  selectedViolation: PublicViolationDto | null = null;
  showFollowUpModal = false;
  selectedViolationForFollowUp: PublicViolationDto | null = null;
  followUpForm!: FormGroup;
  followUps: ViolationFollowUpDto[] = [];
  followUpStatuses: FollowUpStatusDto[] = [];
  loadingFollowUps = false;
  showFilters = false;
  searchTerm: string = '';
  
  // Filter properties
  filterForm!: FormGroup;
  cities: CityDto[] = [];
  categories: CategoryDto[] = [];
  subCategories: SubCategoryDto[] = [];
  loadingCities = false;
  loadingCategories = false;
  loadingSubCategories = false;
  
  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalCount = 0;
  totalPages = 0;

  columns: TableColumn[] = [
    { key: 'id', label: 'ID', sortable: true, filterable: false },
    { key: 'cityName', label: 'المدينة', sortable: true, filterable: false },
    { key: 'categoryName', label: 'الفئة', sortable: true, filterable: false },
    { key: 'subCategoryName', label: 'الفئة الفرعية', sortable: true, filterable: false },
    { 
      key: 'violationType', 
      label: 'صفة المبلغ', 
      sortable: true, 
      filterable: false,
      render: (value) => getPublicViolationTypeLabel(value)
    },
    { 
      key: 'violationDate', 
      label: 'تاريخ الحادثة', 
      sortable: true, 
      filterable: false,
      type: 'date'
    },
    { key: 'address', label: 'العنوان', sortable: false, filterable: false },
    { 
      key: 'verificationStatus', 
      label: 'حالة التوثيق', 
      sortable: true, 
      filterable: false,
      type: 'badge',
      render: (value) => getVerificationStatusLabel(value)
    },
    { 
      key: 'publishStatus', 
      label: 'حالة النشر', 
      sortable: true, 
      filterable: false,
      type: 'badge',
      render: (value) => getPublishStatusLabel(value)
    }
  ];

  actions: TableAction[] = [];
  
  // Lucide icons
  Eye = Eye;
  Pencil = Pencil;
  Trash2 = Trash2;
  CheckCircle = CheckCircle;
  XCircle = XCircle;
  Upload = Upload;
  Download = Download;
  ClipboardList = ClipboardList;

  constructor(
    private publicViolationService: PublicViolationService,
    private violationFollowUpService: ViolationFollowUpService,
    private followUpStatusService: FollowUpStatusService,
    private cityService: CityService,
    private categoryService: CategoryService,
    private subCategoryService: SubCategoryService,
    private toasterService: ToasterService,
    public permissionService: PermissionCheckService,
    private confirmationService: ConfirmationDialogService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    const savedView = localStorage.getItem('public-violations-view-mode');
    if (savedView === 'table' || savedView === 'cards') {
      this.viewMode = savedView;
    }
    this.initForms();
    this.loadLookupData();
    this.loadFollowUpStatuses();
    this.loadPublicViolations();
    setTimeout(() => {
      this.setupActions();
    }, 0);
    // Initialize filtered violations
    this.filteredViolations = [];
  }

  initForms(): void {
    this.filterForm = this.fb.group({
      verificationStatus: [null],
      publishStatus: [null],
      violationType: [null],
      cityId: [null],
      categoryId: [null],
      subCategoryId: [null]
    });

    this.descriptionForm = this.fb.group({
      description: ['', Validators.required]
    });

    this.followUpForm = this.fb.group({
      followUpStatusId: ['', Validators.required],
      note: ['', Validators.required]
    });

    // Watch category changes to reload subcategories
    this.filterForm.get('categoryId')?.valueChanges.subscribe(categoryId => {
      if (categoryId) {
        this.loadSubCategories(categoryId);
      } else {
        this.subCategories = [];
        this.filterForm.patchValue({ subCategoryId: null }, { emitEvent: false });
      }
    });
  }

  loadLookupData(): void {
    this.loadCities();
    this.loadCategories();
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
      error: (error) => {
        console.error('Error loading cities:', error);
        this.loadingCities = false;
      }
    });
  }

  loadCategories(): void {
    this.loadingCategories = true;
    this.categoryService.getPublicLookup().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.categories = Array.isArray(response.data) ? response.data : [];
        }
        this.loadingCategories = false;
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        this.loadingCategories = false;
      }
    });
  }

  loadSubCategories(categoryId: number): void {
    this.loadingSubCategories = true;
    this.subCategoryService.getPublicLookup(categoryId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.subCategories = Array.isArray(response.data) ? response.data : [];
        }
        this.loadingSubCategories = false;
      },
      error: (error) => {
        console.error('Error loading subcategories:', error);
        this.loadingSubCategories = false;
      }
    });
  }

  onViewChange(view: ViewMode): void {
    this.viewMode = view;
    localStorage.setItem('public-violations-view-mode', view);
  }

  setupActions(): void {
    this.actions = [];
    
    if (this.permissionService.hasPermission('PublicViolation', 'Read') || this.permissionService.isSuperAdmin()) {
      this.actions.push({
        label: 'عرض التفاصيل',
        icon: Eye,
        action: (row) => this.viewDetails(row),
        class: 'btn-view',
        variant: 'info',
        showLabel: false
      });
    }
    
    if (this.permissionService.hasPermission('PublicViolation', 'Update') || this.permissionService.isSuperAdmin()) {
      this.actions.push({
        label: 'تعديل الوصف',
        icon: Pencil,
        action: (row) => this.editDescription(row),
        class: 'btn-edit',
        variant: 'warning',
        showLabel: false
      });
    }

    if (this.permissionService.hasPermission('ViolationFollowUp', 'Create') || this.permissionService.isSuperAdmin()) {
      this.actions.push({
        label: 'إضافة Follow-up',
        icon: ClipboardList,
        action: (row) => this.openFollowUpModal(row),
        class: 'btn-info',
        variant: 'info',
        showLabel: false
      });
    }
    
    if (this.permissionService.hasPermission('PublicViolation', 'Verify') || this.permissionService.isSuperAdmin()) {
      this.actions.push({
        label: 'توثيق',
        icon: CheckCircle,
        action: (row) => this.verifyViolation(row),
        class: 'btn-verify',
        variant: 'success',
        showLabel: false,
        condition: (row: PublicViolationDto) => row.verificationStatus === ViolationVerificationStatus.NotVerified
      });
      
      this.actions.push({
        label: 'إلغاء التوثيق',
        icon: XCircle,
        action: (row) => this.unverifyViolation(row),
        class: 'btn-unverify',
        variant: 'warning',
        showLabel: false,
        condition: (row: PublicViolationDto) => row.verificationStatus === ViolationVerificationStatus.Verified
      });
    }
    
    if (this.permissionService.hasPermission('PublicViolation', 'Publish') || this.permissionService.isSuperAdmin()) {
      this.actions.push({
        label: 'نشر',
        icon: Upload,
        action: (row) => this.publishViolation(row),
        class: 'btn-publish',
        variant: 'success',
        showLabel: false,
        condition: (row: PublicViolationDto) => row.publishStatus === ViolationPublishStatus.NotPublish
      });
      
      this.actions.push({
        label: 'إلغاء النشر',
        icon: Download,
        action: (row) => this.unpublishViolation(row),
        class: 'btn-unpublish',
        variant: 'warning',
        showLabel: false,
        condition: (row: PublicViolationDto) => row.publishStatus === ViolationPublishStatus.Publish
      });
    }
    
    if (this.permissionService.hasPermission('PublicViolation', 'Delete') || this.permissionService.isSuperAdmin()) {
      this.actions.push({
        label: 'حذف',
        icon: Trash2,
        action: (row) => this.deleteViolation(row),
        class: 'btn-delete',
        variant: 'danger',
        showLabel: false
      });
    }
  }

  loadPublicViolations(): void {
    this.loading = true;
    const filter = this.buildFilter();
    
    if (Object.keys(filter).length > 0) {
      this.publicViolationService.getAllPublicViolationsWithFilter(
        filter,
        this.currentPage,
        this.pageSize
      ).subscribe({
        next: (response) => {
          this.handleResponse(response);
        },
        error: (error) => {
          console.error('Error loading public violations:', error);
          this.loading = false;
          this.toasterService.showError('حدث خطأ أثناء تحميل البلاغات');
        }
      });
    } else {
      this.publicViolationService.getAllPublicViolations(
        this.currentPage,
        this.pageSize
      ).subscribe({
        next: (response) => {
          this.handleResponse(response);
        },
        error: (error) => {
          console.error('Error loading public violations:', error);
          this.loading = false;
          this.toasterService.showError('حدث خطأ أثناء تحميل البلاغات');
        }
      });
    }
  }

  handleResponse(response: any): void {
    if (response.success && response.data) {
      if (response.data && typeof response.data === 'object' && 'items' in response.data) {
        this.publicViolations = response.data.items || [];
        this.totalCount = response.data.totalCount || 0;
        this.totalPages = response.data.totalPages || 0;
        this.currentPage = response.data.currentPage || 1;
      } else if (Array.isArray(response.data)) {
        this.publicViolations = response.data;
        this.totalCount = response.data.length;
        this.totalPages = 1;
        this.currentPage = 1;
      }
      // Initialize filtered violations and apply search if needed
      this.filteredViolations = [...this.publicViolations];
      if (this.searchTerm) {
        this.applyClientSideSearch();
      }
    }
    this.loading = false;
  }

  applyClientSideSearch(): void {
    if (!this.searchTerm || this.searchTerm.trim() === '') {
      this.filteredViolations = [...this.publicViolations];
      return;
    }

    const searchLower = this.searchTerm.toLowerCase().trim();
    this.filteredViolations = this.publicViolations.filter(violation => {
      // Search in various fields
      const searchableFields = [
        violation.id?.toString() || '',
        violation.cityName || '',
        violation.categoryName || '',
        violation.subCategoryName || '',
        violation.address || '',
        violation.description || '',
        getPublicViolationTypeLabel(violation.violationType),
        getVerificationStatusLabel(violation.verificationStatus),
        getPublishStatusLabel(violation.publishStatus),
        violation.email || ''
      ];

      return searchableFields.some(field => 
        field.toLowerCase().includes(searchLower)
      );
    });
  }

  onSearchChange(searchTerm: string): void {
    this.searchTerm = searchTerm;
    this.applyClientSideSearch();
  }

  buildFilter(): PublicViolationFilter {
    const formValue = this.filterForm.value;
    const filter: PublicViolationFilter = {};
    
    // Convert enum values to numbers (backend expects integers, not strings)
    if (formValue.verificationStatus !== null && formValue.verificationStatus !== undefined && formValue.verificationStatus !== '') {
      filter.verificationStatus = Number(formValue.verificationStatus) as ViolationVerificationStatus;
    }
    if (formValue.publishStatus !== null && formValue.publishStatus !== undefined && formValue.publishStatus !== '') {
      filter.publishStatus = Number(formValue.publishStatus) as ViolationPublishStatus;
    }
    if (formValue.violationType !== null && formValue.violationType !== undefined && formValue.violationType !== '') {
      filter.violationType = Number(formValue.violationType) as PublicViolationType;
    }
    if (formValue.cityId !== null && formValue.cityId !== undefined && formValue.cityId !== '') {
      filter.cityId = Number(formValue.cityId);
    }
    if (formValue.categoryId !== null && formValue.categoryId !== undefined && formValue.categoryId !== '') {
      filter.categoryId = Number(formValue.categoryId);
    }
    if (formValue.subCategoryId !== null && formValue.subCategoryId !== undefined && formValue.subCategoryId !== '') {
      filter.subCategoryId = Number(formValue.subCategoryId);
    }
    
    return filter;
  }

  applyFilters(): void {
    this.currentPage = 1;
    this.searchTerm = ''; // Reset search when applying filters
    this.filteredViolations = [];
    this.loadPublicViolations();
  }

  resetFilters(): void {
    this.filterForm.reset();
    this.subCategories = [];
    this.currentPage = 1;
    this.searchTerm = ''; // Reset search when resetting filters
    this.filteredViolations = [];
    this.loadPublicViolations();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadPublicViolations();
  }

  viewDetails(violation: PublicViolationDto): void {
    // Load full violation details to ensure we have all fields including attachments
    this.publicViolationService.getPublicViolationById(violation.id).subscribe({
      next: (fullViolation) => {
        this.selectedViolation = fullViolation;
        this.showDetailsModal = true;
        // TODO: Load follow-ups when ViolationFollowUp entity is implemented
        // this.loadFollowUps();
      },
      error: (error) => {
        console.error('Error loading violation details:', error);
        this.toasterService.showError('حدث خطأ أثناء تحميل تفاصيل البلاغ');
      }
    });
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedViolation = null;
  }

  editDescription(violation: PublicViolationDto): void {
    if (!this.permissionService.hasPermission('PublicViolation', 'Update') && !this.permissionService.isSuperAdmin()) {
      this.toasterService.showWarning('ليس لديك صلاحية لتعديل الوصف', 'صلاحية مرفوضة');
      return;
    }
    
    this.modalTitle = 'تعديل الوصف';
    this.editingViolation = violation;
    this.descriptionForm.patchValue({
      description: violation.description
    });
    this.showModal = true;
  }

  updateDescription(): void {
    if (this.descriptionForm.valid && this.editingViolation) {
      const description = this.descriptionForm.get('description')?.value;
      
      this.publicViolationService.updateDescription(this.editingViolation.id, description).subscribe({
        next: (updatedViolation) => {
          this.toasterService.showSuccess('تم تحديث الوصف بنجاح');
          this.closeModal();
          this.loadPublicViolations();
        },
        error: (error) => {
          console.error('Error updating description:', error);
          this.toasterService.showError(error.message || 'حدث خطأ أثناء تحديث الوصف');
        }
      });
    } else {
      Object.keys(this.descriptionForm.controls).forEach(key => {
        this.descriptionForm.get(key)?.markAsTouched();
      });
      this.toasterService.showWarning('يرجى إدخال الوصف');
    }
  }

  verifyViolation(violation: PublicViolationDto): void {
    if (!this.permissionService.hasPermission('PublicViolation', 'Verify') && !this.permissionService.isSuperAdmin()) {
      this.toasterService.showWarning('ليس لديك صلاحية لتوثيق البلاغ', 'صلاحية مرفوضة');
      return;
    }
    
    this.confirmationService.show({
      title: 'تأكيد التوثيق',
      message: `هل أنت متأكد من توثيق البلاغ #${violation.id}؟`,
      confirmText: 'توثيق',
      cancelText: 'إلغاء',
      type: 'info'
    }).then(confirmed => {
      if (confirmed) {
        this.publicViolationService.verifyViolation(violation.id).subscribe({
          next: (updatedViolation) => {
            this.toasterService.showSuccess('تم توثيق البلاغ بنجاح');
            this.loadPublicViolations();
          },
          error: (error) => {
            console.error('Error verifying violation:', error);
            this.toasterService.showError(error.message || 'حدث خطأ أثناء توثيق البلاغ');
          }
        });
      }
    });
  }

  unverifyViolation(violation: PublicViolationDto): void {
    if (!this.permissionService.hasPermission('PublicViolation', 'Verify') && !this.permissionService.isSuperAdmin()) {
      this.toasterService.showWarning('ليس لديك صلاحية لإلغاء توثيق البلاغ', 'صلاحية مرفوضة');
      return;
    }
    
    this.confirmationService.show({
      title: 'تأكيد إلغاء التوثيق',
      message: `هل أنت متأكد من إلغاء توثيق البلاغ #${violation.id}؟`,
      confirmText: 'إلغاء التوثيق',
      cancelText: 'إلغاء',
      type: 'warning'
    }).then(confirmed => {
      if (confirmed) {
        this.publicViolationService.unverifyViolation(violation.id).subscribe({
          next: (updatedViolation) => {
            this.toasterService.showSuccess('تم إلغاء توثيق البلاغ بنجاح');
            this.loadPublicViolations();
          },
          error: (error) => {
            console.error('Error unverifying violation:', error);
            this.toasterService.showError(error.message || 'حدث خطأ أثناء إلغاء توثيق البلاغ');
          }
        });
      }
    });
  }

  publishViolation(violation: PublicViolationDto): void {
    if (!this.permissionService.hasPermission('PublicViolation', 'Publish') && !this.permissionService.isSuperAdmin()) {
      this.toasterService.showWarning('ليس لديك صلاحية لنشر البلاغ', 'صلاحية مرفوضة');
      return;
    }
    
    this.confirmationService.show({
      title: 'تأكيد النشر',
      message: `هل أنت متأكد من نشر البلاغ #${violation.id}؟`,
      confirmText: 'نشر',
      cancelText: 'إلغاء',
      type: 'info'
    }).then(confirmed => {
      if (confirmed) {
        this.publicViolationService.publishViolation(violation.id).subscribe({
          next: (updatedViolation) => {
            this.toasterService.showSuccess('تم نشر البلاغ بنجاح');
            this.loadPublicViolations();
          },
          error: (error) => {
            console.error('Error publishing violation:', error);
            this.toasterService.showError(error.message || 'حدث خطأ أثناء نشر البلاغ');
          }
        });
      }
    });
  }

  unpublishViolation(violation: PublicViolationDto): void {
    if (!this.permissionService.hasPermission('PublicViolation', 'Publish') && !this.permissionService.isSuperAdmin()) {
      this.toasterService.showWarning('ليس لديك صلاحية لإلغاء نشر البلاغ', 'صلاحية مرفوضة');
      return;
    }
    
    this.confirmationService.show({
      title: 'تأكيد إلغاء النشر',
      message: `هل أنت متأكد من إلغاء نشر البلاغ #${violation.id}؟`,
      confirmText: 'إلغاء النشر',
      cancelText: 'إلغاء',
      type: 'warning'
    }).then(confirmed => {
      if (confirmed) {
        this.publicViolationService.unpublishViolation(violation.id).subscribe({
          next: (updatedViolation) => {
            this.toasterService.showSuccess('تم إلغاء نشر البلاغ بنجاح');
            this.loadPublicViolations();
          },
          error: (error) => {
            console.error('Error unpublishing violation:', error);
            this.toasterService.showError(error.message || 'حدث خطأ أثناء إلغاء نشر البلاغ');
          }
        });
      }
    });
  }

  deleteViolation(violation: PublicViolationDto): void {
    if (!this.permissionService.hasPermission('PublicViolation', 'Delete') && !this.permissionService.isSuperAdmin()) {
      this.toasterService.showWarning('ليس لديك صلاحية لحذف البلاغ', 'صلاحية مرفوضة');
      return;
    }
    
    this.confirmationService.show({
      title: 'تأكيد الحذف',
      message: `هل أنت متأكد من حذف البلاغ #${violation.id}؟`,
      confirmText: 'حذف',
      cancelText: 'إلغاء',
      type: 'danger'
    }).then(confirmed => {
      if (confirmed) {
        this.publicViolationService.deletePublicViolation(violation.id).subscribe({
          next: () => {
            this.toasterService.showSuccess('تم حذف البلاغ بنجاح');
            this.loadPublicViolations();
          },
          error: (error) => {
            console.error('Error deleting violation:', error);
            this.toasterService.showError(error.message || 'حدث خطأ أثناء حذف البلاغ');
          }
        });
      }
    });
  }

  closeModal(): void {
    this.showModal = false;
    this.editingViolation = null;
    this.descriptionForm.reset();
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.descriptionForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  // Helper methods
  getViolationTypeLabel(type: PublicViolationType): string {
    return getPublicViolationTypeLabel(type);
  }

  getVerificationStatusLabel(status: ViolationVerificationStatus): string {
    return getVerificationStatusLabel(status);
  }

  getPublishStatusLabel(status: ViolationPublishStatus): string {
    return getPublishStatusLabel(status);
  }

  getAttachmentUrl(filePath: string): string {
    if (!filePath) return '';
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
      return filePath;
    }
    const baseUrl = environment.apiUrl.replace('/api', '');
    return `${baseUrl}${filePath.startsWith('/') ? '' : '/'}${filePath}`;
  }

  isImage(fileType: string): boolean {
    if (!fileType) return false;
    const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', '.png', '.jpg', '.jpeg', '.gif', '.webp'];
    return imageTypes.some(type => fileType.toLowerCase().includes(type.toLowerCase()));
  }

  isVideo(fileType: string): boolean {
    if (!fileType) return false;
    const videoTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', '.mp4', '.webm', '.ogg', '.mov', '.avi'];
    return videoTypes.some(type => fileType.toLowerCase().includes(type.toLowerCase()));
  }

  openAttachment(filePath: string): void {
    const url = this.getAttachmentUrl(filePath);
    if (url) {
      window.open(url, '_blank');
    }
  }

  loadFollowUpStatuses(): void {
    this.followUpStatusService.getAllFollowUpStatuses(undefined, undefined, true).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.followUpStatuses = Array.isArray(response.data) ? response.data : response.data.items || [];
        }
      },
      error: (error: any) => {
        console.error('Error loading follow-up statuses:', error);
      }
    });
  }

  openFollowUpModal(violation: PublicViolationDto): void {
    if (!this.permissionService.hasPermission('ViolationFollowUp', 'Create') && !this.permissionService.isSuperAdmin()) {
      this.toasterService.showWarning('ليس لديك صلاحية لإضافة Follow-up', 'صلاحية مرفوضة');
      return;
    }

    this.selectedViolationForFollowUp = violation;
    this.followUpForm.reset();
    this.loadFollowUps(violation.id);
    this.showFollowUpModal = true;
  }

  closeFollowUpModal(): void {
    this.showFollowUpModal = false;
    this.selectedViolationForFollowUp = null;
    this.followUps = [];
    this.followUpForm.reset();
  }

  loadFollowUps(violationId: number): void {
    this.loadingFollowUps = true;
    this.violationFollowUpService.getByViolationId(violationId, 'Public').subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.followUps = response.data;
        }
        this.loadingFollowUps = false;
      },
      error: (error: any) => {
        console.error('Error loading follow-ups:', error);
        this.toasterService.showError('حدث خطأ أثناء تحميل سجل المتابعة');
        this.loadingFollowUps = false;
      }
    });
  }

  saveFollowUp(): void {
    if (!this.selectedViolationForFollowUp || this.followUpForm.invalid) {
      return;
    }

    const dto: AddViolationFollowUpDto = {
      violationId: this.selectedViolationForFollowUp.id,
      violationType: 'Public',
      followUpStatusId: this.followUpForm.get('followUpStatusId')?.value,
      note: this.followUpForm.get('note')?.value
    };

    this.loading = true;
    this.violationFollowUpService.addFollowUp(dto).subscribe({
      next: () => {
        this.toasterService.showSuccess('تم إضافة Follow-up بنجاح');
        this.followUpForm.reset();
        this.loadFollowUps(this.selectedViolationForFollowUp!.id);
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error adding follow-up:', error);
        this.toasterService.showError(error.message || 'حدث خطأ أثناء إضافة Follow-up');
        this.loading = false;
      }
    });
  }
}
