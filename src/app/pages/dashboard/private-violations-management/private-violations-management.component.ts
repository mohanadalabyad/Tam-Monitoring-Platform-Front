import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PrivateViolationService } from '../../../services/private-violation.service';
import { ViolationFollowUpService } from '../../../services/violation-follow-up.service';
import { FollowUpStatusService } from '../../../services/follow-up-status.service';
import { CityService } from '../../../services/city.service';
import { CategoryService } from '../../../services/category.service';
import { SubCategoryService } from '../../../services/subcategory.service';
import { ToasterService } from '../../../services/toaster.service';
import { PermissionCheckService } from '../../../services/permission-check.service';
import { ConfirmationDialogService } from '../../../services/confirmation-dialog.service';
import { 
  PrivateViolationDto, 
  PrivateViolationFilter,
  AcceptanceStatus,
  PublishStatus,
  getAcceptanceStatusLabel,
  getPublishStatusLabel,
  getMaritalStatusLabel
} from '../../../models/violation.model';
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
  selector: 'app-private-violations-management',
  templateUrl: './private-violations-management.component.html',
  styleUrls: ['./private-violations-management.component.scss']
})
export class PrivateViolationsManagementComponent implements OnInit {
  violations: PrivateViolationDto[] = [];
  filteredViolations: PrivateViolationDto[] = [];
  loading = false;
  viewMode: ViewMode = 'table';
  showDetailsModal = false;
  selectedViolation: PrivateViolationDto | null = null;
  showEditDescriptionModal = false;
  editingViolation: PrivateViolationDto | null = null;
  editDescriptionForm!: FormGroup;
  showFollowUpModal = false;
  selectedViolationForFollowUp: PrivateViolationDto | null = null;
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
      key: 'violationDate', 
      label: 'تاريخ الحادثة', 
      sortable: true, 
      filterable: false,
      type: 'date'
    },
    { key: 'location', label: 'الموقع', sortable: false, filterable: false },
    { 
      key: 'acceptanceStatus', 
      label: 'حالة الموافقة', 
      sortable: true, 
      filterable: false,
      type: 'badge',
      render: (value) => getAcceptanceStatusLabel(value)
    },
    { 
      key: 'publishStatus', 
      label: 'حالة النشر', 
      sortable: true, 
      filterable: false,
      type: 'badge',
      render: (value) => getPublishStatusLabel(value)
    },
    { key: 'createdByUserName', label: 'أنشئ بواسطة', sortable: false, filterable: false },
    { 
      key: 'creationDate', 
      label: 'تاريخ الإنشاء', 
      sortable: true, 
      filterable: false,
      type: 'date'
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

  // Enums
  AcceptanceStatus = AcceptanceStatus;
  PublishStatus = PublishStatus;

  constructor(
    private privateViolationService: PrivateViolationService,
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
    const savedView = localStorage.getItem('private-violations-view-mode');
    if (savedView === 'table' || savedView === 'cards') {
      this.viewMode = savedView;
    }
    this.initForms();
    this.loadLookupData();
    this.loadFollowUpStatuses();
    this.loadViolations();
    setTimeout(() => {
      this.setupActions();
    }, 0);
    this.filteredViolations = [];
  }

  initForms(): void {
    this.filterForm = this.fb.group({
      acceptanceStatus: [null],
      publishStatus: [null],
      cityId: [null],
      categoryId: [null],
      subCategoryId: [null]
    });

    this.editDescriptionForm = this.fb.group({
      description: [''],
      publishDescription: ['']
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
    localStorage.setItem('private-violations-view-mode', view);
  }

  setupActions(): void {
    this.actions = [];
    
    if (this.permissionService.hasPermission('PrivateViolation', 'Read') || this.permissionService.isSuperAdmin()) {
      this.actions.push({
        label: 'عرض التفاصيل',
        icon: Eye,
        action: (row) => this.viewDetails(row),
        class: 'btn-view',
        variant: 'info',
        showLabel: false
      });
    }
    
    if (this.permissionService.hasPermission('PrivateViolation', 'Approve') || this.permissionService.isSuperAdmin()) {
      this.actions.push({
        label: 'موافقة',
        icon: CheckCircle,
        action: (row) => this.approveViolation(row),
        class: 'btn-approve',
        variant: 'success',
        showLabel: false,
        condition: (row: PrivateViolationDto) => row.acceptanceStatus === AcceptanceStatus.Pending
      });
    }
    
    if (this.permissionService.hasPermission('PrivateViolation', 'Reject') || this.permissionService.isSuperAdmin()) {
      this.actions.push({
        label: 'رفض',
        icon: XCircle,
        action: (row) => this.rejectViolation(row),
        class: 'btn-reject',
        variant: 'danger',
        showLabel: false,
        condition: (row: PrivateViolationDto) => row.acceptanceStatus === AcceptanceStatus.Pending
      });
    }
    
    if (this.permissionService.hasPermission('PrivateViolation', 'Publish') || this.permissionService.isSuperAdmin()) {
      this.actions.push({
        label: 'نشر',
        icon: Upload,
        action: (row) => this.publishViolation(row),
        class: 'btn-publish',
        variant: 'success',
        showLabel: false,
        condition: (row: PrivateViolationDto) => row.acceptanceStatus === AcceptanceStatus.Approved && row.publishStatus === PublishStatus.NotPublish
      });
      
      this.actions.push({
        label: 'إلغاء النشر',
        icon: Download,
        action: (row) => this.unpublishViolation(row),
        class: 'btn-unpublish',
        variant: 'warning',
        showLabel: false,
        condition: (row: PrivateViolationDto) => row.publishStatus === PublishStatus.Publish
      });
    }
    
    if (this.permissionService.hasPermission('PrivateViolation', 'Update') || this.permissionService.isSuperAdmin()) {
      this.actions.push({
        label: 'تعديل الوصف',
        icon: Pencil,
        action: (row) => this.openEditDescriptionModal(row),
        class: 'btn-edit',
        variant: 'info',
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
    
    if (this.permissionService.hasPermission('PrivateViolation', 'Delete') || this.permissionService.isSuperAdmin()) {
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

  loadViolations(): void {
    this.loading = true;
    const filter = this.buildFilter();
    
    if (Object.keys(filter).length > 0) {
      this.privateViolationService.getAllPrivateViolationsWithFilter(
        filter,
        this.currentPage,
        this.pageSize
      ).subscribe({
        next: (response) => {
          this.handleResponse(response);
        },
        error: (error) => {
          console.error('Error loading violations:', error);
          this.loading = false;
          this.toasterService.showError('حدث خطأ أثناء تحميل البلاغات');
        }
      });
    } else {
      this.privateViolationService.getAllPrivateViolations(
        this.currentPage,
        this.pageSize
      ).subscribe({
        next: (response) => {
          this.handleResponse(response);
        },
        error: (error) => {
          console.error('Error loading violations:', error);
          this.loading = false;
          this.toasterService.showError('حدث خطأ أثناء تحميل البلاغات');
        }
      });
    }
  }

  handleResponse(response: any): void {
    if (response.success && response.data) {
      if (response.data && typeof response.data === 'object' && 'items' in response.data) {
        this.violations = response.data.items || [];
        this.totalCount = response.data.totalCount || 0;
        this.totalPages = response.data.totalPages || 0;
        this.currentPage = response.data.currentPage || 1;
      } else if (Array.isArray(response.data)) {
        this.violations = response.data;
        this.totalCount = response.data.length;
        this.totalPages = 1;
        this.currentPage = 1;
      }
      this.filteredViolations = [...this.violations];
      if (this.searchTerm) {
        this.applyClientSideSearch();
      }
    }
    this.loading = false;
  }

  buildFilter(): PrivateViolationFilter {
    const formValue = this.filterForm.value;
    const filter: PrivateViolationFilter = {};
    
    if (formValue.acceptanceStatus !== null && formValue.acceptanceStatus !== undefined && formValue.acceptanceStatus !== '') {
      filter.acceptanceStatus = Number(formValue.acceptanceStatus) as AcceptanceStatus;
    }
    if (formValue.publishStatus !== null && formValue.publishStatus !== undefined && formValue.publishStatus !== '') {
      filter.publishStatus = Number(formValue.publishStatus) as PublishStatus;
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
    this.searchTerm = '';
    this.filteredViolations = [];
    this.loadViolations();
  }

  resetFilters(): void {
    this.filterForm.reset();
    this.subCategories = [];
    this.currentPage = 1;
    this.searchTerm = '';
    this.filteredViolations = [];
    this.loadViolations();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadViolations();
  }

  applyClientSideSearch(): void {
    if (!this.searchTerm || this.searchTerm.trim() === '') {
      this.filteredViolations = [...this.violations];
      return;
    }

    const searchLower = this.searchTerm.toLowerCase().trim();
    this.filteredViolations = this.violations.filter(violation => {
      const searchableFields = [
        violation.id?.toString() || '',
        violation.cityName || '',
        violation.categoryName || '',
        violation.subCategoryName || '',
        violation.location || '',
        violation.description || '',
        violation.createdByUserName || '',
        getAcceptanceStatusLabel(violation.acceptanceStatus),
        getPublishStatusLabel(violation.publishStatus)
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

  viewDetails(violation: PrivateViolationDto): void {
    this.privateViolationService.getPrivateViolationById(violation.id).subscribe({
      next: (fullViolation) => {
        this.selectedViolation = fullViolation;
        this.showDetailsModal = true;
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

  openEditDescriptionModal(violation: PrivateViolationDto): void {
    if (!this.permissionService.hasPermission('PrivateViolation', 'Update') && !this.permissionService.isSuperAdmin()) {
      this.toasterService.showWarning('ليس لديك صلاحية لتعديل الوصف', 'صلاحية مرفوضة');
      return;
    }

    this.editingViolation = violation;
    this.editDescriptionForm.patchValue({
      description: violation.description || '',
      publishDescription: violation.publishDescription || ''
    });
    this.showEditDescriptionModal = true;
  }

  closeEditDescriptionModal(): void {
    this.showEditDescriptionModal = false;
    this.editingViolation = null;
    this.editDescriptionForm.reset();
  }

  saveDescription(): void {
    if (!this.editingViolation || this.editDescriptionForm.invalid) {
      return;
    }

    const dto = {
      description: this.editDescriptionForm.get('description')?.value || null,
      publishDescription: this.editDescriptionForm.get('publishDescription')?.value || null
    };

    this.loading = true;
    this.privateViolationService.updateDescription(this.editingViolation.id, dto).subscribe({
      next: (updatedViolation) => {
        this.toasterService.showSuccess('تم تحديث الوصف بنجاح');
        this.closeEditDescriptionModal();
        this.loadViolations();
        // Update selected violation if it's the same one
        if (this.selectedViolation && this.selectedViolation.id === updatedViolation.id) {
          this.selectedViolation = updatedViolation;
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error updating description:', error);
        this.toasterService.showError(error.message || 'حدث خطأ أثناء تحديث الوصف');
        this.loading = false;
      }
    });
  }

  approveViolation(violation: PrivateViolationDto): void {
    if (!this.permissionService.hasPermission('PrivateViolation', 'Approve') && !this.permissionService.isSuperAdmin()) {
      this.toasterService.showWarning('ليس لديك صلاحية للموافقة على البلاغ', 'صلاحية مرفوضة');
      return;
    }
    
    this.confirmationService.show({
      title: 'تأكيد الموافقة',
      message: `هل أنت متأكد من الموافقة على البلاغ #${violation.id}؟`,
      confirmText: 'موافقة',
      cancelText: 'إلغاء',
      type: 'info'
    }).then(confirmed => {
      if (confirmed) {
        this.privateViolationService.approveViolation(violation.id).subscribe({
          next: () => {
            this.toasterService.showSuccess('تم الموافقة على البلاغ بنجاح');
            this.loadViolations();
          },
          error: (error) => {
            console.error('Error approving violation:', error);
            this.toasterService.showError(error.message || 'حدث خطأ أثناء الموافقة على البلاغ');
          }
        });
      }
    });
  }

  rejectViolation(violation: PrivateViolationDto): void {
    if (!this.permissionService.hasPermission('PrivateViolation', 'Reject') && !this.permissionService.isSuperAdmin()) {
      this.toasterService.showWarning('ليس لديك صلاحية لرفض البلاغ', 'صلاحية مرفوضة');
      return;
    }
    
    this.confirmationService.show({
      title: 'تأكيد الرفض',
      message: `هل أنت متأكد من رفض البلاغ #${violation.id}؟`,
      confirmText: 'رفض',
      cancelText: 'إلغاء',
      type: 'danger'
    }).then(confirmed => {
      if (confirmed) {
        this.privateViolationService.rejectViolation(violation.id).subscribe({
          next: () => {
            this.toasterService.showSuccess('تم رفض البلاغ بنجاح');
            this.loadViolations();
          },
          error: (error) => {
            console.error('Error rejecting violation:', error);
            this.toasterService.showError(error.message || 'حدث خطأ أثناء رفض البلاغ');
          }
        });
      }
    });
  }

  publishViolation(violation: PrivateViolationDto): void {
    if (!this.permissionService.hasPermission('PrivateViolation', 'Publish') && !this.permissionService.isSuperAdmin()) {
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
        this.privateViolationService.publishViolation(violation.id).subscribe({
          next: () => {
            this.toasterService.showSuccess('تم نشر البلاغ بنجاح');
            this.loadViolations();
          },
          error: (error) => {
            console.error('Error publishing violation:', error);
            this.toasterService.showError(error.message || 'حدث خطأ أثناء نشر البلاغ');
          }
        });
      }
    });
  }

  unpublishViolation(violation: PrivateViolationDto): void {
    if (!this.permissionService.hasPermission('PrivateViolation', 'Unpublish') && !this.permissionService.isSuperAdmin()) {
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
        this.privateViolationService.unpublishViolation(violation.id).subscribe({
          next: () => {
            this.toasterService.showSuccess('تم إلغاء نشر البلاغ بنجاح');
            this.loadViolations();
          },
          error: (error) => {
            console.error('Error unpublishing violation:', error);
            this.toasterService.showError(error.message || 'حدث خطأ أثناء إلغاء نشر البلاغ');
          }
        });
      }
    });
  }

  deleteViolation(violation: PrivateViolationDto): void {
    if (!this.permissionService.hasPermission('PrivateViolation', 'Delete') && !this.permissionService.isSuperAdmin()) {
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
        this.privateViolationService.deletePrivateViolation(violation.id).subscribe({
          next: () => {
            this.toasterService.showSuccess('تم حذف البلاغ بنجاح');
            this.loadViolations();
          },
          error: (error) => {
            console.error('Error deleting violation:', error);
            this.toasterService.showError(error.message || 'حدث خطأ أثناء حذف البلاغ');
          }
        });
      }
    });
  }

  // Helper methods
  getAcceptanceStatusLabel(status: AcceptanceStatus): string {
    return getAcceptanceStatusLabel(status);
  }

  getPublishStatusLabel(status: PublishStatus): string {
    return getPublishStatusLabel(status);
  }

  getMaritalStatusLabel(status: any): string {
    return status ? getMaritalStatusLabel(status) : '';
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

  openFollowUpModal(violation: PrivateViolationDto): void {
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
    this.violationFollowUpService.getByViolationId(violationId, 'Private').subscribe({
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
      violationType: 'Private',
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
