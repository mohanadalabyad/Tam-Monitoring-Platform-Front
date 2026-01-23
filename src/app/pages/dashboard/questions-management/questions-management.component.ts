import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray, FormControl } from '@angular/forms';
import { QuestionService } from '../../../services/question.service';
import { CategoryService } from '../../../services/category.service';
import { ToasterService } from '../../../services/toaster.service';
import { PermissionCheckService } from '../../../services/permission-check.service';
import { ConfirmationDialogService } from '../../../services/confirmation-dialog.service';
import { QuestionDto, AddQuestionDto, UpdateQuestionDto, QuestionType, getQuestionTypeLabel } from '../../../models/question.model';
import { CategoryDto } from '../../../models/category.model';
import { TableColumn, TableAction } from '../../../components/unified-table/unified-table.component';
import { ViewMode } from '../../../components/view-toggle/view-toggle.component';
import { Pencil, Trash2, HelpCircle, Power, PowerOff, Plus, X } from 'lucide-angular';

@Component({
  selector: 'app-questions-management',
  templateUrl: './questions-management.component.html',
  styleUrls: ['./questions-management.component.scss']
})
export class QuestionsManagementComponent implements OnInit {
  questions: QuestionDto[] = [];
  categories: CategoryDto[] = [];
  loading = false;
  showModal = false;
  modalTitle = '';
  questionForm!: FormGroup;
  filterForm!: FormGroup;
  editingQuestion: QuestionDto | null = null;
  viewMode: ViewMode = 'table';
  togglingQuestions: Set<number> = new Set();
  questionTypes: { value: QuestionType; label: string }[] = [];
  selectedCategoryFilter: number | null = null;

  columns: TableColumn[] = [
    { key: 'order', label: 'الترتيب', sortable: true, filterable: false },
    { key: 'text', label: 'النص', sortable: true, filterable: false },
    { 
      key: 'categoryId', 
      label: 'الفئة', 
      sortable: true, 
      filterable: false,
      render: (value) => {
        const category = this.categories.find(c => c.id === value);
        return category ? category.name : 'غير محدد';
      }
    },
    { 
      key: 'questionType', 
      label: 'النوع', 
      sortable: true, 
      filterable: false,
      render: (value) => getQuestionTypeLabel(value)
    },
    { 
      key: 'isRequired', 
      label: 'مطلوب', 
      sortable: true, 
      filterable: false,
      type: 'chip',
      render: (value) => value ? 'نعم' : 'لا'
    },
    { 
      key: 'isActive', 
      label: 'الحالة', 
      sortable: true, 
      filterable: false,
      type: 'toggle',
      toggleAction: (this.permissionService.hasPermission('Question', 'ToggleActivity') || this.permissionService.isSuperAdmin()) 
        ? (row, event) => this.toggleQuestionActivity(row, event)
        : undefined,
      isToggling: (row) => this.isToggling(row.id)
    }
  ];

  actions: TableAction[] = [];
  
  // Lucide icons
  Pencil = Pencil;
  Trash2 = Trash2;
  HelpCircle = HelpCircle;
  Power = Power;
  PowerOff = PowerOff;
  Plus = Plus;
  X = X;

  constructor(
    private questionService: QuestionService,
    private categoryService: CategoryService,
    private toasterService: ToasterService,
    public permissionService: PermissionCheckService,
    private confirmationService: ConfirmationDialogService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Load view preference
    const savedView = localStorage.getItem('questions-view-mode');
    if (savedView === 'table' || savedView === 'cards') {
      this.viewMode = savedView;
    }
    this.questionTypes = this.questionService.getQuestionTypes();
    this.loadCategories();
    this.initForm();
    this.initFilterForm();
    this.loadQuestions();
    // Setup actions after a brief delay to ensure user data is loaded
    setTimeout(() => {
      this.setupActions();
    }, 0);
  }

  loadCategories(): void {
    this.categoryService.getAllCategories(true).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.categories = Array.isArray(response.data) ? response.data : response.data.items || [];
        }
      },
      error: (error) => {
        console.error('Error loading categories:', error);
      }
    });
  }

  onViewChange(view: ViewMode): void {
    this.viewMode = view;
    localStorage.setItem('questions-view-mode', view);
  }

  initForm(): void {
    this.questionForm = this.fb.group({
      text: ['', Validators.required],
      questionType: [QuestionType.Text, Validators.required],
      categoryId: ['', Validators.required],
      order: [1, [Validators.required, Validators.min(1)]],
      isRequired: [false],
      optionsArray: this.fb.array([]) // FormArray for user-friendly options
    });

    // Watch for questionType changes to show/hide options field
    this.questionForm.get('questionType')?.valueChanges.subscribe(type => {
      this.handleQuestionTypeChange(type);
    });
  }

  get optionsArray(): FormArray {
    return this.questionForm.get('optionsArray') as FormArray;
  }

  addOption(): void {
    const optionsArray = this.questionForm.get('optionsArray') as FormArray;
    const validators = this.isMultipleChoiceType() ? [Validators.required] : [];
    optionsArray.push(this.fb.control('', validators));
  }

  removeOption(index: number): void {
    const optionsArray = this.questionForm.get('optionsArray') as FormArray;
    if (optionsArray.length > 1) {
      optionsArray.removeAt(index);
    }
  }

  initFilterForm(): void {
    this.filterForm = this.fb.group({
      categoryId: ['']
    });

    // Watch for category filter changes
    this.filterForm.get('categoryId')?.valueChanges.subscribe(categoryId => {
      this.selectedCategoryFilter = categoryId || null;
      this.loadQuestions();
    });
  }

  setupActions(): void {
    this.actions = [];
    
    if (this.permissionService.hasPermission('Question', 'Update') || this.permissionService.isSuperAdmin()) {
      this.actions.push({
        label: 'تعديل',
        icon: Pencil,
        action: (row) => this.editQuestion(row),
        class: 'btn-edit',
        variant: 'warning',
        showLabel: false
      });
    }
    
    if (this.permissionService.hasPermission('Question', 'Delete') || this.permissionService.isSuperAdmin()) {
      this.actions.push({
        label: 'حذف',
        icon: Trash2,
        action: (row) => this.deleteQuestion(row),
        class: 'btn-delete',
        variant: 'danger',
        showLabel: false
      });
    }
  }

  loadQuestions(): void {
    this.loading = true;
    
    // If category filter is selected, use filter endpoint
    if (this.selectedCategoryFilter) {
      const filter = { 
        categoryId: this.selectedCategoryFilter,
        isActive: undefined // Get all (active and inactive) for management page
      };
      this.questionService.getAllQuestionsWithFilter(filter, undefined, undefined, undefined).subscribe({
        next: (response) => {
          if (response.success && response.data) {
            const questions = Array.isArray(response.data) ? response.data : response.data.items || [];
            // Sort by order
            this.questions = questions.sort((a, b) => a.order - b.order);
          } else {
            this.toasterService.showError(response.message || 'حدث خطأ أثناء تحميل الأسئلة');
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading questions:', error);
          this.loading = false;
          this.toasterService.showError('حدث خطأ أثناء تحميل الأسئلة');
        }
      });
    } else {
      // No filter: get ALL questions (active and inactive) - pass undefined for isActive
      this.questionService.getAllQuestions(undefined, undefined, undefined).subscribe({
        next: (response) => {
          if (response.success && response.data) {
            const questions = Array.isArray(response.data) ? response.data : response.data.items || [];
            // Sort by order
            this.questions = questions.sort((a, b) => a.order - b.order);
          } else {
            this.toasterService.showError(response.message || 'حدث خطأ أثناء تحميل الأسئلة');
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading questions:', error);
          this.loading = false;
          this.toasterService.showError('حدث خطأ أثناء تحميل الأسئلة');
        }
      });
    }
  }

  clearFilter(): void {
    this.filterForm.patchValue({ categoryId: '' });
    this.selectedCategoryFilter = null;
    // loadQuestions will be triggered by valueChanges subscription
  }

  openAddModal(): void {
    this.modalTitle = 'إضافة سؤال جديد';
    this.editingQuestion = null;
    // Get next order number
    const maxOrder = this.questions.length > 0 ? Math.max(...this.questions.map(q => q.order)) : 0;
    // Clear options array
    const optionsArray = this.questionForm.get('optionsArray') as FormArray;
    while (optionsArray.length !== 0) {
      optionsArray.removeAt(0);
    }
    this.questionForm.reset({ 
      text: '', 
      questionType: QuestionType.Text,
      categoryId: '',
      order: maxOrder + 1, 
      isRequired: false
    });
    this.showModal = true;
  }

  editQuestion(question: QuestionDto): void {
    // Check permission
    if (!this.permissionService.hasPermission('Question', 'Update') && !this.permissionService.isSuperAdmin()) {
      this.toasterService.showWarning('ليس لديك صلاحية لتعديل الأسئلة', 'صلاحية مرفوضة');
      return;
    }

    this.modalTitle = 'تعديل سؤال';
    this.editingQuestion = question;
    
    // Reset form first to clear any previous state
    this.questionForm.reset();
    
    // Clear options array
    const optionsArray = this.questionForm.get('optionsArray') as FormArray;
    while (optionsArray.length !== 0) {
      optionsArray.removeAt(0);
    }
    
    // Parse options JSON if MultipleChoice type
    if (question.questionType === QuestionType.MultipleChoice && question.options) {
      try {
        const parsedOptions = JSON.parse(question.options);
        if (Array.isArray(parsedOptions)) {
          parsedOptions.forEach((option: string) => {
            optionsArray.push(this.fb.control(option, [Validators.required]));
          });
        }
      } catch (e) {
        console.error('Error parsing options JSON:', e);
        // If parsing fails, add empty option
        this.addOption();
      }
    }
    
    // Patch values
    this.questionForm.patchValue({
      text: question.text,
      questionType: question.questionType,
      categoryId: question.categoryId,
      order: question.order,
      isRequired: question.isRequired
    }, { emitEvent: false });
    
    this.showModal = true;
  }

  deleteQuestion(question: QuestionDto): void {
    // Check permission before deleting
    if (!this.permissionService.hasPermission('Question', 'Delete') && !this.permissionService.isSuperAdmin()) {
      this.toasterService.showWarning('ليس لديك صلاحية لحذف الأسئلة', 'صلاحية مرفوضة');
      return;
    }

    this.confirmationService.show({
      title: 'تأكيد الحذف',
      message: `هل أنت متأكد من حذف السؤال "${question.text}"؟`,
      confirmText: 'حذف',
      cancelText: 'إلغاء',
      type: 'danger'
    }).then(confirmed => {
      if (confirmed) {
        this.questionService.deleteQuestion(question.id).subscribe({
          next: () => {
            this.questions = this.questions.filter(q => q.id !== question.id);
            this.toasterService.showSuccess('تم حذف السؤال بنجاح');
          },
          error: (error) => {
            console.error('Error deleting question:', error);
            this.toasterService.showError(error.message || 'حدث خطأ أثناء حذف السؤال');
          }
        });
      }
    });
  }

  saveQuestion(): void {
    if (this.questionForm.invalid) {
      Object.keys(this.questionForm.controls).forEach(key => {
        if (key !== 'optionsArray') {
          this.questionForm.get(key)?.markAsTouched();
        }
      });
      // Mark all option controls as touched
      const optionsArray = this.questionForm.get('optionsArray') as FormArray;
      optionsArray.controls.forEach(control => {
        control.markAsTouched();
      });
      this.toasterService.showWarning('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    const formValue = this.questionForm.value;

    try {
      // Convert options array to JSON string for MultipleChoice
      let optionsJson: string | null = null;
      if (formValue.questionType === QuestionType.MultipleChoice) {
        const optionsArray = this.questionForm.get('optionsArray') as FormArray;
        const options = optionsArray.controls
          .map(control => control.value)
          .filter(value => value && value.trim() !== '');
        
        if (options.length === 0) {
          this.toasterService.showWarning('يجب إضافة خيار واحد على الأقل لنوع السؤال متعدد الخيارات');
          return;
        }
        
        optionsJson = JSON.stringify(options);
      }
      
      if (this.editingQuestion) {
        const updateDto: UpdateQuestionDto = {
          id: this.editingQuestion.id,
          text: formValue.text,
          questionType: Number(formValue.questionType), // Ensure it's a number, not string
          categoryId: Number(formValue.categoryId), // Ensure it's a number
          order: Number(formValue.order), // Ensure it's a number
          isRequired: Boolean(formValue.isRequired),
          options: optionsJson
        };
        
        this.questionService.updateQuestion(updateDto).subscribe({
          next: (updatedQuestion) => {
            this.toasterService.showSuccess('تم تحديث السؤال بنجاح');
            this.closeModal();
            this.loadQuestions(); // Reload data from backend
          },
          error: (error) => {
            this.toasterService.showError(error.message || 'حدث خطأ أثناء تحديث السؤال');
          }
        });
      } else {
        const addDto: AddQuestionDto = {
          text: formValue.text,
          questionType: Number(formValue.questionType), // Ensure it's a number, not string
          categoryId: Number(formValue.categoryId), // Ensure it's a number
          order: Number(formValue.order), // Ensure it's a number
          isRequired: Boolean(formValue.isRequired),
          options: optionsJson
        };
        
        this.questionService.createQuestion(addDto).subscribe({
          next: (newQuestion) => {
            this.toasterService.showSuccess('تم إضافة السؤال بنجاح');
            this.closeModal();
            this.loadQuestions(); // Reload data from backend
          },
          error: (error) => {
            this.toasterService.showError(error.message || 'حدث خطأ أثناء إضافة السؤال');
          }
        });
      }
    } catch (error: any) {
      console.error('Error saving question:', error);
      this.toasterService.showError('حدث خطأ أثناء حفظ السؤال');
    }
  }

  closeModal(): void {
    this.showModal = false;
    this.editingQuestion = null;
    const optionsArray = this.questionForm.get('optionsArray') as FormArray;
    while (optionsArray.length !== 0) {
      optionsArray.removeAt(0);
    }
    this.questionForm.reset();
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.questionForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  toggleQuestionActivity(question: QuestionDto, event: Event): void {
    event.stopPropagation();
    
    if (this.togglingQuestions.has(question.id)) {
      return; // Already toggling
    }

    this.togglingQuestions.add(question.id);
    
    this.questionService.toggleQuestionActivity(question.id).subscribe({
      next: (updatedQuestion) => {
        this.toasterService.showSuccess(`تم ${updatedQuestion.isActive ? 'تفعيل' : 'إلغاء تفعيل'} السؤال بنجاح`);
        this.togglingQuestions.delete(question.id);
        // Update the question in the list
        const index = this.questions.findIndex(q => q.id === question.id);
        if (index !== -1) {
          this.questions[index] = updatedQuestion;
        }
        this.loadQuestions(); // Reload to get fresh data
      },
      error: (error) => {
        console.error('Error toggling question activity:', error);
        this.toasterService.showError(error.message || 'حدث خطأ أثناء تغيير حالة السؤال');
        this.togglingQuestions.delete(question.id);
      }
    });
  }

  isToggling(questionId: number): boolean {
    return this.togglingQuestions.has(questionId);
  }

  getQuestionTypeLabel(type: QuestionType): string {
    return getQuestionTypeLabel(type);
  }

  isMultipleChoiceType(): boolean {
    return this.questionForm.get('questionType')?.value === QuestionType.MultipleChoice;
  }

  onQuestionTypeChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    const selectedType = Number(selectElement.value);
    // Update the form control value first
    this.questionForm.patchValue({ questionType: selectedType }, { emitEvent: false });
    // Then handle the change
    this.handleQuestionTypeChange(selectedType);
  }

  private handleQuestionTypeChange(type: number): void {
    const optionsArray = this.questionForm.get('optionsArray') as FormArray;
    
    if (type === QuestionType.MultipleChoice) {
      // If no options exist, add one empty option
      if (optionsArray.length === 0) {
        this.addOption();
        // Manually trigger change detection to update the view
        this.cdr.detectChanges();
      }
      // Set validators for each option
      optionsArray.controls.forEach(control => {
        control.setValidators([Validators.required]);
        control.updateValueAndValidity();
      });
    } else {
      // Clear all options when not MultipleChoice
      while (optionsArray.length !== 0) {
        optionsArray.removeAt(0);
      }
    }
  }

  getOptionControl(index: number): FormControl {
    return this.optionsArray.at(index) as FormControl;
  }

  getCategoryName(categoryId: number): string {
    const category = this.categories.find(c => c.id === categoryId);
    return category ? category.name : 'غير محدد';
  }
}
