import { Component, OnInit, OnDestroy, ChangeDetectorRef, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PrivateViolationService } from '../../../services/private-violation.service';
import { ViolationFollowUpService } from '../../../services/violation-follow-up.service';
import { FollowUpStatusService } from '../../../services/follow-up-status.service';
import { CityService } from '../../../services/city.service';
import { CategoryService } from '../../../services/category.service';
import { SubCategoryService } from '../../../services/subcategory.service';
import { QuestionService } from '../../../services/question.service';
import { EducationLevelService } from '../../../services/education-level.service';
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
  PrivateViolationKind,
  getAcceptanceStatusLabel,
  getPublishStatusLabel,
  getPrivateViolationKindLabel
} from '../../../models/violation.model';
import { ViolationFollowUpDto, ViolationFollowUpAttachmentDto, AddViolationFollowUpDto, ViolationFollowUpAttachmentInputDto } from '../../../models/violation-follow-up.model';
import { FollowUpStatusDto } from '../../../models/follow-up-status.model';
import { QuestionDto, QuestionFilter, QuestionType } from '../../../models/question.model';
import { CityDto } from '../../../models/city.model';
import { CategoryDto } from '../../../models/category.model';
import { SubCategoryDto } from '../../../models/subcategory.model';
import { EducationLevelDto } from '../../../models/education-level.model';
import { TableColumn, TableAction } from '../../../components/unified-table/unified-table.component';
import { ViewMode } from '../../../components/view-toggle/view-toggle.component';
import { Eye, Pencil, Trash2, Plus, CheckCircle, XCircle, ClipboardList } from 'lucide-angular';
import { PrivateViolationRole, Gender, PreferredContactMethod, getPrivateViolationRoleLabel, getGenderLabel, getPreferredContactMethodLabel } from '../../../models/published-violation.model';
import { MaritalStatus, getMaritalStatusLabel } from '../../../models/violation.model';
import { environment } from '../../../../environments/environment';

interface AttachmentPreview {
  file: File | null;
  preview: string;
  uploaded: boolean;
  filePath?: string;
}

interface DraftData {
  violationForm: any; // Form values
  questionsForm: any; // Question answers as key-value pairs
  attachmentPreviews: Array<{
    preview: string; // Base64 preview if image
    fileName: string;
    fileSize: number;
    fileType: string;
    uploaded: boolean;
    filePath?: string;
  }>;
  currentStep: number;
  timestamp: string; // ISO date string
  categoryId?: number; // To reload questions
  subCategoryId?: number; // To reload subcategories
}

@Component({
  selector: 'app-my-private-violations',
  templateUrl: './my-private-violations.component.html',
  styleUrls: ['./my-private-violations.component.scss']
})
export class MyPrivateViolationsComponent implements OnInit, OnDestroy, AfterViewChecked {
  @Input() formOnlyMode = false;
  @Input() initialViolationId: number | null = null;
  @Output() saved = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
  @ViewChild('testimonyStepRef', { read: ElementRef }) testimonyStepRef?: ElementRef<HTMLElement>;

  private shouldScrollToTestimony = false;

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
  showFollowUpModal = false;
  selectedViolationForFollowUp: PrivateViolationDto | null = null;
  followUpForm!: FormGroup;
  followUps: ViolationFollowUpDto[] = [];
  followUpStatuses: FollowUpStatusDto[] = [];
  loadingFollowUps = false;
  followUpAttachments: File[] = [];
  searchTerm: string = '';
  // Step management: 7 steps for إفادة (مرفقات الإفادة + مرفقات), 6 for استبيان.
  currentStep = 1;
  get totalSteps(): number {
    return this.isTestimonyKind ? 7 : 6;
  }
  get isTestimonyKind(): boolean {
    return this.violationForm?.get('kind')?.value === PrivateViolationKind.Testimony;
  }

  // Lookup data
  cities: CityDto[] = [];
  categories: CategoryDto[] = [];
  subCategories: SubCategoryDto[] = [];
  educationLevels: EducationLevelDto[] = [];
  filteredQuestions: QuestionDto[] = [];
  sortedQuestions: QuestionDto[] = [];
  loadingQuestions = false;

  // File upload: مرفقات (step 6 إفادة, step 5 استبيان)
  attachments: File[] = [];
  attachmentPreviews: AttachmentPreview[] = [];
  // مرفقات الإفادة (step 5 إفادة only, required)
  testimonyAttachments: File[] = [];
  testimonyAttachmentPreviews: AttachmentPreview[] = [];

  // Draft management
  hasDraft: boolean = false;
  draftTimestamp: Date | null = null;
  draftExplicitlySaved: boolean = false;

  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalCount = 0;
  totalPages = 0;

  // Enums
  AcceptanceStatus = AcceptanceStatus;
  PublishStatus = PublishStatus;
  PrivateViolationKind = PrivateViolationKind;
  PrivateViolationRole = PrivateViolationRole;
  Gender = Gender;
  PreferredContactMethod = PreferredContactMethod;
  getPrivateViolationKindLabel = getPrivateViolationKindLabel;

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
  ClipboardList = ClipboardList;

  // Enums for template
  MaritalStatus = MaritalStatus;

  constructor(
    private privateViolationService: PrivateViolationService,
    private violationFollowUpService: ViolationFollowUpService,
    private followUpStatusService: FollowUpStatusService,
    private cityService: CityService,
    private categoryService: CategoryService,
    private subCategoryService: SubCategoryService,
    private questionService: QuestionService,
    private educationLevelService: EducationLevelService,
    private toasterService: ToasterService,
    public permissionService: PermissionCheckService,
    private confirmationService: ConfirmationDialogService,
    private fileUploadService: FileUploadService,
    private authService: AuthService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initForms();
    this.loadLookupData();
    if (this.formOnlyMode) {
      this.checkDraft();
      if (this.initialViolationId != null) {
        this.loadViolationForEdit(this.initialViolationId);
      } else {
        this.modalTitle = 'إضافة بلاغ خاص جديد';
        this.editingViolation = null;
        this.originalViolationData = null;
        this.currentStep = 1;
        this.draftExplicitlySaved = false;
        this.violationForm.reset({
          kind: PrivateViolationKind.Questionnaire,
          testimonyContent: '',
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
        this.testimonyAttachments = [];
        this.testimonyAttachmentPreviews = [];
        this.showModal = true;
      }
    } else {
      const savedView = localStorage.getItem('my-private-violations-view-mode');
      if (savedView === 'table' || savedView === 'cards') {
        this.viewMode = savedView;
      }
      this.loadFollowUpStatuses();
      this.loadViolations();
      this.checkDraft();
      setTimeout(() => this.setupActions(), 0);
      this.filteredViolations = [];
    }
  }

  ngOnDestroy(): void {}

  ngAfterViewChecked(): void {
    if (this.shouldScrollToTestimony && this.testimonyStepRef?.nativeElement) {
      this.shouldScrollToTestimony = false;
      this.testimonyStepRef.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  loadViolationForEdit(id: number): void {
    this.modalTitle = 'تعديل بلاغ خاص';
    this.currentStep = 1;
    this.privateViolationService.getPrivateViolationById(id).subscribe({
      next: (fullViolation) => {
        this.editingViolation = { ...fullViolation, id: fullViolation.id };
        this.originalViolationData = { ...fullViolation };
        this.violationForm.patchValue({
          kind: fullViolation.kind ?? PrivateViolationKind.Questionnaire,
          testimonyContent: fullViolation.testimonyContent || '',
          cityId: fullViolation.cityId,
          categoryId: fullViolation.categoryId,
          violationDate: new Date(fullViolation.violationDate).toISOString().split('T')[0],
          location: fullViolation.location,
          description: fullViolation.description,
          personalName: fullViolation.personalName || '',
          personalCityId: fullViolation.personalCityId || null,
          personalAddress: fullViolation.personalAddress || '',
          personalAge: fullViolation.personalAge || null,
          personalDateOfBirth: fullViolation.personalDateOfBirth ? new Date(fullViolation.personalDateOfBirth).toISOString().split('T')[0] : '',
          personalEducationId: fullViolation.personalEducationId || null,
          hasDisability: fullViolation.hasDisability || false,
          disabilityType: fullViolation.disabilityType || '',
          gender: fullViolation.gender || null,
          maritalStatus: fullViolation.maritalStatus || null,
          work: fullViolation.work || '',
          canBeContacted: fullViolation.canBeContacted || false,
          contactName: fullViolation.contactName || '',
          contactAddress: fullViolation.contactAddress || '',
          contactEmail: fullViolation.contactEmail || '',
          contactPhone: fullViolation.contactPhone || '',
          preferredContactMethod: fullViolation.preferredContactMethod || null,
          role: fullViolation.role,
          otherRoleText: fullViolation.otherRoleText || '',
          showPersonalInfoInPublish: fullViolation.showPersonalInfoInPublish || false
        }, { emitEvent: false });
        this.loadSubCategories(fullViolation.categoryId, true);
        this.loadQuestions(fullViolation.categoryId, false);
        setTimeout(() => {
          const subCategoryControl = this.violationForm.get('subCategoryId');
          if (subCategoryControl && fullViolation.subCategoryId) {
            subCategoryControl.enable();
            subCategoryControl.setValue(fullViolation.subCategoryId, { emitEvent: false });
          }
        }, 300);
        this.attachments = [];
        this.attachmentPreviews = [];
        this.testimonyAttachments = [];
        this.testimonyAttachmentPreviews = [];
        if (fullViolation.attachments?.length) {
          const previews = fullViolation.attachments.map(att => ({
            file: null as File | null,
            preview: this.getAttachmentUrl(att.filePath),
            uploaded: true,
            filePath: att.filePath
          }));
          if (fullViolation.kind === PrivateViolationKind.Testimony) {
            this.testimonyAttachmentPreviews = previews;
          } else {
            this.attachmentPreviews = previews;
          }
        }
        const loadAnswers = () => {
          if (fullViolation.questionAnswers?.length) {
            const allReady = fullViolation.questionAnswers.every(a => this.questionsForm.get(`question_${a.questionId}`)) && this.sortedQuestions.length > 0;
            if (allReady && this.currentStep === 4) {
              const answersToSet: { [key: string]: any } = {};
              fullViolation.questionAnswers.forEach(answer => {
                if (answer.answerValue?.trim()) answersToSet[`question_${answer.questionId}`] = answer.answerValue.trim();
              });
              this.questionsForm.patchValue(answersToSet, { emitEvent: true });
              this.cdr.detectChanges();
            } else {
              setTimeout(loadAnswers, 300);
            }
          }
        };
        setTimeout(loadAnswers, 1500);
        this.showModal = true;
      },
      error: () => this.toasterService.showError('حدث خطأ أثناء تحميل تفاصيل البلاغ')
    });
  }

  initForms(): void {
    this.violationForm = this.fb.group({
      kind: [PrivateViolationKind.Questionnaire, Validators.required],
      testimonyContent: [''],
      cityId: ['', Validators.required],
      categoryId: ['', Validators.required],
      subCategoryId: [{ value: '', disabled: true }, Validators.required],
      violationDate: ['', Validators.required],
      location: ['', Validators.required],
      description: [''],
      // Personal/Victim Information
      personalName: [''],
      personalCityId: [null],
      personalAddress: [''],
      personalAge: [null],
      personalDateOfBirth: [''],
      personalEducationId: [null],
      hasDisability: [false],
      disabilityType: [''],
      gender: [null],
      maritalStatus: [null],
      work: [''],
      // Contact Information
      canBeContacted: [false],
      contactName: [''],
      contactAddress: [''],
      contactEmail: ['', Validators.email],
      contactPhone: [''],
      preferredContactMethod: [null],
      // Role
      role: [PrivateViolationRole.Witness, Validators.required],
      otherRoleText: [''],
      // Publish Settings
      showPersonalInfoInPublish: [false]
    });

    this.questionsForm = this.fb.group({});

    this.followUpForm = this.fb.group({
      followUpStatusId: ['', Validators.required],
      note: ['', Validators.required]
    });

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
          this.loadSubCategories(categoryIdNum, false);
          this.loadQuestions(categoryIdNum);
          subCategoryControl?.enable();
        }
      } else {
        this.subCategories = [];
        this.filteredQuestions = [];
        this.sortedQuestions = [];
        this.clearQuestionControls();
        this.loadingQuestions = false;
        subCategoryControl?.disable();
        subCategoryControl?.setValue('', { emitEvent: false });
      }
    });

    // Watch kind changes: for Testimony require testimonyContent; reset step if needed
    this.violationForm.get('kind')?.valueChanges.subscribe(kind => {
      const testimonyControl = this.violationForm.get('testimonyContent');
      if (kind === PrivateViolationKind.Testimony) {
        testimonyControl?.setValidators([Validators.required]);
      } else {
        testimonyControl?.clearValidators();
        testimonyControl?.setValue('');
      }
      testimonyControl?.updateValueAndValidity();
      if (kind === PrivateViolationKind.Testimony && this.currentStep === 6) {
        this.currentStep = 5;
      }
      if (kind !== PrivateViolationKind.Testimony && this.currentStep === 7) {
        this.currentStep = 6;
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
    this.loadEducationLevels();
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

  loadEducationLevels(): void {
    this.educationLevelService.getPublicLookup().subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.educationLevels = Array.isArray(response.data) ? response.data : [];
        }
      },
      error: (error: any) => {
        console.error('Error loading education levels:', error);
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
      next: (response: any) => {
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
      error: (error: any) => {
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

    this.questionService.getQuestionsByCategory(categoryId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const questions = Array.isArray(response.data) ? response.data : [];
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
        }
        this.loadingQuestions = false;
      },
      error: (error: any) => {
        console.error('Error loading questions:', error);
        this.toasterService.showError('حدث خطأ أثناء تحميل الأسئلة');
        this.loadingQuestions = false;
      }
    });
  }

  loadFollowUpStatuses(): void {
    this.followUpStatusService.getPublicLookup().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.followUpStatuses = Array.isArray(response.data) ? response.data : [];
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
    this.followUpAttachments = [];
    this.loadFollowUps(violation.id);
    this.showFollowUpModal = true;
  }

  closeFollowUpModal(): void {
    this.showFollowUpModal = false;
    this.selectedViolationForFollowUp = null;
    this.followUps = [];
    this.followUpForm.reset();
    this.followUpAttachments = [];
  }

  onFollowUpFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      Array.from(input.files).forEach(file => {
        if (file.size > 100 * 1024 * 1024) {
          this.toasterService.showWarning('حجم الملف يجب أن يكون أقل من 100 ميجابايت');
          return;
        }
        this.followUpAttachments.push(file);
      });
      input.value = '';
    }
  }

  removeFollowUpAttachment(index: number): void {
    this.followUpAttachments.splice(index, 1);
  }

  /** Deduplicate attachments by file identity (filePath+fileName) then id to avoid duplicate display */
  private deduplicateFollowUpAttachments(attachments?: ViolationFollowUpAttachmentDto[]): ViolationFollowUpAttachmentDto[] {
    if (!attachments || attachments.length === 0) return [];
    const seen = new Set<string>();
    return attachments.filter(att => {
      const path = (att.filePath || '').trim().toLowerCase();
      const name = (att.fileName || '').trim().toLowerCase();
      const key = path && name ? `${path}|${name}` : (path || name || (att.id ? `id:${att.id}` : ''));
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  loadFollowUps(violationId: number): void {
    this.loadingFollowUps = true;
    this.violationFollowUpService.getMyFollowUps(violationId).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.followUps = (response.data as ViolationFollowUpDto[]).map(fu => ({
            ...fu,
            attachments: this.deduplicateFollowUpAttachments(fu.attachments)
          }));
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

    if (this.followUpAttachments.length > 0) {
      this.loading = true;
      this.fileUploadService.uploadFiles(this.followUpAttachments).subscribe({
        next: (uploadResponses) => {
          const attachmentInputs: ViolationFollowUpAttachmentInputDto[] = uploadResponses.map((response, index) => {
            const file = this.followUpAttachments[index];
            return {
              fileName: response.fileName,
              filePath: response.url,
              fileType: file.type || 'application/octet-stream',
              fileSize: file.size
            };
          });
          this.saveFollowUpWithAttachments(attachmentInputs);
        },
        error: (error: any) => {
          this.loading = false;
          this.toasterService.showError(error.message || 'حدث خطأ أثناء رفع الملفات');
        }
      });
    } else {
      this.saveFollowUpWithAttachments([]);
    }
  }

  private saveFollowUpWithAttachments(attachments: ViolationFollowUpAttachmentInputDto[]): void {
    if (!this.selectedViolationForFollowUp) return;
    const dto: AddViolationFollowUpDto = {
      violationId: this.selectedViolationForFollowUp.id,
      violationType: 'Private',
      followUpStatusId: this.followUpForm.get('followUpStatusId')?.value,
      note: this.followUpForm.get('note')?.value,
      attachments
    };
    this.loading = true;
    this.violationFollowUpService.addFollowUp(dto).subscribe({
      next: () => {
        this.toasterService.showSuccess('تم إضافة Follow-up بنجاح');
        this.followUpForm.reset();
        this.followUpAttachments = [];
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
    
    // Delete (only if user has permission and violation is Pending)
    if (this.canDeleteViolation()) {
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
    
    // Follow-Up
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
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadViolations();
  }

  canDeleteViolation(): boolean {
    return this.permissionService.hasPermission('PrivateViolation', 'Delete') || this.permissionService.isSuperAdmin();
  }

  openAddModal(): void {
    if (!this.permissionService.hasPermission('PrivateViolation', 'Create') && !this.permissionService.isSuperAdmin()) {
      this.toasterService.showWarning('ليس لديك صلاحية لإضافة بلاغ خاص', 'صلاحية مرفوضة');
      return;
    }
    this.router.navigate(['/dashboard/my-private-violations/add']);
  }

  editViolation(violation: PrivateViolationDto): void {
    if (violation.acceptanceStatus !== AcceptanceStatus.Pending) {
      this.toasterService.showWarning('لا يمكن تعديل البلاغ بعد الموافقة عليه أو رفضه', 'تنبيه');
      return;
    }
    const currentUser = this.authService.getCurrentUser();
    if (currentUser && violation.createdByUserId && currentUser.id !== violation.createdByUserId && !this.permissionService.isSuperAdmin()) {
      this.toasterService.showWarning('يمكنك فقط تعديل البلاغات التي أنشأتها', 'تنبيه');
      return;
    }
    this.router.navigate(['/dashboard/my-private-violations/edit', violation.id]);
  }

  viewDetails(violation: PrivateViolationDto): void {
    this.router.navigate(['/dashboard/my-private-violations/view', violation.id]);
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedViolation = null;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      Array.from(input.files).forEach(file => {
        // Validate file type
        if (!file.type.startsWith('image/') && !file.type.startsWith('video/') && 
            !['.pdf', '.doc', '.docx'].some(ext => file.name.toLowerCase().endsWith(ext))) {
          this.toasterService.showWarning('يجب أن تكون الملفات صور أو فيديو أو مستندات');
          return;
        }
        
        // Validate file size (max 100MB)
        if (file.size > 100 * 1024 * 1024) {
          this.toasterService.showWarning('حجم الملف يجب أن يكون أقل من 100 ميجابايت');
          return;
        }
        
        this.attachments.push(file);
        
        // Create preview for images and videos
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (e: any) => {
            this.attachmentPreviews.push({
              file: file,
              preview: e.target.result,
              uploaded: false
            });
          };
          reader.readAsDataURL(file);
        } else if (file.type.startsWith('video/')) {
          // Create object URL for video preview
          const videoUrl = URL.createObjectURL(file);
          this.attachmentPreviews.push({
            file: file,
            preview: videoUrl,
            uploaded: false
          });
        } else {
          // For other files (PDF, DOC, etc.), no preview
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
    const preview = this.attachmentPreviews[index];
    
    // Clean up object URL if it's a video
    if (preview && preview.preview && preview.file && preview.file.type.startsWith('video/') && preview.preview.startsWith('blob:')) {
      URL.revokeObjectURL(preview.preview);
    }
    
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

  onTestimonyFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    Array.from(input.files).forEach(file => {
      if (file.size > 100 * 1024 * 1024) {
        this.toasterService.showWarning('حجم الملف يجب أن يكون أقل من 100 ميجابايت');
        return;
      }
      this.testimonyAttachments.push(file);
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.testimonyAttachmentPreviews.push({
            file: file,
            preview: e.target.result,
            uploaded: false
          });
        };
        reader.readAsDataURL(file);
      } else if (file.type.startsWith('video/')) {
        const videoUrl = URL.createObjectURL(file);
        this.testimonyAttachmentPreviews.push({
          file: file,
          preview: videoUrl,
          uploaded: false
        });
      } else {
        this.testimonyAttachmentPreviews.push({
          file: file,
          preview: '',
          uploaded: false
        });
      }
    });
    input.value = '';
  }

  removeTestimonyAttachment(index: number): void {
    const preview = this.testimonyAttachmentPreviews[index];
    if (preview?.preview && preview?.file?.type.startsWith('video/') && preview.preview.startsWith('blob:')) {
      URL.revokeObjectURL(preview.preview);
    }
    if (preview?.uploaded && preview?.filePath) {
      this.testimonyAttachmentPreviews.splice(index, 1);
    } else {
      const fileIndex = this.testimonyAttachments.findIndex(f => f === preview?.file);
      if (fileIndex !== -1) this.testimonyAttachments.splice(fileIndex, 1);
      this.testimonyAttachmentPreviews.splice(index, 1);
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

    // Validate: step 4 = testimony content or questions; step 5 = مرفقات الإفادة (إفادة) or N/A
    const step4Valid = this.validateStep(4);
    const step5Valid = !this.isTestimonyKind || this.validateStep(5);
    if (!this.validateStep(1) || !this.validateStep(3) || !step4Valid || !step5Valid) {
      this.toasterService.showWarning('يرجى إكمال جميع الحقول المطلوبة');
      if (!this.validateStep(1)) this.currentStep = 1;
      else if (!this.validateStep(3)) this.currentStep = 3;
      else if (!step4Valid) this.currentStep = 4;
      else this.currentStep = 5;
      return;
    }

    const hasNewNormalFiles = this.attachments.length > 0;
    const hasNewTestimonyFiles = this.isTestimonyKind && this.testimonyAttachments.length > 0;
    if (hasNewTestimonyFiles || hasNewNormalFiles) {
      this.uploadFilesAndSave();
    } else {
      const existingAttachments: PrivateViolationAttachmentInputDto[] = [];
      const pushPreview = (p: AttachmentPreview) => {
        if (p.uploaded && p.filePath) {
          existingAttachments.push({
            fileName: p.filePath.split('/').pop() || 'file',
            filePath: p.filePath,
            fileType: 'application/octet-stream',
            fileSize: 0
          });
        }
      };
      if (this.isTestimonyKind) {
        this.testimonyAttachmentPreviews.forEach(pushPreview);
        this.attachmentPreviews.forEach(pushPreview);
      } else {
        this.attachmentPreviews.forEach(pushPreview);
      }
      this.saveViolationWithAttachments(existingAttachments);
    }
  }

  uploadFilesAndSave(): void {
    this.loading = true;
    const pushFromPreviews = (list: PrivateViolationAttachmentInputDto[], previews: AttachmentPreview[]) => {
      previews.forEach(preview => {
        if (preview.uploaded && preview.filePath) {
          list.push({
            fileName: preview.filePath.split('/').pop() || 'file',
            filePath: preview.filePath,
            fileType: 'application/octet-stream',
            fileSize: 0
          });
        }
      });
    };

    const doSave = (allInputs: PrivateViolationAttachmentInputDto[]) => {
      if (this.isTestimonyKind) {
        pushFromPreviews(allInputs, this.testimonyAttachmentPreviews);
        pushFromPreviews(allInputs, this.attachmentPreviews);
      } else {
        pushFromPreviews(allInputs, this.attachmentPreviews);
      }
      this.saveViolationWithAttachments(allInputs);
    };

    if (this.isTestimonyKind && this.testimonyAttachments.length > 0) {
      this.fileUploadService.uploadFiles(this.testimonyAttachments).subscribe({
        next: (testimonyResponses) => {
          const testimonyInputs: PrivateViolationAttachmentInputDto[] = testimonyResponses.map((response, index) => {
            const file = this.testimonyAttachments[index];
            return {
              fileName: response.fileName,
              filePath: response.url,
              fileType: file.type || 'application/octet-stream',
              fileSize: file.size
            };
          });
          if (this.attachments.length > 0) {
            this.fileUploadService.uploadFiles(this.attachments).subscribe({
              next: (normalResponses) => {
                const normalInputs = normalResponses.map((response, index) => {
                  const file = this.attachments[index];
                  return {
                    fileName: response.fileName,
                    filePath: response.url,
                    fileType: file.type || 'application/octet-stream',
                    fileSize: file.size
                  };
                });
                doSave([...testimonyInputs, ...normalInputs]);
              },
              error: (err) => {
                this.loading = false;
                this.toasterService.showError(err.message || 'حدث خطأ أثناء رفع الملفات');
              }
            });
          } else {
            doSave(testimonyInputs);
          }
        },
        error: (err) => {
          this.loading = false;
          this.toasterService.showError(err.message || 'حدث خطأ أثناء رفع الملفات');
        }
      });
    } else {
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
          doSave(attachmentInputs);
        },
        error: (error) => {
          console.error('Error uploading files:', error);
          this.loading = false;
          this.toasterService.showError(error.message || 'حدث خطأ أثناء رفع الملفات');
        }
      });
    }
  }

  saveViolationWithAttachments(attachments: PrivateViolationAttachmentInputDto[]): void {
    // Enable disabled controls to get their values
    const subCategoryControl = this.violationForm.get('subCategoryId');
    if (subCategoryControl?.disabled) {
      subCategoryControl.enable();
    }
    
    const formValue = this.violationForm.value;
    
    // Build question answers (only for استبيان)
    const questionAnswers: QuestionAnswerDto[] = [];
    if (!this.isTestimonyKind) {
      this.sortedQuestions.forEach(question => {
        const control = this.questionsForm.get(`question_${question.id}`);
        if (control && control.value) {
          questionAnswers.push({
            questionId: question.id,
            answerValue: control.value
          });
        }
      });
    }

    if (this.editingViolation) {
      // Update existing violation
      const updateDto: UpdatePrivateViolationDto = {
        id: this.editingViolation.id,
        cityId: Number(formValue.cityId),
        categoryId: Number(formValue.categoryId),
        subCategoryId: Number(formValue.subCategoryId),
        kind: Number(formValue.kind) as PrivateViolationKind,
        testimonyContent: this.getTestimonyContentAsHtml() || undefined,
        violationDate: formValue.violationDate,
        location: formValue.location,
        description: formValue.description,
        personalName: formValue.personalName || undefined,
        personalCityId: formValue.personalCityId ? Number(formValue.personalCityId) : undefined,
        personalAddress: formValue.personalAddress || undefined,
        personalAge: formValue.personalAge ? Number(formValue.personalAge) : undefined,
        personalDateOfBirth: formValue.personalDateOfBirth || undefined,
        personalEducationId: formValue.personalEducationId ? Number(formValue.personalEducationId) : undefined,
        hasDisability: formValue.hasDisability || undefined,
        disabilityType: formValue.disabilityType || undefined,
        gender: formValue.gender !== null && formValue.gender !== undefined ? Number(formValue.gender) : undefined,
        maritalStatus: formValue.maritalStatus || undefined,
        work: formValue.work || undefined,
        canBeContacted: formValue.canBeContacted !== undefined ? formValue.canBeContacted : undefined,
        contactName: formValue.contactName || undefined,
        contactAddress: formValue.contactAddress || undefined,
        contactEmail: formValue.contactEmail || undefined,
        contactPhone: formValue.contactPhone || undefined,
        preferredContactMethod: formValue.preferredContactMethod !== null && formValue.preferredContactMethod !== undefined ? Number(formValue.preferredContactMethod) : undefined,
        role: Number(formValue.role),
        otherRoleText: formValue.otherRoleText || undefined,
        showPersonalInfoInPublish: formValue.showPersonalInfoInPublish || false,
        questionAnswers: questionAnswers,
        attachments: attachments
      };

      this.privateViolationService.updatePrivateViolation(updateDto).subscribe({
        next: () => {
          this.toasterService.showSuccess('تم تحديث البلاغ بنجاح');
          this.clearDraft();
          this.draftExplicitlySaved = false;
          if (this.formOnlyMode) {
            this.saved.emit();
          } else {
            this.closeModalInternal();
            this.loadViolations();
          }
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
        kind: Number(formValue.kind) as PrivateViolationKind,
        testimonyContent: this.getTestimonyContentAsHtml() || undefined,
        violationDate: formValue.violationDate,
        location: formValue.location,
        description: formValue.description,
        personalName: formValue.personalName || undefined,
        personalCityId: formValue.personalCityId ? Number(formValue.personalCityId) : undefined,
        personalAddress: formValue.personalAddress || undefined,
        personalAge: formValue.personalAge ? Number(formValue.personalAge) : undefined,
        personalDateOfBirth: formValue.personalDateOfBirth || undefined,
        personalEducationId: formValue.personalEducationId ? Number(formValue.personalEducationId) : undefined,
        hasDisability: formValue.hasDisability || undefined,
        disabilityType: formValue.disabilityType || undefined,
        gender: formValue.gender !== null && formValue.gender !== undefined ? Number(formValue.gender) : undefined,
        maritalStatus: formValue.maritalStatus || undefined,
        work: formValue.work || undefined,
        canBeContacted: formValue.canBeContacted !== undefined ? formValue.canBeContacted : undefined,
        contactName: formValue.contactName || undefined,
        contactAddress: formValue.contactAddress || undefined,
        contactEmail: formValue.contactEmail || undefined,
        contactPhone: formValue.contactPhone || undefined,
        preferredContactMethod: formValue.preferredContactMethod !== null && formValue.preferredContactMethod !== undefined ? Number(formValue.preferredContactMethod) : undefined,
        role: Number(formValue.role),
        otherRoleText: formValue.otherRoleText || undefined,
        showPersonalInfoInPublish: formValue.showPersonalInfoInPublish || false,
        questionAnswers: questionAnswers,
        attachments: attachments
      };

      this.privateViolationService.createPrivateViolation(addDto).subscribe({
        next: () => {
          this.toasterService.showSuccess('تم إضافة البلاغ بنجاح');
          this.clearDraft();
          if (this.formOnlyMode) {
            this.saved.emit();
          } else {
            this.closeModalInternal();
            this.loadViolations();
          }
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
    if (this.formOnlyMode) {
      if (this.editingViolation) {
        this.cancel.emit();
        return;
      }
      if (this.hasFormData() && !this.draftExplicitlySaved) {
        this.promptSaveDraftOnClose();
        return;
      }
      this.cancel.emit();
      return;
    }
    if (this.editingViolation) {
      this.closeModalInternal();
      return;
    }
    if (this.hasFormData() && !this.draftExplicitlySaved) {
      this.promptSaveDraftOnClose();
    } else {
      this.closeModalInternal();
    }
  }

  // Step management methods
  nextStep(): void {
    if (this.currentStep < this.totalSteps) {
      // Validate current step before moving forward
      if (this.validateCurrentStep()) {
        this.currentStep++;
        // If navigating to questions step (step 4 for استبيان), ensure questions are loaded
        if (this.currentStep === 4 && !this.isTestimonyKind) {
          this.ensureQuestionsLoaded();
        }
        // If navigating to testimony step (step 4 for إفادة) in edit mode, re-patch so editor displays HTML
        if (this.currentStep === 4 && this.isTestimonyKind && this.originalViolationData?.testimonyContent) {
          const html = this.originalViolationData.testimonyContent;
          setTimeout(() => {
            this.violationForm.get('testimonyContent')?.setValue(html, { emitEvent: false });
            this.cdr.detectChanges();
          }, 150);
        }
        if (this.currentStep === 4 && this.isTestimonyKind) {
          this.shouldScrollToTestimony = true;
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
      if (this.currentStep === 4 && !this.isTestimonyKind) {
        this.ensureQuestionsLoaded();
      }
    }
  }

  goToStep(step: number): void {
    if (this.canGoToStep(step)) {
      this.currentStep = step;
      if (step === 4 && !this.isTestimonyKind) {
        this.ensureQuestionsLoaded();
      }
      if (step === 4 && this.isTestimonyKind && this.originalViolationData?.testimonyContent) {
        const html = this.originalViolationData.testimonyContent;
        setTimeout(() => {
          this.violationForm.get('testimonyContent')?.setValue(html, { emitEvent: false });
          this.cdr.detectChanges();
        }, 150);
      }
      if (step === 4 && this.isTestimonyKind) {
        this.shouldScrollToTestimony = true;
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
      case 1: // Basic Information (testimony content is validated in step 4 for Testimony)
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

        // Only require enabled controls to be valid; disabled controls (e.g. subCategoryId until category is selected) are skipped
        return basicFields.every(field => {
          const control = this.violationForm.get(field);
          if (!control) return false;
          if (control.disabled) return true;
          return control.valid;
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
      case 4: // محتوى الإفادة (افادات) or Questions (استبيان)
        if (this.isTestimonyKind) {
          const testimonyControl = this.violationForm.get('testimonyContent');
          testimonyControl?.markAsTouched();
          const raw = testimonyControl?.value;
          let content = '';
          if (typeof raw === 'string') {
            content = raw.trim();
          } else if (raw && typeof raw === 'object') {
            content = ''; // Legacy ProseMirror JSON; textarea stores string only
          }
          return content.length > 0;
        }
        // Mark all question controls as touched
        this.sortedQuestions.forEach(question => {
          const control = this.questionsForm.get(`question_${question.id}`);
          if (control) {
            control.markAsTouched();
          }
        });
        for (const question of this.sortedQuestions) {
          if (question.isRequired) {
            const control = this.questionsForm.get(`question_${question.id}`);
            if (!control || !control.value || (typeof control.value === 'string' && control.value.trim() === '')) {
              return false;
            }
          }
        }
        return true;
      case 5: // مرفقات الإفادة (إفادة: required) or المرفقات (استبيان: optional)
        if (this.isTestimonyKind) {
          return this.testimonyAttachmentPreviews.length >= 1;
        }
        return true;
      case 6: // مرفقات (إفادة: optional) or Review (استبيان)
        if (this.isTestimonyKind) return true;
        return true;
      case 7: // المراجعة (إفادة only)
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

  getKindValue(): string {
    const kind = this.violationForm.get('kind')?.value;
    return kind !== null && kind !== undefined ? getPrivateViolationKindLabel(kind) : '';
  }

  /** Returns testimony content as HTML string for display (handles ProseMirror JSON). */
  getTestimonyContentValue(): string {
    return this.getTestimonyContentAsHtml();
  }

  /** Normalizes testimony form value to string for API (textarea stores plain text/HTML). */
  private getTestimonyContentAsHtml(): string {
    const raw = this.violationForm.get('testimonyContent')?.value;
    return raw != null && typeof raw === 'string' ? raw : '';
  }

  /** Step label. إفادة: 5=مرفقات الإفادة, 6=مرفقات, 7=المراجعة; استبيان: 4=الأسئلة, 5=المرفقات, 6=المراجعة */
  getStepLabel(step: number): string {
    if (this.isTestimonyKind) {
      const labels: { [key: number]: string } = { 1: 'المعلومات الأساسية', 2: 'معلومات الضحية', 3: 'معلومات الاتصال', 4: 'محتوى الإفادة', 5: 'مرفقات الإفادة', 6: 'مرفقات', 7: 'المراجعة' };
      return labels[step] || '';
    }
    const labels: { [key: number]: string } = { 1: 'المعلومات الأساسية', 2: 'معلومات الضحية', 3: 'معلومات الاتصال', 4: 'الأسئلة', 5: 'المرفقات', 6: 'المراجعة' };
    return labels[step] || '';
  }

  get stepNumbers(): number[] {
    return Array.from({ length: this.totalSteps }, (_, i) => i + 1);
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
    const cityId = this.violationForm.get('personalCityId')?.value;
    if (!cityId) return '';
    const city = this.cities.find(c => c.id === cityId);
    return city ? city.name : '';
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
    const educationId = this.violationForm.get('personalEducationId')?.value;
    if (!educationId) return '';
    const education = this.educationLevels.find(e => e.id === educationId);
    return education ? education.name : '';
  }

  getCityNameById(cityId: number): string {
    if (!cityId) return '';
    const city = this.cities.find(c => c.id === cityId);
    return city ? city.name : '';
  }

  getPreferredContactMethodLabel(method: PreferredContactMethod | null | undefined): string {
    if (!method) return '';
    return getPreferredContactMethodLabel(method);
  }

  getGenderValue(): string {
    const gender = this.violationForm.get('gender')?.value;
    return gender !== null && gender !== undefined ? getGenderLabel(gender) : '';
  }

  getMaritalStatusValue(): string {
    const value = this.violationForm.get('maritalStatus')?.value;
    return value ? getMaritalStatusLabel(value) : '';
  }

  getMaritalStatusLabel(status: MaritalStatus): string {
    return getMaritalStatusLabel(status);
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
    
    if ((formValue.kind ?? PrivateViolationKind.Questionnaire) !== (original.kind ?? PrivateViolationKind.Questionnaire) ||
        (formValue.testimonyContent || '') !== (original.testimonyContent || '')) {
      return true;
    }
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
        formValue.personalCityId !== (original.personalCityId || null) ||
        formValue.personalAddress !== (original.personalAddress || '') ||
        formValue.personalAge !== (original.personalAge || null) ||
        formValue.personalEducationId !== (original.personalEducationId || null) ||
        formValue.gender !== (original.gender || null) ||
        formValue.maritalStatus !== (original.maritalStatus || '') ||
        formValue.work !== (original.work || '') ||
        formValue.hasDisability !== (original.hasDisability || false) ||
        formValue.disabilityType !== (original.disabilityType || '')) {
      return true;
    }
    
    // Check contact information
    if (formValue.canBeContacted !== (original.canBeContacted || false) ||
        formValue.contactName !== (original.contactName || '') ||
        formValue.contactAddress !== (original.contactAddress || '') ||
        formValue.contactEmail !== (original.contactEmail || '') ||
        formValue.contactPhone !== (original.contactPhone || '') ||
        formValue.preferredContactMethod !== (original.preferredContactMethod || null)) {
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
    
    // Check attachments count (إفادة: testimony + normal; استبيان: normal only)
    const currentAttachmentCount = this.isTestimonyKind
      ? this.testimonyAttachmentPreviews.length + this.attachmentPreviews.length
      : this.attachmentPreviews.length;
    const originalAttachmentCount = original.attachments?.length || 0;
    if (currentAttachmentCount !== originalAttachmentCount) {
      return true;
    }
    
    return false;
  }

  // Draft Management Methods
  getDraftKey(): string {
    const currentUser = this.authService.getCurrentUser();
    const userId = currentUser?.id || 'anonymous';
    return `private_violation_draft_${userId}`;
  }

  checkDraft(): void {
    const draftKey = this.getDraftKey();
    const draftStr = localStorage.getItem(draftKey);
    if (draftStr) {
      try {
        const draft: DraftData = JSON.parse(draftStr);
        this.hasDraft = true;
        this.draftTimestamp = new Date(draft.timestamp);
      } catch (error: unknown) {
        console.error('Error parsing draft data:', error);
        this.clearDraft();
      }
    } else {
      this.hasDraft = false;
      this.draftTimestamp = null;
    }
  }

  hasFormData(): boolean {
    // Check violationForm for any non-empty values (excluding defaults)
    const formValue = this.violationForm.value;
    const defaultValues = {
      kind: PrivateViolationKind.Questionnaire,
      testimonyContent: '',
      role: PrivateViolationRole.Witness,
      showPersonalInfoInPublish: false,
      hasDisability: false
    };

    // Check if any field has a value different from default/empty
    const hasViolationFormData = Object.keys(formValue).some(key => {
      const value = formValue[key];
      const defaultValue = defaultValues[key as keyof typeof defaultValues];
      
      if (value === null || value === undefined || value === '') {
        return false;
      }
      
      if (defaultValue !== undefined && value === defaultValue) {
        return false; // It's just the default value
      }
      
      return true;
    });

    // Check questionsForm for any answers
    const hasQuestionAnswers = Object.keys(this.questionsForm.controls).some(key => {
      const control = this.questionsForm.get(key);
      return control && control.value && String(control.value).trim() !== '';
    });

    // Check if attachments or attachmentPreviews have items (إفادة: testimony + normal)
    const hasAttachments = this.attachments.length > 0 || this.attachmentPreviews.length > 0 ||
      this.testimonyAttachments.length > 0 || this.testimonyAttachmentPreviews.length > 0;

    return hasViolationFormData || hasQuestionAnswers || hasAttachments;
  }

  saveDraft(): void {
    try {
      const formValue = this.violationForm.getRawValue ? this.violationForm.getRawValue() : this.violationForm.value;
      
      // Collect question answers
      const questionsFormData: { [key: string]: any } = {};
      Object.keys(this.questionsForm.controls).forEach(key => {
        const control = this.questionsForm.get(key);
        if (control && control.value) {
          questionsFormData[key] = control.value;
        }
      });

      // Convert attachmentPreviews to serializable format
      const attachmentPreviewsData = this.attachmentPreviews.map(preview => ({
        preview: preview.preview, // Base64 preview if image
        fileName: preview.file?.name || 'file',
        fileSize: preview.file?.size || 0,
        fileType: preview.file?.type || 'application/octet-stream',
        uploaded: preview.uploaded,
        filePath: preview.filePath
      }));

      const draftData: DraftData = {
        violationForm: formValue,
        questionsForm: questionsFormData,
        attachmentPreviews: attachmentPreviewsData,
        currentStep: this.currentStep,
        timestamp: new Date().toISOString(),
        categoryId: formValue.categoryId ? Number(formValue.categoryId) : undefined,
        subCategoryId: formValue.subCategoryId ? Number(formValue.subCategoryId) : undefined
      };

      const draftKey = this.getDraftKey();
      localStorage.setItem(draftKey, JSON.stringify(draftData));
      
      this.hasDraft = true;
      this.draftTimestamp = new Date();
      this.draftExplicitlySaved = true;
      
      this.toasterService.showSuccess('تم حفظ المسودة بنجاح');
    } catch (error: unknown) {
      console.error('Error saving draft:', error);
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        this.toasterService.showError('لا يمكن حفظ المسودة: مساحة التخزين المحلية ممتلئة');
      } else {
        this.toasterService.showError('حدث خطأ أثناء حفظ المسودة');
      }
    }
  }

  loadDraft(): void {
    const draftKey = this.getDraftKey();
    const draftStr = localStorage.getItem(draftKey);
    
    if (!draftStr) {
      return;
    }

    try {
      const draft: DraftData = JSON.parse(draftStr);
      
      // Restore violationForm values
      this.violationForm.patchValue(draft.violationForm, { emitEvent: false });
      
      // Load category/subcategory if needed to trigger question loading
      if (draft.categoryId) {
        this.loadSubCategories(draft.categoryId, true);
        this.loadQuestions(draft.categoryId, false);
        
        if (draft.subCategoryId) {
          setTimeout(() => {
            const subCategoryControl = this.violationForm.get('subCategoryId');
            if (subCategoryControl && draft.subCategoryId) {
              subCategoryControl.enable();
              subCategoryControl.setValue(draft.subCategoryId, { emitEvent: false });
            }
          }, 300);
        }
      }

      // Restore questionsForm after questions are loaded
      if (draft.questionsForm && Object.keys(draft.questionsForm).length > 0) {
        // Wait for questions to be loaded, then restore answers
        const restoreAnswers = () => {
          // Check if all question controls exist
          const allControlsExist = Object.keys(draft.questionsForm).every(key => {
            return this.questionsForm.get(key) !== null;
          });

          if (allControlsExist && this.sortedQuestions.length > 0) {
            this.questionsForm.patchValue(draft.questionsForm, { emitEvent: true });
            // Mark controls as touched and dirty
            Object.keys(draft.questionsForm).forEach(key => {
              const control = this.questionsForm.get(key);
              if (control) {
                control.markAsTouched();
                control.markAsDirty();
              }
            });
            this.cdr.detectChanges();
          } else {
            // Retry after a short delay if controls don't exist yet
            setTimeout(restoreAnswers, 300);
          }
        };
        
        // Start restoring after questions are loaded
        setTimeout(restoreAnswers, 1500);
      }

      // Restore attachmentPreviews metadata (user will need to re-upload files)
      this.attachmentPreviews = draft.attachmentPreviews.map(att => ({
        file: null,
        preview: att.preview,
        uploaded: att.uploaded,
        filePath: att.filePath
      }));
      this.attachments = []; // Files cannot be restored

      // Restore currentStep
      this.currentStep = draft.currentStep || 1;
      
      this.draftExplicitlySaved = false; // So user can save again if needed
      
      // Show notification about file re-upload requirement
      if (draft.attachmentPreviews.length > 0) {
        this.toasterService.showWarning('يرجى إعادة رفع الملفات المرفقة', 'ملاحظة');
      }
    } catch (error: unknown) {
      console.error('Error loading draft:', error);
      this.toasterService.showError('حدث خطأ أثناء تحميل المسودة');
      this.clearDraft();
    }
  }

  clearDraft(): void {
    const draftKey = this.getDraftKey();
    localStorage.removeItem(draftKey);
    this.hasDraft = false;
    this.draftTimestamp = null;
    this.draftExplicitlySaved = false;
  }

  startFresh(): void {
    // Clean up object URLs for videos
    this.attachmentPreviews.forEach(preview => {
      if (preview.preview && preview.file && preview.file.type.startsWith('video/') && preview.preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview.preview);
      }
    });
    
    this.clearDraft();
    this.checkDraft();
    this.violationForm.reset({
      kind: PrivateViolationKind.Questionnaire,
      testimonyContent: '',
      role: PrivateViolationRole.Witness,
      showPersonalInfoInPublish: false,
      hasDisability: false
    });
    this.questionsForm.reset();
    this.clearQuestionControls();
    this.attachments = [];
    this.attachmentPreviews = [];
    this.testimonyAttachments = [];
    this.testimonyAttachmentPreviews = [];
    this.currentStep = 1;
    this.filteredQuestions = [];
    this.sortedQuestions = [];
    this.loadingQuestions = false;
  }

  promptSaveDraftOnClose(): void {
    this.confirmationService.show({
      title: 'حفظ المسودة',
      message: 'لديك تغييرات غير محفوظة. هل تريد حفظها كمسودة؟',
      confirmText: 'حفظ كمسودة',
      cancelText: 'إغلاق بدون حفظ',
      type: 'warning'
    }).then(confirmed => {
      if (confirmed) {
        this.saveDraft();
      }
      if (this.formOnlyMode) {
        this.cancel.emit();
      } else {
        this.closeModalInternal();
      }
    });
  }

  private closeModalInternal(): void {
    if (this.formOnlyMode) {
      this.cancel.emit();
      return;
    }
    this.showModal = false;
    this.editingViolation = null;
    this.originalViolationData = null;
    this.currentStep = 1;
    this.violationForm.reset({
      kind: PrivateViolationKind.Questionnaire,
      testimonyContent: '',
      role: PrivateViolationRole.Witness,
      showPersonalInfoInPublish: false,
      hasDisability: false
    });
    this.questionsForm.reset();
    this.clearQuestionControls();
    this.attachments = [];
    this.attachmentPreviews = [];
    this.testimonyAttachments = [];
    this.testimonyAttachmentPreviews = [];
    this.filteredQuestions = [];
    this.sortedQuestions = [];
    this.loading = false;
    this.draftExplicitlySaved = false;
  }
}