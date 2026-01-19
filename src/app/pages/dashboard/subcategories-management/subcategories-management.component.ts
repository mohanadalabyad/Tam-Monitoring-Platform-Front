import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SubCategoryService } from '../../../services/subcategory.service';
import { CategoryService } from '../../../services/category.service';
import { SubCategory } from '../../../models/subcategory.model';
import { Category } from '../../../models/category.model';
import { ToasterService } from '../../../services/toaster.service';

@Component({
  selector: 'app-subcategories-management',
  templateUrl: './subcategories-management.component.html',
  styleUrls: ['./subcategories-management.component.scss']
})
export class SubCategoriesManagementComponent implements OnInit {
  subCategories: SubCategory[] = [];
  categories: Category[] = [];
  filteredSubCategories: SubCategory[] = [];
  loading = false;
  isModalOpen = false;
  subCategoryForm!: FormGroup;
  editMode = false;
  currentSubCategoryId: string | null = null;
  selectedCategoryId: string = '';

  constructor(
    private subCategoryService: SubCategoryService,
    private categoryService: CategoryService,
    private fb: FormBuilder,
    private toaster: ToasterService
  ) { }

  ngOnInit(): void {
    this.loadCategories();
    this.loadSubCategories();
    this.initForm();
  }

  loadCategories(): void {
    this.categoryService.getCategories().subscribe({
      next: (data) => {
        this.categories = data;
      },
      error: (error) => {
        console.error('Error loading categories:', error);
      }
    });
  }

  loadSubCategories(): void {
    this.loading = true;
    this.subCategoryService.getSubCategories().subscribe({
      next: (data) => {
        this.subCategories = data;
        this.filterSubCategories();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading sub-categories:', error);
        this.toaster.showError('فشل تحميل الفئات الفرعية.', 'خطأ');
        this.loading = false;
      }
    });
  }

  filterSubCategories(): void {
    if (this.selectedCategoryId) {
      this.filteredSubCategories = this.subCategories.filter(
        sub => sub.categoryId === this.selectedCategoryId
      ).sort((a, b) => a.order - b.order);
    } else {
      this.filteredSubCategories = [...this.subCategories].sort((a, b) => a.order - b.order);
    }
  }

  onCategoryFilterChange(): void {
    this.filterSubCategories();
  }

  initForm(): void {
    this.subCategoryForm = this.fb.group({
      categoryId: ['', Validators.required],
      nameAr: ['', Validators.required],
      description: [''],
      order: [1, [Validators.required, Validators.min(1)]]
    });
  }

  openAddModal(): void {
    this.editMode = false;
    this.currentSubCategoryId = null;
    this.initForm();
    if (this.selectedCategoryId) {
      this.subCategoryForm.patchValue({ categoryId: this.selectedCategoryId });
    }
    this.isModalOpen = true;
  }

  editSubCategory(subCategory: SubCategory): void {
    this.editMode = true;
    this.currentSubCategoryId = subCategory.id;
    this.subCategoryForm.patchValue({
      categoryId: subCategory.categoryId,
      nameAr: subCategory.nameAr,
      description: subCategory.description || '',
      order: subCategory.order
    });
    this.isModalOpen = true;
  }

  deleteSubCategory(subCategory: SubCategory): void {
    if (confirm(`هل أنت متأكد أنك تريد حذف الفئة الفرعية "${subCategory.nameAr}"؟`)) {
      this.subCategoryService.deleteSubCategory(subCategory.id).subscribe({
        next: () => {
          this.toaster.showSuccess('تم حذف الفئة الفرعية بنجاح.', 'نجاح');
          this.loadSubCategories();
        },
        error: (error) => {
          console.error('Error deleting sub-category:', error);
          this.toaster.showError('فشل حذف الفئة الفرعية.', 'خطأ');
        }
      });
    }
  }

  onModalSubmit(): void {
    if (this.subCategoryForm.invalid) {
      this.subCategoryForm.markAllAsTouched();
      this.toaster.showError('يرجى ملء جميع الحقول المطلوبة.', 'خطأ في الإدخال');
      return;
    }

    const formValue = this.subCategoryForm.value;

    if (this.editMode && this.currentSubCategoryId) {
      this.subCategoryService.updateSubCategory(this.currentSubCategoryId, formValue).subscribe({
        next: () => {
          this.toaster.showSuccess('تم تحديث الفئة الفرعية بنجاح.', 'نجاح');
          this.closeModal();
          this.loadSubCategories();
        },
        error: (error) => {
          console.error('Error updating sub-category:', error);
          this.toaster.showError('فشل تحديث الفئة الفرعية.', 'خطأ');
        }
      });
    } else {
      this.subCategoryService.createSubCategory(formValue).subscribe({
        next: () => {
          this.toaster.showSuccess('تم إضافة فئة فرعية جديدة بنجاح.', 'نجاح');
          this.closeModal();
          this.loadSubCategories();
        },
        error: (error) => {
          console.error('Error creating sub-category:', error);
          this.toaster.showError('فشل إضافة فئة فرعية جديدة.', 'خطأ');
        }
      });
    }
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.subCategoryForm.reset();
    this.editMode = false;
    this.currentSubCategoryId = null;
  }

  getCategoryName(categoryId: string): string {
    const category = this.categories.find(c => c.id === categoryId);
    return category ? category.nameAr : categoryId;
  }
}
