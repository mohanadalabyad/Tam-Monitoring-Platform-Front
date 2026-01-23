import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CategoryService } from '../../../services/category.service';
import { QuestionService } from '../../../services/question.service';
import { CityService } from '../../../services/city.service';
import { ToasterService } from '../../../services/toaster.service';
import { PermissionCheckService } from '../../../services/permission-check.service';
import { ConfirmationDialogService } from '../../../services/confirmation-dialog.service';
import { CategoryDto, AddCategoryDto, UpdateCategoryDto } from '../../../models/category.model';
import { QuestionDto, QuestionFilter, QuestionType, getQuestionTypeLabel } from '../../../models/question.model';
import { CityDto } from '../../../models/city.model';
import { TableColumn, TableAction } from '../../../components/unified-table/unified-table.component';
import { ViewMode } from '../../../components/view-toggle/view-toggle.component';
import { Pencil, Trash2, FolderPlus, Power, PowerOff, FileText } from 'lucide-angular';

@Component({
  selector: 'app-categories-management',
  templateUrl: './categories-management.component.html',
  styleUrls: ['./categories-management.component.scss']
})
export class CategoriesManagementComponent implements OnInit {
  categories: CategoryDto[] = [];
  loading = false;
  showModal = false;
  modalTitle = '';
  categoryForm!: FormGroup;
  editingCategory: CategoryDto | null = null;
  viewMode: ViewMode = 'table';
  togglingCategories: Set<number> = new Set();

  // Questions document view properties
  showQuestionsDocument = false;
  selectedCategoryForQuestions: CategoryDto | null = null;
  categoryQuestions: QuestionDto[] = [];
  loadingQuestions = false;
  cities: CityDto[] = [];
  documentForm!: FormGroup;

  columns: TableColumn[] = [
    { key: 'name', label: 'الاسم', sortable: true, filterable: false },
    { key: 'description', label: 'الوصف', sortable: false, filterable: false },
    { 
      key: 'isActive', 
      label: 'الحالة', 
      sortable: true, 
      filterable: false,
      type: 'toggle',
      toggleAction: (this.permissionService.hasPermission('Category', 'ToggleActivity') || this.permissionService.isSuperAdmin()) 
        ? (row, event) => this.toggleCategoryActivity(row, event)
        : undefined,
      isToggling: (row) => this.isToggling(row.id)
    }
  ];

  actions: TableAction[] = [];
  
  // Lucide icons
  Pencil = Pencil;
  Trash2 = Trash2;
  FolderPlus = FolderPlus;
  Power = Power;
  PowerOff = PowerOff;
  FileText = FileText;

  constructor(
    private categoryService: CategoryService,
    private questionService: QuestionService,
    private cityService: CityService,
    private toasterService: ToasterService,
    public permissionService: PermissionCheckService,
    private confirmationService: ConfirmationDialogService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    // Load view preference
    const savedView = localStorage.getItem('categories-view-mode');
    if (savedView === 'table' || savedView === 'cards') {
      this.viewMode = savedView;
    }
    this.initForm();
    this.loadCategories();
    // Setup actions after a brief delay to ensure user data is loaded
    setTimeout(() => {
      this.setupActions();
    }, 0);
  }

  onViewChange(view: ViewMode): void {
    this.viewMode = view;
    localStorage.setItem('categories-view-mode', view);
  }

  initForm(): void {
    this.categoryForm = this.fb.group({
      name: ['', Validators.required],
      description: ['']
    });
  }

  setupActions(): void {
    this.actions = [];
    
    if (this.permissionService.hasPermission('Question', 'Read') || this.permissionService.isSuperAdmin()) {
      this.actions.push({
        label: 'عرض الأسئلة',
        icon: FileText,
        action: (row) => this.viewCategoryQuestions(row),
        class: 'btn-view-questions',
        variant: 'info',
        showLabel: false
      });
    }
    
    if (this.permissionService.hasPermission('Category', 'Update') || this.permissionService.isSuperAdmin()) {
      this.actions.push({
        label: 'تعديل',
        icon: Pencil,
        action: (row) => this.editCategory(row),
        class: 'btn-edit',
        variant: 'warning',
        showLabel: false
      });
    }
    
    if (this.permissionService.hasPermission('Category', 'Delete') || this.permissionService.isSuperAdmin()) {
      this.actions.push({
        label: 'حذف',
        icon: Trash2,
        action: (row) => this.deleteCategory(row),
        class: 'btn-delete',
        variant: 'danger',
        showLabel: false
      });
    }
  }

  loadCategories(): void {
    this.loading = true;
    // Main management page: get ALL categories (active and inactive) - pass undefined for isActive
    this.categoryService.getAllCategories(undefined).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.categories = Array.isArray(response.data) ? response.data : response.data.items || [];
        } else {
          this.toasterService.showError(response.message || 'حدث خطأ أثناء تحميل الفئات');
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        this.loading = false;
        this.toasterService.showError('حدث خطأ أثناء تحميل الفئات');
      }
    });
  }

  openAddModal(): void {
    this.modalTitle = 'إضافة فئة جديدة';
    this.editingCategory = null;
    this.categoryForm.reset({ name: '', description: '' });
    this.showModal = true;
  }

  editCategory(category: CategoryDto): void {
    this.modalTitle = 'تعديل فئة';
    this.editingCategory = category;
    this.categoryForm.patchValue({
      name: category.name,
      description: category.description || ''
    });
    this.showModal = true;
  }

  deleteCategory(category: CategoryDto): void {
    this.confirmationService.show({
      title: 'تأكيد الحذف',
      message: `هل أنت متأكد من حذف الفئة "${category.name}"؟`,
      confirmText: 'حذف',
      cancelText: 'إلغاء',
      type: 'danger'
    }).then(confirmed => {
      if (confirmed) {
        this.categoryService.deleteCategory(category.id).subscribe({
          next: () => {
            this.categories = this.categories.filter(c => c.id !== category.id);
            this.toasterService.showSuccess('تم حذف الفئة بنجاح');
          },
          error: (error) => {
            console.error('Error deleting category:', error);
            this.toasterService.showError(error.message || 'حدث خطأ أثناء حذف الفئة');
          }
        });
      }
    });
  }

  saveCategory(): void {
    if (this.categoryForm.valid) {
      const formValue = this.categoryForm.value;
      
      if (this.editingCategory) {
        const updateDto: UpdateCategoryDto = {
          id: this.editingCategory.id,
          name: formValue.name,
          description: formValue.description
        };
        
        this.categoryService.updateCategory(updateDto).subscribe({
          next: (updatedCategory) => {
            this.toasterService.showSuccess('تم تحديث الفئة بنجاح');
            this.closeModal();
            this.loadCategories(); // Reload data from backend
          },
          error: (error) => {
            this.toasterService.showError(error.message || 'حدث خطأ أثناء تحديث الفئة');
          }
        });
      } else {
        const addDto: AddCategoryDto = {
          name: formValue.name,
          description: formValue.description
        };
        
        this.categoryService.createCategory(addDto).subscribe({
          next: (newCategory) => {
            this.toasterService.showSuccess('تم إضافة الفئة بنجاح');
            this.closeModal();
            this.loadCategories(); // Reload data from backend
          },
          error: (error) => {
            this.toasterService.showError(error.message || 'حدث خطأ أثناء إضافة الفئة');
          }
        });
      }
    } else {
      Object.keys(this.categoryForm.controls).forEach(key => {
        this.categoryForm.get(key)?.markAsTouched();
      });
      this.toasterService.showWarning('يرجى ملء جميع الحقول المطلوبة');
    }
  }

  closeModal(): void {
    this.showModal = false;
    this.editingCategory = null;
    this.categoryForm.reset();
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.categoryForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  toggleCategoryActivity(category: CategoryDto, event: Event): void {
    event.stopPropagation();
    
    if (this.togglingCategories.has(category.id)) {
      return; // Already toggling
    }

    this.togglingCategories.add(category.id);
    
    this.categoryService.toggleCategoryActivity(category.id).subscribe({
      next: (updatedCategory) => {
        this.toasterService.showSuccess(`تم ${updatedCategory.isActive ? 'تفعيل' : 'إلغاء تفعيل'} الفئة بنجاح`);
        this.togglingCategories.delete(category.id);
        // Update the category in the list
        const index = this.categories.findIndex(c => c.id === category.id);
        if (index !== -1) {
          this.categories[index] = updatedCategory;
        }
        this.loadCategories(); // Reload to get fresh data
      },
      error: (error) => {
        console.error('Error toggling category activity:', error);
        this.toasterService.showError(error.message || 'حدث خطأ أثناء تغيير حالة الفئة');
        this.togglingCategories.delete(category.id);
      }
    });
  }

  isToggling(categoryId: number): boolean {
    return this.togglingCategories.has(categoryId);
  }

  /**
   * View questions for a category in document format
   */
  viewCategoryQuestions(category: CategoryDto): void {
    this.selectedCategoryForQuestions = category;
    this.showQuestionsDocument = true;
    this.loadingQuestions = true;
    this.categoryQuestions = [];
    
    // Initialize document form
    this.initDocumentForm();

    // Load questions filtered by category
    const filter: QuestionFilter = {
      categoryId: category.id,
      isActive: undefined // Get all questions (active and inactive)
    };

    this.questionService.getAllQuestionsWithFilter(filter).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const questions = Array.isArray(response.data) ? response.data : response.data.items || [];
          // Sort questions by order
          this.categoryQuestions = questions.sort((a, b) => a.order - b.order);
        } else {
          this.toasterService.showWarning(response.message || 'لا توجد أسئلة لهذه الفئة');
        }
        this.loadingQuestions = false;
      },
      error: (error) => {
        console.error('Error loading questions:', error);
        this.toasterService.showError('حدث خطأ أثناء تحميل الأسئلة');
        this.loadingQuestions = false;
      }
    });

    // Load cities for base fields display
    this.cityService.getAllCities(undefined, undefined, true).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.cities = Array.isArray(response.data) ? response.data : response.data.items || [];
        }
      },
      error: (error) => {
        console.error('Error loading cities:', error);
      }
    });
  }

  /**
   * Initialize document form for base fields
   */
  initDocumentForm(): void {
    this.documentForm = this.fb.group({
      cityId: [''],
      location: [''],
      violationDate: [''],
      description: [''],
      isWitness: [false],
      contactPreference: [''],
      email: [''],
      phone: ['']
    });
  }

  /**
   * Close questions document modal
   */
  closeQuestionsDocument(): void {
    this.showQuestionsDocument = false;
    this.selectedCategoryForQuestions = null;
    this.categoryQuestions = [];
    if (this.documentForm) {
      this.documentForm.reset();
    }
  }


  /**
   * Get question type label for display
   */
  getQuestionTypeLabel(type: number): string {
    return getQuestionTypeLabel(type);
  }

  /**
   * Get current date formatted for Arabic locale
   */
  getCurrentDate(): string {
    return new Date().toLocaleDateString('ar-SA');
  }

  /**
   * Get current time formatted for Arabic locale
   */
  getCurrentTime(): string {
    return new Date().toLocaleTimeString('ar-SA');
  }

  /**
   * Get QuestionType enum for template use
   */
  get QuestionType() {
    return QuestionType;
  }

  /**
   * Parse options JSON string for MultipleChoice type
   */
  getQuestionOptions(question: QuestionDto): string[] {
    if (question.questionType === QuestionType.MultipleChoice && question.options) {
      try {
        const parsed = JSON.parse(question.options);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        console.error('Error parsing options JSON:', e);
        return [];
      }
    }
    return [];
  }
}
