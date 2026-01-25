import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PrivateViolationService } from '../../../services/private-violation.service';
import { CityService } from '../../../services/city.service';
import { CategoryService } from '../../../services/category.service';
import { SubCategoryService } from '../../../services/subcategory.service';
import { QuestionService } from '../../../services/question.service';
import { ToasterService } from '../../../services/toaster.service';
import { PermissionCheckService } from '../../../services/permission-check.service';
import { ConfirmationDialogService } from '../../../services/confirmation-dialog.service';
import { FileUploadService, FileUploadResponse } from '../../../services/file-upload.service';
import { AuthService } from '../../../auth/auth.service';
import {
  PrivateViolationDto,
  AddPrivateViolationDto,
  UpdatePrivateViolationDto,
  AcceptanceStatus,
  PublishStatus,
  QuestionAnswerDto,
  PrivateViolationAttachmentInputDto,
  getAcceptanceStatusLabel,
  getPublishStatusLabel
} from '../../../models/violation.model';
import { QuestionDto, QuestionFilter, QuestionType } from '../../../models/question.model';
import { CityDto } from '../../../models/city.model';
import { CategoryDto } from '../../../models/category.model';
import { SubCategoryDto } from '../../../models/subcategory.model';
import { TableColumn, TableAction } from '../../../components/unified-table/unified-table.component';
import { ViewMode } from '../../../components/view-toggle/view-toggle.component';
import { Eye, Pencil, Trash2, Plus, CheckCircle, XCircle } from 'lucide-angular';
import { PrivateViolationRole, Gender, getPrivateViolationRoleLabel, getGenderLabel } from '../../../models/published-violation.model';
import { environment } from '../../../../environments/environment';

interface AttachmentPreview {
  file: File | null;
  preview: string;
  uploaded: boolean;
  filePath?: string;
}

@Component({
  selector: 'app-my-private-violations',
  templateUrl: './my-private-violations.component.html',
  styleUrls: ['./my-private-violations.component.scss']
})
export class MyPrivateViolationsComponent implements OnInit {
  violations: PrivateViolationDto[] = [];
  filteredViolations: PrivateViolationDto[] = [];
  loading = false;
  viewMode: ViewMode = 'table';
  showModal = false;
  modalTitle = '';
  violationForm!: FormGroup;
  questionsForm!: FormGroup;
  editingViolation: PrivateViolationDto | null = null;
  originalViolationData: PrivateViolationDto | null = null;
  showDetailsModal = false;
  selectedViolation: PrivateViolationDto | null = null;
  searchTerm: string = '';

  // Step management
  currentStep = 1;
  totalSteps = 6; // Basic Info, Personal Info, Contact, Questions, Attachments, Review

  // Lookup data
  cities: CityDto[] = [];
  categories: CategoryDto[] = [];
  subCategories: SubCategoryDto[] = [];
  filteredQuestions: QuestionDto[] = [];
  sortedQuestions: QuestionDto[] = [];
  loadingQuestions = false;

  // File upload
  attachments: File[] = [];
  attachmentPreviews: AttachmentPreview[] = [];

  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalCount = 0;
  totalPages = 0;

  // Enums
  AcceptanceStatus = AcceptanceStatus;
  PublishStatus = PublishStatus;
  PrivateViolationRole = PrivateViolationRole;
  Gender = Gender;

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
    }
  ];

  actions: TableAction[] = [];

  // Lucide icons
  Eye = Eye;
  Pencil = Pencil;
  Trash2 = Trash2;
  Plus = Plus;
  CheckCircle = CheckCircle;
  XCircle = XCircle;

  constructor(
    private privateViolationService: PrivateViolationService,
    private cityService: CityService,
    private categoryService: CategoryService,
    private subCategoryService: SubCategoryService,
    private questionService: QuestionService,
    private toasterService: ToasterService,
    public permissionService: PermissionCheckService,
    private confirmationService: ConfirmationDialogService,
    private fileUploadService: FileUploadService,
    private authService: AuthService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const savedView = localStorage.getItem('my-private-violations-view-mode');
    if (savedView === 'table' || savedView === 'cards') {
      this.viewMode = savedView;
    }
    this.initForms();
    this.loadLookupData();
    this.loadViolations();
    setTimeout(() => {
      this.setupActions();
    }, 0);
    this.filteredViolations = [];
  }

  initForms(): void {
    this.violationForm = this.fb.group({
      cityId: ['', Validators.required],
      categoryId: ['', Validators.required],
      subCategoryId: [{ value: '', disabled: true }, Validators.required],
      violationDate: ['', Validators.required],
      location: ['', Validators.required],
      description: ['', Validators.required],
      // Personal/Victim Information
      personalName: [''],
      personalCity: [''],
      personalAddress: [''],
      personalAge: [null],
      personalDateOfBirth: [''],
      personalEducation: [''],
      hasDisability: [false],
      disabilityType: [''],
      gender: [null],
      maritalStatus: [''],
      work: [''],
      // Contact Information
      contactEmail: ['', Validators.email],
      contactPhone: [''],
      // Role
      role: [PrivateViolationRole.Witness, Validators.required],
      otherRoleText: [''],
      // Publish Settings
      showPersonalInfoInPublish: [false]
    });

    this.questionsForm = this.fb.group({});

    // Watch all form changes to update review section
    this.violationForm.valueChanges.subscribe(() => {
      this.cdr.detectChanges();
    });

    // Watch questions form changes to update review section
    this.questionsForm.valueChanges.subscribe(() => {
      this.cdr.detectChanges();
    });

    // Watch category changes to load subcategories and questions
    this.violationForm.get('categoryId')?.valueChanges.subscribe(categoryId => {
      const subCategoryControl = this.violationForm.get('subCategoryId');
      if (categoryId && categoryId !== '' && categoryId !== null) {
        const categoryIdNum = Number(categoryId);
        if (!isNaN(categoryIdNum)) {
          // Don't preserve value when user changes category (only preserve when editing)
          this.loadSubCategories(categoryIdNum, false);
          this.loadQuestions(categoryIdNum);
          // Enable subcategory control when category is selected
          subCategoryControl?.enable();
        }
      } else {
        this.subCategories = [];
        this.filteredQuestions = [];
        this.sortedQuestions = [];
        this.clearQuestionControls();
        this.loadingQuestions = false;
        // Disable subcategory control when no category is selected
        subCategoryControl?.disable();
        subCategoryControl?.setValue('', { emitEvent: false });
      }
    });

    // Watch role changes to show/hide otherRoleText
    this.violationForm.get('role')?.valueChanges.subscribe(role => {
      const otherRoleControl = this.violationForm.get('otherRoleText');
      if (role === PrivateViolationRole.Other) {
        otherRoleControl?.setValidators([Validators.required]);
      } else {
        otherRoleControl?.clearValidators();
        otherRoleControl?.setValue('');
      }
      otherRoleControl?.updateValueAndValidity();
    });
  }

  loadLookupData(): void {
    this.loadCities();
    this.loadCategories();
  }

  loadCities(): void {
    this.cityService.getPublicLookup().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.cities = Array.isArray(response.data) ? response.data : [];
        }
      },
      error: (error) => {
        console.error('Error loading cities:', error);
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
      error: (error) => {
        console.error('Error loading categories:', error);
      }
    });
  }

  loadSubCategories(categoryId: number, preserveValue: boolean = false): void {
    if (!categoryId || isNaN(categoryId)) {
      this.subCategories = [];
      const subCategoryControl = this.violationForm.get('subCategoryId');
      subCategoryControl?.disable();
      if (!preserveValue) {
        subCategoryControl?.setValue('', { emitEvent: false });
      }
      return;
    }
    this.subCategoryService.getPublicLookup(categoryId).subscribe({
      next: (response) => {
        const subCategoryControl = this.violationForm.get('subCategoryId');
        const currentValue = preserveValue ? subCategoryControl?.value : '';
        if (response.success && response.data) {
          this.subCategories = Array.isArray(response.data) ? response.data : [];
          // Enable subcategory control if there are subcategories
          if (this.subCategories.length > 0) {
            subCategoryControl?.enable();
          } else {
            subCategoryControl?.disable();
          }
        } else {
          this.subCategories = [];
          subCategoryControl?.disable();
        }
        // Only reset subcategory selection if not preserving value
        if (!preserveValue) {
          this.violationForm.patchValue({ subCategoryId: '' }, { emitEvent: false });
        } else if (currentValue) {
          // Restore the value after loading subcategories
          this.violationForm.patchValue({ subCategoryId: currentValue }, { emitEvent: false });
        }
      },
      error: (error) => {
        console.error('Error loading subcategories:', error);
        this.subCategories = [];
        const subCategoryControl = this.violationForm.get('subCategoryId');
        subCategoryControl?.disable();
        if (!preserveValue) {
          subCategoryControl?.setValue('', { emitEvent: false });
        }
      }
    });
  }

  loadQuestions(categoryId: number, preserveAnswers: boolean = false): void {
    if (!categoryId || isNaN(categoryId)) {
      this.filteredQuestions = [];
      this.sortedQuestions = [];
      this.clearQuestionControls();
      this.loadingQuestions = false;
      return;
    }

    // Store existing answers if preserving
    const existingAnswers: { [key: string]: any } = {};
    if (preserveAnswers) {
      this.sortedQuestions.forEach(question => {
        const controlName = `question_${question.id}`;
        const control = this.questionsForm.get(controlName);
        if (control && control.value) {
          existingAnswers[controlName] = control.value;
        }
      });
    }

    this.loadingQuestions = true;
    this.filteredQuestions = [];
    this.sortedQuestions = [];
    this.clearQuestionControls();

    const filter: QuestionFilter = {
      categoryId: categoryId,
      isActive: true
    };

    this.questionService.getAllQuestionsWithFilter(filter, undefined, undefined, undefined).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const questions = Array.isArray(response.data) ? response.data : response.data.items || [];
          this.filteredQuestions = questions;
          const sorted = [...questions].sort((a, b) => a.order - b.order);
          
          // Create form controls with simple Validators.required
          sorted.forEach(question => {
            const controlName = `question_${question.id}`;
            const validators = question.isRequired ? [Validators.required] : [];
            // Restore existing answer if preserving
            const initialValue = preserveAnswers && existingAnswers[controlName] ? existingAnswers[controlName] : '';
            const control = this.fb.control(initialValue, validators);
            this.questionsForm.addControl(controlName, control);
            
            // Subscribe to value changes to trigger change detection for review section
            control.valueChanges.subscribe(() => {
              this.cdr.detectChanges();
            });
          });
          
          // Update sortedQuestions directly (no setTimeout needed)
          this.sortedQuestions = sorted;
          this.loadingQuestions = false;
          
          // Trigger change detection to update the view
          this.cdr.detectChanges();
        } else {
          this.filteredQuestions = [];
          this.sortedQuestions = [];
          this.loadingQuestions = false;
        }
      },
      error: (error) => {
        console.error('Error loading questions:', error);
        this.loadingQuestions = false;
        this.filteredQuestions = [];
        this.sortedQuestions = [];
        this.toasterService.showError('حدث خطأ أثناء تحميل الأسئلة');
      }
    });
  }

  clearQuestionControls(): void {
    Object.keys(this.questionsForm.controls).forEach(key => {
      if (key.startsWith('question_')) {
        this.questionsForm.removeControl(key);
      }
    });
  }

  loadViolations(): void {
    this.loading = true;
    this.privateViolationService.getMyViolations(this.currentPage, this.pageSize).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          if (response.data && typeof response.data === 'object' && 'items' in response.data) {
            this.violations = response.data.items || [];
            this.totalCount = response.data.totalCount || 0;
            this.totalPages = response.data.totalPages || 0;
            this.currentPage = response.data.pageNumber || 1;
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
      },
      error: (error) => {
        console.error('Error loading violations:', error);
        this.loading = false;
        this.toasterService.showError('حدث خطأ أثناء تحميل البلاغات');
      }
    });
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

  onViewChange(view: ViewMode): void {
    this.viewMode = view;
    localStorage.setItem('my-private-violations-view-mode', view);
  }

  setupActions(): void {
    this.actions = [];
    
    // View Details
    this.actions.push({
      label: 'عرض التفاصيل',
      icon: Eye,
      action: (row) => this.viewDetails(row),
      class: 'btn-view',
      variant: 'info',
      showLabel: false
    });
    
    // Edit (only if Pending)
    this.actions.push({
      label: 'تعديل',
      icon: Pencil,
      action: (row) => this.editViolation(row),
      class: 'btn-edit',
      variant: 'warning',
      showLabel: false,
      condition: (row) => row.acceptanceStatus === AcceptanceStatus.Pending
    });
    
    // Delete (only if Pending)
    this.actions.push({
      label: 'حذف',
      icon: Trash2,
      action: (row) => this.deleteViolation(row),
      class: 'btn-delete',
      variant: 'danger',
      showLabel: false,
      condition: (row) => row.acceptanceStatus === AcceptanceStatus.Pending
    });
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadViolations();
  }

  openAddModal(): void {
    if (!this.permissionService.hasPermission('PrivateViolation', 'Create') && !this.permissionService.isSuperAdmin()) {
      this.toasterService.showWarning('ليس لديك صلاحية لإضافة بلاغ خاص', 'صلاحية مرفوضة');
      return;
    }

    this.modalTitle = 'إضافة بلاغ خاص جديد';
    this.editingViolation = null;
    this.originalViolationData = null;
    this.currentStep = 1;
    this.violationForm.reset({
      role: PrivateViolationRole.Witness,
      showPersonalInfoInPublish: false,
      hasDisability: false
    });
    this.questionsForm.reset();
    this.clearQuestionControls();
    this.filteredQuestions = [];
    this.sortedQuestions = [];
    this.loadingQuestions = false;
    this.attachments = [];
    this.attachmentPreviews = [];
    this.showModal = true;
  }

  editViolation(violation: PrivateViolationDto): void {
    // Check if violation can be edited (must be Pending)
    if (violation.acceptanceStatus !== AcceptanceStatus.Pending) {
      this.toasterService.showWarning('لا يمكن تعديل البلاغ بعد الموافقة عليه أو رفضه', 'تنبيه');
      return;
    }

    // Check if user is the creator
    const currentUser = this.authService.getCurrentUser();
    if (currentUser && violation.createdByUserId && currentUser.id !== violation.createdByUserId && !this.permissionService.isSuperAdmin()) {
      this.toasterService.showWarning('يمكنك فقط تعديل البلاغات التي أنشأتها', 'تنبيه');
      return;
    }

    this.modalTitle = 'تعديل بلاغ خاص';
    this.editingViolation = violation;
    this.currentStep = 1;
    
    // Load full violation details with question answers
    this.privateViolationService.getPrivateViolationById(violation.id).subscribe({
      next: (fullViolation) => {
        // Save original data for comparison
        this.originalViolationData = { ...fullViolation };
        
        // Patch form values first (especially categoryId to trigger loading)
        this.violationForm.patchValue({
          cityId: fullViolation.cityId,
          categoryId: fullViolation.categoryId,
          violationDate: new Date(fullViolation.violationDate).toISOString().split('T')[0],
          location: fullViolation.location,
          description: fullViolation.description,
          personalName: fullViolation.personalName || '',
          personalCity: fullViolation.personalCity || '',
          personalAddress: fullViolation.personalAddress || '',
          personalAge: fullViolation.personalAge || null,
          personalDateOfBirth: fullViolation.personalDateOfBirth ? new Date(fullViolation.personalDateOfBirth).toISOString().split('T')[0] : '',
          personalEducation: fullViolation.personalEducation || '',
          hasDisability: fullViolation.hasDisability || false,
          disabilityType: fullViolation.disabilityType || '',
          gender: fullViolation.gender || null,
          maritalStatus: fullViolation.maritalStatus || '',
          work: fullViolation.work || '',
          contactEmail: fullViolation.contactEmail || '',
          contactPhone: fullViolation.contactPhone || '',
          role: fullViolation.role,
          otherRoleText: fullViolation.otherRoleText || '',
          showPersonalInfoInPublish: fullViolation.showPersonalInfoInPublish || false
        }, { emitEvent: false });

        // Load subcategories and questions, then set values
        this.loadSubCategories(fullViolation.categoryId, true);
        // Load questions without preserving answers (we'll set them manually after)
        this.loadQuestions(fullViolation.categoryId, false);
        
        // Set subCategoryId after subcategories are loaded
        setTimeout(() => {
          const subCategoryControl = this.violationForm.get('subCategoryId');
          if (subCategoryControl && fullViolation.subCategoryId) {
            subCategoryControl.enable();
            subCategoryControl.setValue(fullViolation.subCategoryId, { emitEvent: false });
          }
        }, 300);

        // Load attachments
        this.attachments = [];
        this.attachmentPreviews = [];
        if (fullViolation.attachments && fullViolation.attachments.length > 0) {
          fullViolation.attachments.forEach(att => {
            this.attachmentPreviews.push({
              file: null as any,
              preview: this.getAttachmentUrl(att.filePath),
              uploaded: true,
              filePath: att.filePath
            });
          });
        }

        // Populate question answers after questions are loaded
        // We need to wait for both: form controls to be created AND components to be rendered in DOM
        const loadAnswers = () => {
          if (fullViolation.questionAnswers && fullViolation.questionAnswers.length > 0) {
            let allControlsReady = true;
            let allQuestionsReady = true;
            
            // Check if all controls exist
            fullViolation.questionAnswers.forEach(answer => {
              const control = this.questionsForm.get(`question_${answer.questionId}`);
              if (!control) {
                allControlsReady = false;
              }
              
              // Check if question exists in sortedQuestions
              const question = this.sortedQuestions.find(q => q.id === answer.questionId);
              if (!question) {
                allQuestionsReady = false;
              }
            });
            
            // Also check if we're on the questions step (step 4) to ensure components are rendered
            const isOnQuestionsStep = this.currentStep === 4;
            
            if (allControlsReady && allQuestionsReady && isOnQuestionsStep) {
              // Use patchValue with emitEvent: true first to trigger writeValue
              // Then update without emitEvent to avoid triggering validation multiple times
              const answersToSet: { [key: string]: any } = {};
              fullViolation.questionAnswers.forEach(answer => {
                if (answer.answerValue) {
                  // For multiple selection, answerValue is already a JSON string
                  // For single selection, it's a plain string
                  // Keep it as is to preserve JSON format for multiple selections
                  const normalizedValue = answer.answerValue.trim();
                  if (normalizedValue) {
                    answersToSet[`question_${answer.questionId}`] = normalizedValue;
                  }
                }
              });
              
              // Patch all values at once to trigger writeValue for all components
              this.questionsForm.patchValue(answersToSet, { emitEvent: true });
              
              // Mark controls as touched and dirty
              Object.keys(answersToSet).forEach(key => {
                const control = this.questionsForm.get(key);
                if (control) {
                  control.markAsTouched();
                  control.markAsDirty();
                }
              });
              
              // Trigger change detection to update the view
              this.cdr.detectChanges();
            } else {
              // Retry after a short delay if controls, questions, or step is not ready
              setTimeout(loadAnswers, 300);
            }
          }
        };
        
        // Start loading answers after questions are loaded
        // Use a longer timeout to ensure components are rendered in DOM
        setTimeout(loadAnswers, 1500);
        
        this.showModal = true;
      },
      error: (error) => {
        console.error('Error loading violation details:', error);
        this.toasterService.showError('حدث خطأ أثناء تحميل تفاصيل البلاغ');
      }
    });
  }

  viewDetails(violation: PrivateViolationDto): void {
    // Load full violation details
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

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      Array.from(input.files).forEach(file => {
        this.attachments.push(file);
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.attachmentPreviews.push({
            file: file,
            preview: e.target.result,
            uploaded: false
          });
        };
        reader.readAsDataURL(file);
      });
    }
  }

  removeAttachment(index: number): void {
    const preview = this.attachmentPreviews[index];
    if (preview.uploaded && preview.filePath) {
      // Existing file - just remove from preview
      this.attachmentPreviews.splice(index, 1);
    } else {
      // New file - remove from both arrays
      const fileIndex = this.attachments.findIndex(f => f === preview.file);
      if (fileIndex !== -1) {
        this.attachments.splice(fileIndex, 1);
      }
      this.attachmentPreviews.splice(index, 1);
    }
  }

  saveViolation(): void {
    // Mark all form controls as touched to show validation errors
    Object.keys(this.violationForm.controls).forEach(key => {
      this.violationForm.get(key)?.markAsTouched();
    });
    
    // Mark questions form and all question controls as touched
    this.questionsForm.markAllAsTouched();
    Object.keys(this.questionsForm.controls).forEach(key => {
      const control = this.questionsForm.get(key);
      if (control) {
        control.markAsTouched();
        control.markAsDirty();
        control.updateValueAndValidity({ emitEvent: false });
      }
    });

    // Validate all steps
    if (!this.validateStep(1) || !this.validateStep(3) || !this.validateStep(4)) {
      this.toasterService.showWarning('يرجى إكمال جميع الحقول المطلوبة');
      // Go to first invalid step
      if (!this.validateStep(1)) {
        this.currentStep = 1;
      } else if (!this.validateStep(3)) {
        this.currentStep = 3;
      } else if (!this.validateStep(4)) {
        this.currentStep = 4;
      }
      return;
    }

    // Upload files first
    if (this.attachments.length > 0) {
      this.uploadFilesAndSave();
    } else {
      // Even if no new attachments, preserve existing ones
      const existingAttachments: PrivateViolationAttachmentInputDto[] = [];
      this.attachmentPreviews.forEach(preview => {
        if (preview.uploaded && preview.filePath) {
          existingAttachments.push({
            fileName: preview.filePath.split('/').pop() || 'file',
            filePath: preview.filePath,
            fileType: 'application/octet-stream',
            fileSize: 0
          });
        }
      });
      this.saveViolationWithAttachments(existingAttachments);
    }
  }

  uploadFilesAndSave(): void {
    this.loading = true;
    this.fileUploadService.uploadFiles(this.attachments).subscribe({
      next: (uploadResponses) => {
        const attachmentInputs: PrivateViolationAttachmentInputDto[] = uploadResponses.map((response, index) => {
          const file = this.attachments[index];
          return {
            fileName: response.fileName,
            filePath: response.url,
            fileType: file.type || 'application/octet-stream',
            fileSize: file.size
          };
        });

        // Add existing attachments
        this.attachmentPreviews.forEach(preview => {
          if (preview.uploaded && preview.filePath) {
            attachmentInputs.push({
              fileName: preview.filePath.split('/').pop() || 'file',
              filePath: preview.filePath,
              fileType: 'application/octet-stream',
              fileSize: 0
            });
          }
        });

        this.saveViolationWithAttachments(attachmentInputs);
      },
      error: (error) => {
        console.error('Error uploading files:', error);
        this.loading = false;
        this.toasterService.showError('حدث خطأ أثناء رفع الملفات');
      }
    });
  }

  saveViolationWithAttachments(attachments: PrivateViolationAttachmentInputDto[]): void {
    // Enable disabled controls to get their values
    const subCategoryControl = this.violationForm.get('subCategoryId');
    if (subCategoryControl?.disabled) {
      subCategoryControl.enable();
    }
    
    const formValue = this.violationForm.value;
    
    // Build question answers
    const questionAnswers: QuestionAnswerDto[] = [];
    this.sortedQuestions.forEach(question => {
      const control = this.questionsForm.get(`question_${question.id}`);
      if (control && control.value) {
        questionAnswers.push({
          questionId: question.id,
          answerValue: control.value
        });
      }
    });

    if (this.editingViolation) {
      // Update existing violation
      const updateDto: UpdatePrivateViolationDto = {
        id: this.editingViolation.id,
        cityId: Number(formValue.cityId),
        categoryId: Number(formValue.categoryId),
        subCategoryId: Number(formValue.subCategoryId),
        violationDate: formValue.violationDate,
        location: formValue.location,
        description: formValue.description,
        personalName: formValue.personalName || undefined,
        personalCity: formValue.personalCity || undefined,
        personalAddress: formValue.personalAddress || undefined,
        personalAge: formValue.personalAge ? Number(formValue.personalAge) : undefined,
        personalDateOfBirth: formValue.personalDateOfBirth || undefined,
        personalEducation: formValue.personalEducation || undefined,
        hasDisability: formValue.hasDisability || undefined,
        disabilityType: formValue.disabilityType || undefined,
        gender: formValue.gender !== null && formValue.gender !== undefined ? Number(formValue.gender) : undefined,
        maritalStatus: formValue.maritalStatus || undefined,
        work: formValue.work || undefined,
        contactEmail: formValue.contactEmail || undefined,
        contactPhone: formValue.contactPhone || undefined,
        role: Number(formValue.role),
        otherRoleText: formValue.otherRoleText || undefined,
        showPersonalInfoInPublish: formValue.showPersonalInfoInPublish || false,
        questionAnswers: questionAnswers,
        attachments: attachments
      };

      this.privateViolationService.updatePrivateViolation(updateDto).subscribe({
        next: () => {
          this.toasterService.showSuccess('تم تحديث البلاغ بنجاح');
          this.closeModal();
          this.loadViolations();
        },
        error: (error) => {
          console.error('Error updating violation:', error);
          this.loading = false;
          this.toasterService.showError(error.message || 'حدث خطأ أثناء تحديث البلاغ');
        }
      });
    } else {
      // Create new violation
      const addDto: AddPrivateViolationDto = {
        cityId: Number(formValue.cityId),
        categoryId: Number(formValue.categoryId),
        subCategoryId: Number(formValue.subCategoryId),
        violationDate: formValue.violationDate,
        location: formValue.location,
        description: formValue.description,
        personalName: formValue.personalName || undefined,
        personalCity: formValue.personalCity || undefined,
        personalAddress: formValue.personalAddress || undefined,
        personalAge: formValue.personalAge ? Number(formValue.personalAge) : undefined,
        personalDateOfBirth: formValue.personalDateOfBirth || undefined,
        personalEducation: formValue.personalEducation || undefined,
        hasDisability: formValue.hasDisability || undefined,
        disabilityType: formValue.disabilityType || undefined,
        gender: formValue.gender !== null && formValue.gender !== undefined ? Number(formValue.gender) : undefined,
        maritalStatus: formValue.maritalStatus || undefined,
        work: formValue.work || undefined,
        contactEmail: formValue.contactEmail || undefined,
        contactPhone: formValue.contactPhone || undefined,
        role: Number(formValue.role),
        otherRoleText: formValue.otherRoleText || undefined,
        showPersonalInfoInPublish: formValue.showPersonalInfoInPublish || false,
        questionAnswers: questionAnswers,
        attachments: attachments
      };

      this.privateViolationService.createPrivateViolation(addDto).subscribe({
        next: () => {
          this.toasterService.showSuccess('تم إضافة البلاغ بنجاح');
          this.closeModal();
          this.loadViolations();
        },
        error: (error) => {
          console.error('Error creating violation:', error);
          this.loading = false;
          this.toasterService.showError(error.message || 'حدث خطأ أثناء إضافة البلاغ');
        }
      });
    }
  }

  deleteViolation(violation: PrivateViolationDto): void {
    // Check if violation can be deleted (must be Pending)
    if (violation.acceptanceStatus !== AcceptanceStatus.Pending) {
      this.toasterService.showWarning('لا يمكن حذف البلاغ بعد الموافقة عليه أو رفضه', 'تنبيه');
      return;
    }

    // Check if user is the creator
    const currentUser = this.authService.getCurrentUser();
    if (currentUser && violation.createdByUserId && currentUser.id !== violation.createdByUserId && !this.permissionService.isSuperAdmin()) {
      this.toasterService.showWarning('يمكنك فقط حذف البلاغات التي أنشأتها', 'تنبيه');
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
        this.loading = true;
        this.privateViolationService.deletePrivateViolation(violation.id).subscribe({
          next: () => {
            this.toasterService.showSuccess('تم حذف البلاغ بنجاح');
            this.loadViolations();
            this.loading = false;
          },
          error: (error) => {
            console.error('Error deleting violation:', error);
            this.loading = false;
            // Show detailed error message
            const errorMessage = error.error?.message || error.message || 'حدث خطأ أثناء حذف البلاغ';
            this.toasterService.showError(errorMessage);
          }
        });
      }
    });
  }

  closeModal(): void {
    this.showModal = false;
    this.editingViolation = null;
    this.originalViolationData = null;
    this.currentStep = 1;
    this.violationForm.reset();
    this.questionsForm.reset();
    this.clearQuestionControls();
    this.attachments = [];
    this.attachmentPreviews = [];
    this.filteredQuestions = [];
    this.sortedQuestions = [];
    this.loading = false;
  }

  // Step management methods
  nextStep(): void {
    if (this.currentStep < this.totalSteps) {
      // Validate current step before moving forward
      if (this.validateCurrentStep()) {
        this.currentStep++;
        // If navigating to questions step (step 4), ensure questions are loaded
        if (this.currentStep === 4) {
          this.ensureQuestionsLoaded();
        }
      } else {
        // Show error message if validation fails
        this.toasterService.showWarning('يرجى إكمال جميع الحقول المطلوبة في هذه الخطوة');
      }
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
      // If navigating to questions step (step 4), ensure questions are loaded
      if (this.currentStep === 4) {
        this.ensureQuestionsLoaded();
      }
    }
  }

  goToStep(step: number): void {
    if (this.canGoToStep(step)) {
      this.currentStep = step;
      // If navigating to questions step (step 4), ensure questions are loaded
      if (step === 4) {
        this.ensureQuestionsLoaded();
      }
    }
  }
  
  ensureQuestionsLoaded(): void {
    const categoryId = this.violationForm.get('categoryId')?.value;
    if (categoryId && !isNaN(Number(categoryId))) {
      const categoryIdNum = Number(categoryId);
      // If questions are not loaded or empty, reload them
      if (this.sortedQuestions.length === 0) {
        // Don't preserve answers when switching tabs - we'll reload from editingViolation if needed
        this.loadQuestions(categoryIdNum, false);
        
        // If editing, reload answers after questions are loaded
        if (this.editingViolation && this.originalViolationData) {
          setTimeout(() => {
            this.reloadQuestionAnswers();
          }, 1500);
        }
      } else {
        // Questions are already loaded, but ensure form controls exist
        this.ensureQuestionControlsExist();
        // If editing, reload answers with retry logic
        if (this.editingViolation && this.originalViolationData) {
          // Use retry logic to ensure components are rendered
          this.reloadQuestionAnswersWithRetry();
        }
        // Trigger change detection to update the view
        this.cdr.detectChanges();
      }
    }
  }
  
  reloadQuestionAnswersWithRetry(retryCount: number = 0, maxRetries: number = 10): void {
    if (!this.originalViolationData || !this.originalViolationData.questionAnswers) {
      return;
    }
    
    // Check if we're on the questions step
    if (this.currentStep !== 4) {
      return;
    }
    
    // Check if all controls exist
    let allControlsReady = true;
    this.originalViolationData.questionAnswers.forEach(answer => {
      const control = this.questionsForm.get(`question_${answer.questionId}`);
      if (!control) {
        allControlsReady = false;
      }
    });
    
    // Check if questions are loaded
    const allQuestionsReady = this.sortedQuestions.length > 0;
    
    if (allControlsReady && allQuestionsReady) {
      // All ready, load answers
      this.reloadQuestionAnswers();
    } else if (retryCount < maxRetries) {
      // Retry after a short delay
      setTimeout(() => {
        this.reloadQuestionAnswersWithRetry(retryCount + 1, maxRetries);
      }, 200);
    }
  }
  
  reloadQuestionAnswers(): void {
    if (!this.originalViolationData || !this.originalViolationData.questionAnswers) {
      return;
    }
    
    const answersToSet: { [key: string]: any } = {};
    this.originalViolationData.questionAnswers.forEach(answer => {
      if (answer.answerValue) {
        // For multiple selection, answerValue is already a JSON string
        // For single selection, it's a plain string
        // Keep it as is to preserve JSON format for multiple selections
        const normalizedValue = answer.answerValue.trim();
        if (normalizedValue) {
          answersToSet[`question_${answer.questionId}`] = normalizedValue;
        }
      }
    });
    
    if (Object.keys(answersToSet).length > 0) {
      // First, reset all question controls to clear any previous values
      Object.keys(answersToSet).forEach(key => {
        const control = this.questionsForm.get(key);
        if (control) {
          control.setValue('', { emitEvent: false });
        }
      });
      
      // Use setTimeout to ensure DOM is ready
      setTimeout(() => {
        // Patch all values at once to trigger writeValue for all components
        this.questionsForm.patchValue(answersToSet, { emitEvent: true });
        
        // Mark controls as touched and dirty
        Object.keys(answersToSet).forEach(key => {
          const control = this.questionsForm.get(key);
          if (control) {
            control.markAsTouched();
            control.markAsDirty();
          }
        });
        
        // Trigger change detection to update the view
        this.cdr.detectChanges();
      }, 100);
    }
  }
  
  ensureQuestionControlsExist(): void {
    // Ensure all question form controls exist
    this.sortedQuestions.forEach(question => {
      const controlName = `question_${question.id}`;
      if (!this.questionsForm.get(controlName)) {
        const validators = question.isRequired ? [Validators.required] : [];
        this.questionsForm.addControl(controlName, this.fb.control('', validators));
      }
    });
    // Trigger change detection
    this.cdr.detectChanges();
  }

  canGoToStep(step: number): boolean {
    // Allow going to previous steps or current step
    if (step <= this.currentStep) {
      return true;
    }
    // For future steps, validate all previous steps
    for (let i = 1; i < step; i++) {
      if (!this.validateStep(i)) {
        return false;
      }
    }
    return true;
  }

  validateCurrentStep(): boolean {
    return this.validateStep(this.currentStep);
  }

  validateStep(step: number): boolean {
    switch (step) {
      case 1: // Basic Information
        // Mark all fields as touched to show errors
        const basicFields = ['cityId', 'categoryId', 'subCategoryId', 'violationDate', 'location', 'description', 'role'];
        basicFields.forEach(field => {
          const control = this.violationForm.get(field);
          if (control) {
            control.markAsTouched();
          }
        });
        
        // Check if role is Other, then otherRoleText is required
        const role = this.violationForm.get('role')?.value;
        if (role === PrivateViolationRole.Other) {
          const otherRoleControl = this.violationForm.get('otherRoleText');
          if (otherRoleControl) {
            otherRoleControl.markAsTouched();
            if (!otherRoleControl.valid) {
              return false;
            }
          }
        }
        
        return basicFields.every(field => {
          const control = this.violationForm.get(field);
          return control && control.valid;
        });
      case 2: // Personal Information - all optional
        return true;
      case 3: // Contact Information
        const emailControl = this.violationForm.get('contactEmail');
        if (emailControl && emailControl.value) {
          emailControl.markAsTouched();
          return emailControl.valid;
        }
        return true;
      case 4: // Questions
        // Mark all question controls as touched
        this.sortedQuestions.forEach(question => {
          const control = this.questionsForm.get(`question_${question.id}`);
          if (control) {
            control.markAsTouched();
          }
        });
        
        // Check if all required questions are answered
        for (const question of this.sortedQuestions) {
          if (question.isRequired) {
            const control = this.questionsForm.get(`question_${question.id}`);
            if (!control || !control.value || (typeof control.value === 'string' && control.value.trim() === '')) {
              return false;
            }
          }
        }
        return true;
      case 5: // Attachments - optional
        return true;
      case 6: // Review - no validation needed
        return true;
      default:
        return true;
    }
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.violationForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  // Helper methods
  getAcceptanceStatusLabel(status: AcceptanceStatus): string {
    return getAcceptanceStatusLabel(status);
  }

  getPublishStatusLabel(status: PublishStatus): string {
    return getPublishStatusLabel(status);
  }

  getPrivateViolationRoleLabel(role: PrivateViolationRole): string {
    return getPrivateViolationRoleLabel(role);
  }

  getGenderLabel(gender: Gender): string {
    return getGenderLabel(gender);
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

  // Helper methods for review step
  getSelectedCityName(): string {
    const cityId = this.violationForm.get('cityId')?.value;
    const city = this.cities.find(c => c.id === Number(cityId));
    return city ? city.name : '';
  }

  getSelectedCategoryName(): string {
    const categoryId = this.violationForm.get('categoryId')?.value;
    const category = this.categories.find(c => c.id === Number(categoryId));
    return category ? category.name : '';
  }

  getSelectedSubCategoryName(): string {
    const subCategoryId = this.violationForm.get('subCategoryId')?.value;
    const subCategory = this.subCategories.find(sc => sc.id === Number(subCategoryId));
    return subCategory ? subCategory.name : '';
  }

  getViolationDateValue(): string {
    const date = this.violationForm.get('violationDate')?.value;
    if (!date) return '';
    return new Date(date).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getLocationValue(): string {
    return this.violationForm.get('location')?.value || '';
  }

  getDescriptionValue(): string {
    return this.violationForm.get('description')?.value || '';
  }

  getRoleValue(): string {
    const role = this.violationForm.get('role')?.value;
    return role !== null && role !== undefined ? getPrivateViolationRoleLabel(role) : '';
  }

  getOtherRoleTextValue(): string {
    return this.violationForm.get('otherRoleText')?.value || '';
  }

  getPersonalNameValue(): string {
    return this.violationForm.get('personalName')?.value || '';
  }

  getPersonalCityValue(): string {
    return this.violationForm.get('personalCity')?.value || '';
  }

  getPersonalAddressValue(): string {
    return this.violationForm.get('personalAddress')?.value || '';
  }

  getPersonalAgeValue(): number | null {
    return this.violationForm.get('personalAge')?.value || null;
  }

  getPersonalDateOfBirthValue(): string {
    const date = this.violationForm.get('personalDateOfBirth')?.value;
    if (!date) return '';
    return new Date(date).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getPersonalEducationValue(): string {
    return this.violationForm.get('personalEducation')?.value || '';
  }

  getGenderValue(): string {
    const gender = this.violationForm.get('gender')?.value;
    return gender !== null && gender !== undefined ? getGenderLabel(gender) : '';
  }

  getMaritalStatusValue(): string {
    return this.violationForm.get('maritalStatus')?.value || '';
  }

  getWorkValue(): string {
    return this.violationForm.get('work')?.value || '';
  }

  getHasDisabilityValue(): boolean {
    return this.violationForm.get('hasDisability')?.value || false;
  }

  getDisabilityTypeValue(): string {
    return this.violationForm.get('disabilityType')?.value || '';
  }

  getContactEmailValue(): string {
    return this.violationForm.get('contactEmail')?.value || '';
  }

  getContactPhoneValue(): string {
    return this.violationForm.get('contactPhone')?.value || '';
  }

  getShowPersonalInfoInPublishValue(): boolean {
    const value = this.violationForm.get('showPersonalInfoInPublish')?.value;
    // Explicitly check for boolean values (true/false)
    return value === true || value === 'true' || value === 1;
  }

  getQuestionAnswerValue(questionId: number): string {
    const control = this.questionsForm.get(`question_${questionId}`);
    if (!control) {
      return '';
    }
    
    const value = control.value;
    if (value === null || value === undefined || value === '') {
      return '';
    }
    
    const question = this.sortedQuestions.find(q => q.id === questionId);
    if (!question) {
      return String(value).trim();
    }
    
    // Handle multiple selection (JSON array)
    if (question.questionType === QuestionType.MultipleChoice && question.hasMultiSelect) {
      try {
        const parsed = typeof value === 'string' ? JSON.parse(value) : value;
        if (Array.isArray(parsed)) {
          // Format array as comma-separated list
          return parsed.map((item: string) => {
            // Handle "Other" option format: "أخرى: custom text"
            const otherPrefix = question.otherOptionText || 'أخرى';
            if (typeof item === 'string' && item.startsWith(otherPrefix + ': ')) {
              return item; // Keep as is for display
            }
            return item;
          }).join('، ');
        }
      } catch (e) {
        // If not JSON, treat as single value
        return String(value).trim();
      }
    }
    
    // Single selection or other types
    return String(value).trim();
  }
  
  hasQuestionAnswer(questionId: number): boolean {
    const control = this.questionsForm.get(`question_${questionId}`);
    if (!control) {
      return false;
    }
    const value = control.value;
    return value !== null && value !== undefined && value !== '';
  }
  
  trackByQuestionId(index: number, question: QuestionDto): number {
    return question.id;
  }
  
  hasDataChanged(): boolean {
    if (!this.originalViolationData || !this.violationForm) {
      return false;
    }
    
    const formValue = this.violationForm.value;
    const original = this.originalViolationData;
    
    // Check basic fields
    if (formValue.cityId !== original.cityId ||
        formValue.categoryId !== original.categoryId ||
        formValue.subCategoryId !== original.subCategoryId ||
        formValue.location !== original.location ||
        formValue.description !== original.description ||
        formValue.role !== original.role ||
        formValue.showPersonalInfoInPublish !== original.showPersonalInfoInPublish) {
      return true;
    }
    
    // Check personal information
    if (formValue.personalName !== (original.personalName || '') ||
        formValue.personalCity !== (original.personalCity || '') ||
        formValue.personalAddress !== (original.personalAddress || '') ||
        formValue.personalAge !== (original.personalAge || null) ||
        formValue.personalEducation !== (original.personalEducation || '') ||
        formValue.gender !== (original.gender || null) ||
        formValue.maritalStatus !== (original.maritalStatus || '') ||
        formValue.work !== (original.work || '') ||
        formValue.hasDisability !== (original.hasDisability || false) ||
        formValue.disabilityType !== (original.disabilityType || '')) {
      return true;
    }
    
    // Check contact information
    if (formValue.contactEmail !== (original.contactEmail || '') ||
        formValue.contactPhone !== (original.contactPhone || '')) {
      return true;
    }
    
    // Check violation date (compare as strings after formatting)
    const formDate = formValue.violationDate ? new Date(formValue.violationDate).toISOString().split('T')[0] : '';
    const originalDate = original.violationDate ? new Date(original.violationDate).toISOString().split('T')[0] : '';
    if (formDate !== originalDate) {
      return true;
    }
    
    // Check question answers
    if (this.originalViolationData.questionAnswers) {
      for (const answer of this.originalViolationData.questionAnswers) {
        const control = this.questionsForm.get(`question_${answer.questionId}`);
        const currentValue = control?.value || '';
        const originalValue = answer.answerValue || '';
        if (String(currentValue).trim() !== String(originalValue).trim()) {
          return true;
        }
      }
    }
    
    // Check if new questions have answers (questions that didn't exist in original)
    for (const question of this.sortedQuestions) {
      const control = this.questionsForm.get(`question_${question.id}`);
      if (control?.value) {
        const originalAnswer = this.originalViolationData?.questionAnswers?.find(a => a.questionId === question.id);
        if (!originalAnswer) {
          return true; // New question with answer
        }
      }
    }
    
    // Check attachments count
    const currentAttachmentCount = this.attachmentPreviews.length;
    const originalAttachmentCount = original.attachments?.length || 0;
    if (currentAttachmentCount !== originalAttachmentCount) {
      return true;
    }
    
    return false;
  }
}
