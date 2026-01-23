import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { ViolationService } from '../../../services/violation.service';
import { CityService } from '../../../services/city.service';
import { CategoryService } from '../../../services/category.service';
import { SubCategoryService } from '../../../services/subcategory.service';
import { QuestionService } from '../../../services/question.service';
import { ToasterService } from '../../../services/toaster.service';
import { PermissionCheckService } from '../../../services/permission-check.service';
import { ConfirmationDialogService } from '../../../services/confirmation-dialog.service';
import { AuthService } from '../../../auth/auth.service';
import { FileUploadService, FileUploadResponse } from '../../../services/file-upload.service';
import {
  ViolationDto,
  UpdatePublicViolationDto,
  UpdatePrivateViolationDto,
  AddPrivateViolationDto,
  QuestionAnswerDto,
  AttachmentDto,
  ViolationType,
  AcceptanceStatus,
  PublishStatus,
  ViolationFilter,
  getViolationTypeLabel,
  getAcceptanceStatusLabel,
  getPublishStatusLabel
} from '../../../models/violation.model';
import { QuestionDto, QuestionFilter } from '../../../models/question.model';
import { CityDto } from '../../../models/city.model';
import { CategoryDto } from '../../../models/category.model';
import { SubCategoryDto, SubCategoryFilter } from '../../../models/subcategory.model';
import { TableColumn, TableAction } from '../../../components/unified-table/unified-table.component';
import { ViewMode } from '../../../components/view-toggle/view-toggle.component';
import { Pencil, Trash2, AlertCircle, CheckCircle, XCircle, Eye, Printer, Power, PowerOff, X, Check, Upload, Video } from 'lucide-angular';

@Component({
  selector: 'app-violations-management',
  templateUrl: './violations-management.component.html',
  styleUrls: ['./violations-management.component.scss']
})
export class ViolationsManagementComponent implements OnInit {
  violations: ViolationDto[] = [];
  cities: CityDto[] = [];
  categories: CategoryDto[] = [];
  subCategories: SubCategoryDto[] = [];
  filteredSubCategories: SubCategoryDto[] = [];
  questions: QuestionDto[] = [];
  sortedQuestions: QuestionDto[] = [];
  filteredQuestions: QuestionDto[] = [];
  loading = false;
  
  // File upload
  attachments: File[] = [];
  attachmentPreviews: { file: File; preview: string; uploaded?: boolean; filePath?: string }[] = [];
  uploadingFiles = false;
  showModal = false;
  modalTitle = '';
  violationForm!: FormGroup;
  questionsForm!: FormGroup;
  editingViolation: ViolationDto | null = null;
  viewMode: ViewMode = 'table';
  togglingViolations: Set<number> = new Set();
  
  // Print view
  showPrintView = false;
  printViewHtml = '';
  loadingPrintView = false;
  
  // Filters
  filterForm!: FormGroup;
  showFilters = false;

  columns: TableColumn[] = [
    { key: 'id', label: 'ID', sortable: true, filterable: false },
    { 
      key: 'violationType', 
      label: 'النوع', 
      sortable: true, 
      filterable: false,
      type: 'badge',
      render: (value) => getViolationTypeLabel(value)
    },
    { 
      key: 'acceptanceStatus', 
      label: 'حالة القبول', 
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
    { 
      key: 'city', 
      label: 'المدينة', 
      sortable: false, 
      filterable: false,
      render: (value, row) => row.city?.name || 'غير محدد'
    },
    { 
      key: 'category', 
      label: 'الفئة', 
      sortable: false, 
      filterable: false,
      render: (value, row) => row.category?.name || 'غير محدد'
    },
    { 
      key: 'violationDate', 
      label: 'تاريخ الحادثة', 
      sortable: true, 
      filterable: false,
      type: 'date'
    }
  ];

  actions: TableAction[] = [];
  
  // Lucide icons
  Pencil = Pencil;
  Trash2 = Trash2;
  AlertCircle = AlertCircle;
  CheckCircle = CheckCircle;
  XCircle = XCircle;
  Eye = Eye;
  Printer = Printer;
  Power = Power;
  PowerOff = PowerOff;
  X = X;
  Check = Check;
  Upload = Upload;
  Video = Video;

  // Enums
  ViolationType = ViolationType;
  AcceptanceStatus = AcceptanceStatus;
  PublishStatus = PublishStatus;

  constructor(
    private violationService: ViolationService,
    private cityService: CityService,
    private categoryService: CategoryService,
    private subCategoryService: SubCategoryService,
    private questionService: QuestionService,
    private toasterService: ToasterService,
    public permissionService: PermissionCheckService,
    private confirmationService: ConfirmationDialogService,
    private authService: AuthService,
    private fileUploadService: FileUploadService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    const savedView = localStorage.getItem('violations-view-mode');
    if (savedView === 'table' || savedView === 'cards') {
      this.viewMode = savedView;
    }
    this.initForms();
    this.loadCities();
    this.loadCategories();
    // Don't load questions on init - wait for category selection
    this.loadViolations();
    // Setup actions after a brief delay to ensure user data is loaded
    setTimeout(() => {
      this.setupActions();
    }, 0);
  }

  onViewChange(view: ViewMode): void {
    this.viewMode = view;
    localStorage.setItem('violations-view-mode', view);
  }

  initForms(): void {
    this.violationForm = this.fb.group({
      cityId: ['', Validators.required],
      categoryId: ['', Validators.required],
      subCategoryId: ['', Validators.required],
      violationDate: ['', Validators.required],
      location: ['', Validators.required],
      description: ['', Validators.required],
      isWitness: [false]
    });

    // Questions form
    this.questionsForm = this.fb.group({});

    // Watch category changes to filter subcategories and load questions
    this.violationForm.get('categoryId')?.valueChanges.subscribe(categoryId => {
      this.onCategoryChange(categoryId);
      // Load questions for selected category
      this.loadQuestions(categoryId);
    });

    // Filter form
    this.filterForm = this.fb.group({
      violationType: [''],
      acceptanceStatus: [''],
      publishStatus: [''],
      cityId: [''],
      categoryId: [''],
      subCategoryId: [''],
      startDate: [''],
      endDate: ['']
    });

    this.filterForm.get('categoryId')?.valueChanges.subscribe(categoryId => {
      this.onFilterCategoryChange(categoryId);
    });
  }

  setupActions(): void {
    this.actions = [];
    
    // View/Print (always visible if Read permission)
    if (this.permissionService.hasPermission('Violation', 'Read') || this.permissionService.isSuperAdmin()) {
      this.actions.push({
        label: 'عرض',
        icon: Eye,
        action: (row) => this.viewViolation(row),
        class: 'btn-view',
        variant: 'info',
        showLabel: false
      });
      this.actions.push({
        label: 'طباعة',
        icon: Printer,
        action: (row) => this.printViolation(row),
        class: 'btn-print',
        variant: 'info',
        showLabel: false
      });
    }
    
    // Approve (if Pending)
    if (this.permissionService.hasPermission('Violation', 'Approve') || this.permissionService.isSuperAdmin()) {
      this.actions.push({
        label: 'موافقة',
        icon: CheckCircle,
        action: (row) => this.approveViolation(row),
        class: 'btn-approve',
        variant: 'success',
        showLabel: false,
        condition: (row) => row.acceptanceStatus === AcceptanceStatus.Pending
      });
    }
    
    // Reject (if Pending)
    if (this.permissionService.hasPermission('Violation', 'Reject') || this.permissionService.isSuperAdmin()) {
      this.actions.push({
        label: 'رفض',
        icon: XCircle,
        action: (row) => this.rejectViolation(row),
        class: 'btn-reject',
        variant: 'danger',
        showLabel: false,
        condition: (row) => row.acceptanceStatus === AcceptanceStatus.Pending
      });
    }
    
    // Publish (if Approved)
    if (this.permissionService.hasPermission('Violation', 'Publish') || this.permissionService.isSuperAdmin()) {
      this.actions.push({
        label: 'نشر',
        icon: Check,
        action: (row) => this.publishViolation(row),
        class: 'btn-publish',
        variant: 'success',
        showLabel: false,
        condition: (row) => row.acceptanceStatus === AcceptanceStatus.Approved && row.publishStatus === PublishStatus.NotPublish
      });
    }
    
    // Unpublish (if Published)
    if (this.permissionService.hasPermission('Violation', 'Unpublish') || this.permissionService.isSuperAdmin()) {
      this.actions.push({
        label: 'إلغاء النشر',
        icon: X,
        action: (row) => this.unpublishViolation(row),
        class: 'btn-unpublish',
        variant: 'warning',
        showLabel: false,
        condition: (row) => row.publishStatus === PublishStatus.Publish
      });
    }
    
    // Edit
    if (this.permissionService.hasPermission('Violation', 'Update') || this.permissionService.isSuperAdmin()) {
      this.actions.push({
        label: 'تعديل',
        icon: Pencil,
        action: (row) => this.editViolation(row),
        class: 'btn-edit',
        variant: 'warning',
        showLabel: false
      });
    }
    
    // Delete
    if (this.permissionService.hasPermission('Violation', 'Delete') || this.permissionService.isSuperAdmin()) {
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

  loadCities(): void {
    this.cityService.getAllCities(undefined, undefined, true).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.cities = Array.isArray(response.data) ? response.data : response.data.items || [];
        }
      },
      error: (error) => console.error('Error loading cities:', error)
    });
  }

  loadCategories(): void {
    this.categoryService.getAllCategories(true).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.categories = Array.isArray(response.data) ? response.data : response.data.items || [];
        }
      },
      error: (error) => console.error('Error loading categories:', error)
    });
  }

  loadSubCategories(categoryId?: number): void {
    if (categoryId) {
      // Use filter to get subcategories by categoryId
      const filter = { categoryId: categoryId };
      this.subCategoryService.getAllSubCategoriesWithFilter(filter, undefined, undefined, true).subscribe({
        next: (response) => {
          if (response.success && response.data) {
            const subCategories = Array.isArray(response.data) ? response.data : response.data.items || [];
            this.filteredSubCategories = subCategories;
            // Reset subcategory selection when category changes
            this.violationForm.patchValue({ subCategoryId: '' });
          }
        },
        error: (error) => {
          console.error('Error loading subcategories:', error);
          this.toasterService.showError('حدث خطأ أثناء تحميل الفئات الفرعية');
          this.filteredSubCategories = [];
        }
      });
    } else {
      // No category selected, clear subcategories
      this.filteredSubCategories = [];
      this.violationForm.patchValue({ subCategoryId: '' });
    }
  }

  onCategoryChange(categoryId: number | string): void {
    // Convert to number if it's a string (from form)
    const categoryIdNum = typeof categoryId === 'string' ? Number(categoryId) : categoryId;
    if (categoryIdNum) {
      this.loadSubCategories(categoryIdNum);
      this.violationForm.patchValue({ subCategoryId: '' });
    } else {
      this.filteredSubCategories = [];
      this.violationForm.patchValue({ subCategoryId: '' });
    }
  }

  onFilterCategoryChange(categoryId: number): void {
    if (categoryId) {
      this.filteredSubCategories = this.subCategories.filter(sc => sc.categoryId === categoryId);
      this.filterForm.patchValue({ subCategoryId: '' });
    } else {
      this.filteredSubCategories = this.subCategories;
    }
  }

  loadViolations(): void {
    this.loading = true;
    this.violationService.getAllViolations(undefined, undefined, undefined).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.violations = Array.isArray(response.data) ? response.data : response.data.items || [];
        } else {
          this.toasterService.showError(response.message || 'حدث خطأ أثناء تحميل الحوادث');
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading violations:', error);
        this.loading = false;
        this.toasterService.showError('حدث خطأ أثناء تحميل الحوادث');
      }
    });
  }

  applyFilters(): void {
    const filterValue = this.filterForm.value;
    const filter: ViolationFilter = {};
    
    if (filterValue.violationType) filter.violationType = filterValue.violationType;
    if (filterValue.acceptanceStatus) filter.acceptanceStatus = filterValue.acceptanceStatus;
    if (filterValue.publishStatus) filter.publishStatus = filterValue.publishStatus;
    if (filterValue.cityId) filter.cityId = filterValue.cityId;
    if (filterValue.categoryId) filter.categoryId = filterValue.categoryId;
    if (filterValue.subCategoryId) filter.subCategoryId = filterValue.subCategoryId;
    if (filterValue.startDate) filter.startDate = filterValue.startDate;
    if (filterValue.endDate) filter.endDate = filterValue.endDate;

    this.loading = true;
    this.violationService.getAllViolationsWithFilter(filter).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.violations = Array.isArray(response.data) ? response.data : response.data.items || [];
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error filtering violations:', error);
        this.loading = false;
        this.toasterService.showError('حدث خطأ أثناء تصفية الحوادث');
      }
    });
  }

  clearFilters(): void {
    this.filterForm.reset();
    this.loadViolations();
  }

  loadQuestions(categoryId?: number): void {
    // Load questions filtered by category if provided
    if (categoryId) {
      // POST /api/Question/filter with body: { categoryId, isActive: true }
      const filter: QuestionFilter = { 
        categoryId: categoryId,
        isActive: true // Only active questions for violation forms
      };
      // Pass isActive in body, not as query param (backend expects it in body)
      this.questionService.getAllQuestionsWithFilter(filter, undefined, undefined, undefined).subscribe({
        next: (response) => {
          if (response.success && response.data) {
            const questions = Array.isArray(response.data) ? response.data : response.data.items || [];
            this.filteredQuestions = questions;
            // Sort by order
            this.sortedQuestions = [...questions].sort((a, b) => a.order - b.order);
            
            // Rebuild form controls for filtered questions
            // Remove old controls
            this.sortedQuestions.forEach(question => {
              const controlName = `question_${question.id}`;
              if (this.questionsForm.get(controlName)) {
                this.questionsForm.removeControl(controlName);
              }
            });
            
            // Add new controls
            this.sortedQuestions.forEach(question => {
              const validators = question.isRequired ? [Validators.required] : [];
              this.questionsForm.addControl(`question_${question.id}`, this.fb.control('', validators));
            });
          }
        },
        error: (error) => {
          console.error('Error loading questions:', error);
        }
      });
    } else {
      // No category selected, clear questions
      this.filteredQuestions = [];
      this.sortedQuestions = [];
      // Remove all question controls
      Object.keys(this.questionsForm.controls).forEach(key => {
        if (key.startsWith('question_')) {
          this.questionsForm.removeControl(key);
        }
      });
    }
  }

  openAddModal(): void {
    this.modalTitle = 'إضافة حادثة جديدة';
    this.editingViolation = null;
    this.violationForm.reset({
      isWitness: false
    });
    this.questionsForm.reset();
    // Clear all question controls
    Object.keys(this.questionsForm.controls).forEach(key => {
      if (key.startsWith('question_')) {
        this.questionsForm.removeControl(key);
      }
    });
    this.filteredQuestions = [];
    this.sortedQuestions = [];
    this.loadSubCategories();
    this.showModal = true;
  }

  editViolation(violation: ViolationDto): void {
    // Check permission before opening edit modal
    if (!this.permissionService.hasPermission('Violation', 'Update') && !this.permissionService.isSuperAdmin()) {
      this.toasterService.showWarning('ليس لديك صلاحية لتعديل الحوادث', 'صلاحية مرفوضة');
      return;
    }

    // Dashboard only handles private violations
    if (violation.violationType === ViolationType.Public) {
      this.toasterService.showWarning('لا يمكن تعديل الحوادث العامة من لوحة التحكم. يرجى استخدام الموقع العام', 'تنبيه');
      return;
    }

    // Check if violation can be edited (must be Pending status)
    if (violation.acceptanceStatus !== AcceptanceStatus.Pending) {
      this.toasterService.showWarning('لا يمكن تعديل الحادثة بعد الموافقة عليها أو رفضها', 'تنبيه');
      return;
    }

    this.modalTitle = 'تعديل حادثة';
    this.editingViolation = violation;
    this.loadSubCategories(violation.categoryId);
    
    this.violationForm.patchValue({
      cityId: violation.cityId,
      categoryId: violation.categoryId,
      subCategoryId: violation.subCategoryId,
      violationDate: new Date(violation.violationDate).toISOString().split('T')[0],
      location: violation.location,
      description: violation.description,
      isWitness: violation.isWitness || false
    });

    // Load questions for the violation's category
    this.loadQuestions(violation.categoryId);
    
    // Load existing attachments
    this.attachments = [];
    this.attachmentPreviews = [];
    if (violation.attachments && violation.attachments.length > 0) {
      violation.attachments.forEach(att => {
        this.attachmentPreviews.push({
          file: null as any, // Existing file, not a File object
          preview: att.filePath || '',
          uploaded: true,
          filePath: att.filePath
        });
      });
    }
    
    // Populate question answers after questions are loaded
    setTimeout(() => {
      this.questionsForm.reset();
      if (violation.questionAnswers && violation.questionAnswers.length > 0) {
        violation.questionAnswers.forEach(answer => {
          const control = this.questionsForm.get(`question_${answer.questionId}`);
          if (control) {
            control.setValue(answer.answerValue);
          }
        });
      }
    }, 100);
    
    this.showModal = true;
  }

  viewViolation(violation: ViolationDto): void {
    // Open details view or modal
    this.toasterService.showSuccess('عرض تفاصيل الحادثة', 'عرض');
    // TODO: Implement details view
  }

  printViolation(violation: ViolationDto): void {
    // Check permission
    if (!this.permissionService.hasPermission('Violation', 'Read') && !this.permissionService.isSuperAdmin()) {
      this.toasterService.showWarning('ليس لديك صلاحية لعرض الحوادث', 'صلاحية مرفوضة');
      return;
    }

    // Fetch and display print view HTML
    this.loadingPrintView = true;
    this.showPrintView = true;
    this.printViewHtml = '';

    this.violationService.getPrintViewHtml(violation.id).subscribe({
      next: (html) => {
        this.printViewHtml = html;
        this.loadingPrintView = false;
      },
      error: (error) => {
        console.error('Error loading print view:', error);
        this.loadingPrintView = false;
        this.toasterService.showError(error.message || 'حدث خطأ أثناء تحميل صفحة الطباعة');
        this.closePrintView();
      }
    });
  }

  closePrintView(): void {
    this.showPrintView = false;
    this.printViewHtml = '';
  }

  printCurrentView(): void {
    window.print();
  }

  approveViolation(violation: ViolationDto): void {
    this.confirmationService.show({
      title: 'تأكيد الموافقة',
      message: `هل أنت متأكد من الموافقة على الحادثة #${violation.id}؟`,
      confirmText: 'موافقة',
      cancelText: 'إلغاء',
      type: 'info'
    }).then(confirmed => {
      if (confirmed) {
        this.violationService.approveViolation(violation.id).subscribe({
          next: () => {
            this.toasterService.showSuccess('تم الموافقة على الحادثة بنجاح');
            this.loadViolations();
          },
          error: (error) => {
            this.toasterService.showError(error.message || 'حدث خطأ أثناء الموافقة على الحادثة');
          }
        });
      }
    });
  }

  rejectViolation(violation: ViolationDto): void {
    this.confirmationService.show({
      title: 'تأكيد الرفض',
      message: `هل أنت متأكد من رفض الحادثة #${violation.id}؟`,
      confirmText: 'رفض',
      cancelText: 'إلغاء',
      type: 'danger'
    }).then(confirmed => {
      if (confirmed) {
        this.violationService.rejectViolation(violation.id).subscribe({
          next: () => {
            this.toasterService.showSuccess('تم رفض الحادثة بنجاح');
            this.loadViolations();
          },
          error: (error) => {
            this.toasterService.showError(error.message || 'حدث خطأ أثناء رفض الحادثة');
          }
        });
      }
    });
  }

  publishViolation(violation: ViolationDto): void {
    this.confirmationService.show({
      title: 'تأكيد النشر',
      message: `هل أنت متأكد من نشر الحادثة #${violation.id}؟`,
      confirmText: 'نشر',
      cancelText: 'إلغاء',
      type: 'info'
    }).then(confirmed => {
      if (confirmed) {
        this.violationService.publishViolation(violation.id).subscribe({
          next: () => {
            this.toasterService.showSuccess('تم نشر الحادثة بنجاح');
            this.loadViolations();
          },
          error: (error) => {
            this.toasterService.showError(error.message || 'حدث خطأ أثناء نشر الحادثة');
          }
        });
      }
    });
  }

  unpublishViolation(violation: ViolationDto): void {
    this.confirmationService.show({
      title: 'تأكيد إلغاء النشر',
      message: `هل أنت متأكد من إلغاء نشر الحادثة #${violation.id}؟`,
      confirmText: 'إلغاء النشر',
      cancelText: 'إلغاء',
      type: 'warning'
    }).then(confirmed => {
      if (confirmed) {
        this.violationService.unpublishViolation(violation.id).subscribe({
          next: () => {
            this.toasterService.showSuccess('تم إلغاء نشر الحادثة بنجاح');
            this.loadViolations();
          },
          error: (error) => {
            this.toasterService.showError(error.message || 'حدث خطأ أثناء إلغاء نشر الحادثة');
          }
        });
      }
    });
  }

  deleteViolation(violation: ViolationDto): void {
    this.confirmationService.show({
      title: 'تأكيد الحذف',
      message: `هل أنت متأكد من حذف الحادثة #${violation.id}؟`,
      confirmText: 'حذف',
      cancelText: 'إلغاء',
      type: 'danger'
    }).then(confirmed => {
      if (confirmed) {
        this.violationService.deleteViolation(violation.id).subscribe({
          next: () => {
            this.toasterService.showSuccess('تم حذف الحادثة بنجاح');
            this.loadViolations();
          },
          error: (error) => {
            this.toasterService.showError(error.message || 'حدث خطأ أثناء حذف الحادثة');
          }
        });
      }
    });
  }

  toggleViolationActivity(violation: ViolationDto, event: Event): void {
    event.stopPropagation();
    
    if (this.togglingViolations.has(violation.id)) {
      return;
    }

    this.togglingViolations.add(violation.id);
    
    this.violationService.toggleViolationActivity(violation.id).subscribe({
      next: (updatedViolation) => {
        this.toasterService.showSuccess(`تم ${updatedViolation.isActive ? 'تفعيل' : 'إلغاء تفعيل'} الحادثة بنجاح`);
        this.togglingViolations.delete(violation.id);
        this.loadViolations();
      },
      error: (error) => {
        console.error('Error toggling violation activity:', error);
        this.toasterService.showError(error.message || 'حدث خطأ أثناء تغيير حالة الحادثة');
        this.togglingViolations.delete(violation.id);
      }
    });
  }

  isToggling(violationId: number): boolean {
    return this.togglingViolations.has(violationId);
  }

  saveViolation(): void {
    // Validate both forms
    if (this.violationForm.invalid) {
      Object.keys(this.violationForm.controls).forEach(key => {
        this.violationForm.get(key)?.markAsTouched();
      });
      this.toasterService.showWarning('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    // Validate required questions (only if questions exist for the selected category)
    if (this.sortedQuestions.length > 0) {
      let hasInvalidQuestions = false;
      this.sortedQuestions.forEach(question => {
        if (question.isRequired) {
          const control = this.questionsForm.get(`question_${question.id}`);
          if (control && control.invalid) {
            control.markAsTouched();
            hasInvalidQuestions = true;
          }
        }
      });

      if (hasInvalidQuestions) {
        this.toasterService.showWarning('يرجى الإجابة على جميع الأسئلة المطلوبة');
        return;
      }
    }

    const formValue = this.violationForm.value;
    
    // Build question answers
    const questionAnswers: QuestionAnswerDto[] = [];
    this.sortedQuestions.forEach(question => {
      const answer = this.questionsForm.get(`question_${question.id}`)?.value;
      if (answer !== null && answer !== undefined && answer !== '') {
        questionAnswers.push({
          questionId: question.id,
          answerValue: String(answer)
        });
      }
    });
    
    // Upload files first, then save violation
    this.uploadFiles().then(attachments => {
      if (this.editingViolation) {
        // Dashboard only handles private violations
        const updateDto: UpdatePrivateViolationDto = {
          id: this.editingViolation.id,
          cityId: Number(formValue.cityId),
          categoryId: Number(formValue.categoryId),
          subCategoryId: Number(formValue.subCategoryId),
          violationDate: formValue.violationDate,
          location: formValue.location,
          description: formValue.description,
          isWitness: Boolean(formValue.isWitness),
          questionAnswers: questionAnswers,
          attachments: attachments
        };
        
        this.violationService.updatePrivateViolation(updateDto).subscribe({
          next: () => {
            this.toasterService.showSuccess('تم تحديث الحادثة بنجاح');
            this.closeModal();
            this.loadViolations();
          },
          error: (error) => {
            this.toasterService.showError(error.message || 'حدث خطأ أثناء تحديث الحادثة');
          }
        });
      } else {
        // Add new violation (private)
        const addDto: AddPrivateViolationDto = {
          cityId: Number(formValue.cityId),
          categoryId: Number(formValue.categoryId),
          subCategoryId: Number(formValue.subCategoryId),
          violationDate: formValue.violationDate,
          location: formValue.location,
          description: formValue.description,
          isWitness: Boolean(formValue.isWitness),
          questionAnswers: questionAnswers,
          attachments: attachments
        };
        
        this.violationService.createPrivateViolation(addDto).subscribe({
          next: () => {
            this.toasterService.showSuccess('تم إضافة الحادثة بنجاح');
            this.closeModal();
            this.loadViolations();
          },
          error: (error) => {
            this.toasterService.showError(error.message || 'حدث خطأ أثناء إضافة الحادثة');
          }
        });
      }
    }).catch(error => {
      this.toasterService.showError(error.message || 'حدث خطأ أثناء رفع الملفات');
    });
  }

  closeModal(): void {
    this.showModal = false;
    this.editingViolation = null;
    this.violationForm.reset();
    this.questionsForm.reset();
    // Clear all question controls
    Object.keys(this.questionsForm.controls).forEach(key => {
      if (key.startsWith('question_')) {
        this.questionsForm.removeControl(key);
      }
    });
    this.filteredQuestions = [];
    this.sortedQuestions = [];
    this.attachments = [];
    this.attachmentPreviews = [];
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      Array.from(input.files).forEach(file => {
        // Validate file type
        if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
          this.toasterService.showWarning('يجب أن تكون الملفات صور أو فيديو');
          return;
        }
        
        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          this.toasterService.showWarning('حجم الملف يجب أن يكون أقل من 10 ميجابايت');
          return;
        }
        
        this.attachments.push(file);
        
        // Create preview for images
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (e) => {
            this.attachmentPreviews.push({
              file: file,
              preview: e.target?.result as string,
              uploaded: false
            });
          };
          reader.readAsDataURL(file);
        } else {
          this.attachmentPreviews.push({
            file: file,
            preview: '',
            uploaded: false
          });
        }
      });
    }
  }

  removeAttachment(index: number): void {
    this.attachments.splice(index, 1);
    this.attachmentPreviews.splice(index, 1);
  }

  /**
   * Upload files and return attachment DTOs
   */
  private uploadFiles(): Promise<AttachmentDto[]> {
    return new Promise((resolve, reject) => {
      if (this.attachments.length === 0) {
        // Return existing attachments if editing
        if (this.editingViolation && this.editingViolation.attachments) {
          resolve(this.editingViolation.attachments);
        } else {
          resolve([]);
        }
        return;
      }

      this.uploadingFiles = true;
      
      // Upload all files in parallel using forkJoin
      this.fileUploadService.uploadFiles(this.attachments).subscribe({
        next: (uploadResults: FileUploadResponse[]) => {
          const results: AttachmentDto[] = uploadResults.map((uploadResult: FileUploadResponse, index: number) => {
            const file = this.attachments[index];
            const fileType = file.type.startsWith('image/') ? 'image' : 'video';
            
            return {
              fileName: uploadResult.fileName,
              filePath: uploadResult.url,
              fileType: fileType,
              fileSize: file.size
            };
          });
          
          // Include existing attachments if editing
          if (this.editingViolation && this.editingViolation.attachments) {
            results.push(...this.editingViolation.attachments);
          }
          
          this.uploadingFiles = false;
          resolve(results);
        },
        error: (error: any) => {
          this.uploadingFiles = false;
          reject(error);
        }
      });
    });
  }

  getQuestionControlName(questionId: number): string {
    return `question_${questionId}`;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.violationForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getViolationTypeLabel(type: ViolationType): string {
    return getViolationTypeLabel(type);
  }

  getAcceptanceStatusLabel(status: AcceptanceStatus): string {
    return getAcceptanceStatusLabel(status);
  }

  getPublishStatusLabel(status: PublishStatus): string {
    return getPublishStatusLabel(status);
  }

  getStatusBadgeClass(status: AcceptanceStatus): string {
    const classes: { [key: number]: string } = {
      1: 'badge-pending',
      2: 'badge-approved',
      3: 'badge-rejected'
    };
    return classes[status] || '';
  }
}
