import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CategoryService } from '../../../services/category.service';
import { Category } from '../../../models/category.model';
import { ToasterService } from '../../../services/toaster.service';

@Component({
  selector: 'app-categories-management',
  templateUrl: './categories-management.component.html',
  styleUrls: ['./categories-management.component.scss']
})
export class CategoriesManagementComponent implements OnInit {
  categories: Category[] = [];
  loading = false;
  isModalOpen = false;
  categoryForm!: FormGroup;
  editMode = false;
  currentCategoryId: string | null = null;

  constructor(
    private categoryService: CategoryService,
    private fb: FormBuilder,
    private toaster: ToasterService
  ) { }

  ngOnInit(): void {
    this.loadCategories();
    this.initForm();
  }

  loadCategories(): void {
    this.loading = true;
    this.categoryService.getCategories().subscribe({
      next: (data) => {
        this.categories = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        this.toaster.showError('فشل تحميل الفئات.', 'خطأ');
        this.loading = false;
      }
    });
  }

  availableIcons = [
    { value: 'book', label: 'كتاب', svg: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
    { value: 'users', label: 'مستخدمون', svg: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
    { value: 'leaf', label: 'ورقة', svg: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z' },
    { value: 'user', label: 'مستخدم', svg: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
    { value: 'home', label: 'منزل', svg: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { value: 'shield', label: 'درع', svg: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
    { value: 'document', label: 'مستند', svg: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { value: 'chart', label: 'رسم بياني', svg: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    { value: 'settings', label: 'إعدادات', svg: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
    { value: 'bell', label: 'جرس', svg: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
    { value: 'heart', label: 'قلب', svg: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' },
    { value: 'star', label: 'نجمة', svg: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z' }
  ];

  initForm(): void {
    this.categoryForm = this.fb.group({
      nameAr: ['', Validators.required],
      description: [''],
      icon: [''],
      order: [1, [Validators.required, Validators.min(1)]]
    });
  }

  openAddModal(): void {
    this.editMode = false;
    this.currentCategoryId = null;
    this.initForm();
    this.isModalOpen = true;
  }

  editCategory(category: Category): void {
    this.editMode = true;
    this.currentCategoryId = category.id;
    this.categoryForm.patchValue({
      nameAr: category.nameAr,
      description: category.description || '',
      icon: category.icon || '',
      order: category.order
    });
    this.isModalOpen = true;
  }

  deleteCategory(category: Category): void {
    if (confirm(`هل أنت متأكد أنك تريد حذف الفئة "${category.nameAr}"؟`)) {
      this.categoryService.deleteCategory(category.id).subscribe({
        next: () => {
          this.toaster.showSuccess('تم حذف الفئة بنجاح.', 'نجاح');
          this.loadCategories();
        },
        error: (error) => {
          console.error('Error deleting category:', error);
          this.toaster.showError('فشل حذف الفئة.', 'خطأ');
        }
      });
    }
  }

  onModalSubmit(): void {
    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      this.toaster.showError('يرجى ملء جميع الحقول المطلوبة.', 'خطأ في الإدخال');
      return;
    }

    const formValue = this.categoryForm.value;

    if (this.editMode && this.currentCategoryId) {
      this.categoryService.updateCategory(this.currentCategoryId, formValue).subscribe({
        next: () => {
          this.toaster.showSuccess('تم تحديث الفئة بنجاح.', 'نجاح');
          this.closeModal();
          this.loadCategories();
        },
        error: (error) => {
          console.error('Error updating category:', error);
          this.toaster.showError('فشل تحديث الفئة.', 'خطأ');
        }
      });
    } else {
      this.categoryService.createCategory(formValue).subscribe({
        next: () => {
          this.toaster.showSuccess('تم إضافة فئة جديدة بنجاح.', 'نجاح');
          this.closeModal();
          this.loadCategories();
        },
        error: (error) => {
          console.error('Error creating category:', error);
          this.toaster.showError('فشل إضافة فئة جديدة.', 'خطأ');
        }
      });
    }
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.categoryForm.reset();
    this.editMode = false;
    this.currentCategoryId = null;
  }

  getIconSvg(iconValue: string): string {
    const icon = this.availableIcons.find(i => i.value === iconValue);
    return icon ? icon.svg : '';
  }
}
