import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SubCategoryService } from '../../../services/subcategory.service';
import { CategoryService } from '../../../services/category.service';
import { ToasterService } from '../../../services/toaster.service';
import { PermissionCheckService } from '../../../services/permission-check.service';
import { ConfirmationDialogService } from '../../../services/confirmation-dialog.service';
import { SubCategoryDto, AddSubCategoryDto, UpdateSubCategoryDto } from '../../../models/subcategory.model';
import { CategoryDto } from '../../../models/category.model';
import { TableColumn, TableAction } from '../../../components/unified-table/unified-table.component';
import { ViewMode } from '../../../components/view-toggle/view-toggle.component';
import { Pencil, Trash2, FolderTree, Power, PowerOff } from 'lucide-angular';

@Component({
  selector: 'app-subcategories-management',
  templateUrl: './subcategories-management.component.html',
  styleUrls: ['./subcategories-management.component.scss']
})
export class SubCategoriesManagementComponent implements OnInit {
  subCategories: SubCategoryDto[] = [];
  categories: CategoryDto[] = [];
  loading = false;
  showModal = false;
  modalTitle = '';
  subCategoryForm!: FormGroup;
  editingSubCategory: SubCategoryDto | null = null;
  viewMode: ViewMode = 'table';
  togglingSubCategories: Set<number> = new Set();

  columns: TableColumn[] = [
    { key: 'name', label: 'الاسم', sortable: true, filterable: false },
    { key: 'categoryName', label: 'الفئة', sortable: false, filterable: false },
    { key: 'description', label: 'الوصف', sortable: false, filterable: false },
    { 
      key: 'isActive', 
      label: 'الحالة', 
      sortable: true, 
      filterable: false,
      type: 'toggle',
      toggleAction: (this.permissionService.hasPermission('SubCategory', 'ToggleActivity') || this.permissionService.isSuperAdmin()) 
        ? (row, event) => this.toggleSubCategoryActivity(row, event)
        : undefined,
      isToggling: (row) => this.isToggling(row.id)
    }
  ];

  actions: TableAction[] = [];
  
  // Lucide icons
  Pencil = Pencil;
  Trash2 = Trash2;
  FolderTree = FolderTree;
  Power = Power;
  PowerOff = PowerOff;

  constructor(
    private subCategoryService: SubCategoryService,
    private categoryService: CategoryService,
    private toasterService: ToasterService,
    public permissionService: PermissionCheckService,
    private confirmationService: ConfirmationDialogService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    // Load view preference
    const savedView = localStorage.getItem('subcategories-view-mode');
    if (savedView === 'table' || savedView === 'cards') {
      this.viewMode = savedView;
    }
    this.initForm();
    this.loadCategories();
    this.loadSubCategories();
    this.setupActions();
  }

  onViewChange(view: ViewMode): void {
    this.viewMode = view;
    localStorage.setItem('subcategories-view-mode', view);
  }

  initForm(): void {
    this.subCategoryForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      categoryId: ['', Validators.required]
    });
  }

  setupActions(): void {
    this.actions = [];
    
    if (this.permissionService.hasPermission('SubCategory', 'Update') || this.permissionService.isSuperAdmin()) {
      this.actions.push({
        label: 'تعديل',
        icon: Pencil,
        action: (row) => this.editSubCategory(row),
        class: 'btn-edit',
        variant: 'warning',
        showLabel: false
      });
    }
    
    if (this.permissionService.hasPermission('SubCategory', 'Delete') || this.permissionService.isSuperAdmin()) {
      this.actions.push({
        label: 'حذف',
        icon: Trash2,
        action: (row) => this.deleteSubCategory(row),
        class: 'btn-delete',
        variant: 'danger',
        showLabel: false
      });
    }
  }

  loadCategories(): void {
    // Load only active categories for dropdown
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

  loadSubCategories(): void {
    this.loading = true;
    // Main management page: get ALL subcategories (active and inactive) - pass undefined for isActive
    this.subCategoryService.getAllSubCategories(undefined).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.subCategories = Array.isArray(response.data) ? response.data : response.data.items || [];
        } else {
          this.toasterService.showError(response.message || 'حدث خطأ أثناء تحميل الفئات الفرعية');
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading subcategories:', error);
        this.loading = false;
        this.toasterService.showError('حدث خطأ أثناء تحميل الفئات الفرعية');
      }
    });
  }

  openAddModal(): void {
    this.modalTitle = 'إضافة فئة فرعية جديدة';
    this.editingSubCategory = null;
    this.subCategoryForm.reset({ name: '', description: '', categoryId: '' });
    this.showModal = true;
  }

  editSubCategory(subCategory: SubCategoryDto): void {
    this.modalTitle = 'تعديل فئة فرعية';
    this.editingSubCategory = subCategory;
    this.subCategoryForm.patchValue({
      name: subCategory.name,
      description: subCategory.description || '',
      categoryId: subCategory.categoryId
    });
    this.showModal = true;
  }

  deleteSubCategory(subCategory: SubCategoryDto): void {
    this.confirmationService.show({
      title: 'تأكيد الحذف',
      message: `هل أنت متأكد من حذف الفئة الفرعية "${subCategory.name}"؟`,
      confirmText: 'حذف',
      cancelText: 'إلغاء',
      type: 'danger'
    }).then(confirmed => {
      if (confirmed) {
        this.subCategoryService.deleteSubCategory(subCategory.id).subscribe({
          next: () => {
            this.subCategories = this.subCategories.filter(s => s.id !== subCategory.id);
            this.toasterService.showSuccess('تم حذف الفئة الفرعية بنجاح');
          },
          error: (error) => {
            console.error('Error deleting subcategory:', error);
            this.toasterService.showError(error.message || 'حدث خطأ أثناء حذف الفئة الفرعية');
          }
        });
      }
    });
  }

  saveSubCategory(): void {
    if (this.subCategoryForm.valid) {
      const formValue = this.subCategoryForm.value;
      
      if (this.editingSubCategory) {
        const updateDto: UpdateSubCategoryDto = {
          id: this.editingSubCategory.id,
          name: formValue.name,
          description: formValue.description,
          categoryId: formValue.categoryId
        };
        
        this.subCategoryService.updateSubCategory(updateDto).subscribe({
          next: (updatedSubCategory) => {
            this.toasterService.showSuccess('تم تحديث الفئة الفرعية بنجاح');
            this.closeModal();
            this.loadSubCategories(); // Reload data from backend
          },
          error: (error) => {
            this.toasterService.showError(error.message || 'حدث خطأ أثناء تحديث الفئة الفرعية');
          }
        });
      } else {
        const addDto: AddSubCategoryDto = {
          name: formValue.name,
          description: formValue.description,
          categoryId: formValue.categoryId
        };
        
        this.subCategoryService.createSubCategory(addDto).subscribe({
          next: (newSubCategory) => {
            this.toasterService.showSuccess('تم إضافة الفئة الفرعية بنجاح');
            this.closeModal();
            this.loadSubCategories(); // Reload data from backend
          },
          error: (error) => {
            this.toasterService.showError(error.message || 'حدث خطأ أثناء إضافة الفئة الفرعية');
          }
        });
      }
    } else {
      Object.keys(this.subCategoryForm.controls).forEach(key => {
        this.subCategoryForm.get(key)?.markAsTouched();
      });
      this.toasterService.showWarning('يرجى ملء جميع الحقول المطلوبة');
    }
  }

  closeModal(): void {
    this.showModal = false;
    this.editingSubCategory = null;
    this.subCategoryForm.reset();
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.subCategoryForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  toggleSubCategoryActivity(subCategory: SubCategoryDto, event: Event): void {
    event.stopPropagation();
    
    if (this.togglingSubCategories.has(subCategory.id)) {
      return; // Already toggling
    }

    this.togglingSubCategories.add(subCategory.id);
    
    this.subCategoryService.toggleSubCategoryActivity(subCategory.id).subscribe({
      next: (updatedSubCategory) => {
        this.toasterService.showSuccess(`تم ${updatedSubCategory.isActive ? 'تفعيل' : 'إلغاء تفعيل'} الفئة الفرعية بنجاح`);
        this.togglingSubCategories.delete(subCategory.id);
        // Update the subcategory in the list
        const index = this.subCategories.findIndex(s => s.id === subCategory.id);
        if (index !== -1) {
          this.subCategories[index] = updatedSubCategory;
        }
        this.loadSubCategories(); // Reload to get fresh data
      },
      error: (error) => {
        console.error('Error toggling subcategory activity:', error);
        this.toasterService.showError(error.message || 'حدث خطأ أثناء تغيير حالة الفئة الفرعية');
        this.togglingSubCategories.delete(subCategory.id);
      }
    });
  }

  isToggling(subCategoryId: number): boolean {
    return this.togglingSubCategories.has(subCategoryId);
  }

  getCategoryName(categoryId: number): string {
    const category = this.categories.find(c => c.id === categoryId);
    return category ? category.name : categoryId.toString();
  }
}

