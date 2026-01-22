import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CategoryService } from '../../../services/category.service';
import { ToasterService } from '../../../services/toaster.service';
import { PermissionCheckService } from '../../../services/permission-check.service';
import { ConfirmationDialogService } from '../../../services/confirmation-dialog.service';
import { CategoryDto, AddCategoryDto, UpdateCategoryDto } from '../../../models/category.model';
import { TableColumn, TableAction } from '../../../components/unified-table/unified-table.component';
import { ViewMode } from '../../../components/view-toggle/view-toggle.component';
import { Pencil, Trash2, FolderPlus, Power, PowerOff } from 'lucide-angular';

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

  constructor(
    private categoryService: CategoryService,
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
    this.setupActions();
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
}
