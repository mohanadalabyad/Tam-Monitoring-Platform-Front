import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PerpetratorTypeService } from '../../../services/perpetrator-type.service';
import { CategoryService } from '../../../services/category.service';
import { ToasterService } from '../../../services/toaster.service';
import { PermissionCheckService } from '../../../services/permission-check.service';
import { ConfirmationDialogService } from '../../../services/confirmation-dialog.service';
import {
  PerpetratorTypeDto,
  AddPerpetratorTypeDto,
  UpdatePerpetratorTypeDto
} from '../../../models/perpetrator-type.model';
import { CategoryDto } from '../../../models/category.model';
import { TableColumn, TableAction } from '../../../components/unified-table/unified-table.component';
import { ViewMode } from '../../../components/view-toggle/view-toggle.component';
import { Pencil, Trash2, UserX, Power, PowerOff } from 'lucide-angular';

@Component({
  selector: 'app-perpetrator-types-management',
  templateUrl: './perpetrator-types-management.component.html',
  styleUrls: ['./perpetrator-types-management.component.scss']
})
export class PerpetratorTypesManagementComponent implements OnInit {
  perpetratorTypes: PerpetratorTypeDto[] = [];
  categories: CategoryDto[] = [];
  loading = false;
  showModal = false;
  modalTitle = '';
  form!: FormGroup;
  editingItem: PerpetratorTypeDto | null = null;
  viewMode: ViewMode = 'table';
  togglingIds: Set<number> = new Set();

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
      toggleAction:
        this.permissionService.hasPermission('PerpetratorType', 'ToggleActivity') ||
        this.permissionService.isSuperAdmin()
          ? (row, event) => this.toggleActivity(row, event)
          : undefined,
      isToggling: (row) => this.isToggling(row.id)
    }
  ];

  actions: TableAction[] = [];

  Pencil = Pencil;
  Trash2 = Trash2;
  UserX = UserX;
  Power = Power;
  PowerOff = PowerOff;

  constructor(
    private perpetratorTypeService: PerpetratorTypeService,
    private categoryService: CategoryService,
    private toasterService: ToasterService,
    public permissionService: PermissionCheckService,
    private confirmationService: ConfirmationDialogService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    const savedView = localStorage.getItem('perpetrator-types-view-mode');
    if (savedView === 'table' || savedView === 'cards') {
      this.viewMode = savedView;
    }
    this.initForm();
    this.loadCategories();
    this.loadPerpetratorTypes();
    setTimeout(() => this.setupActions(), 0);
  }

  onViewChange(view: ViewMode): void {
    this.viewMode = view;
    localStorage.setItem('perpetrator-types-view-mode', view);
  }

  initForm(): void {
    this.form = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      categoryId: ['', Validators.required]
    });
  }

  setupActions(): void {
    this.actions = [];
    if (
      this.permissionService.hasPermission('PerpetratorType', 'Update') ||
      this.permissionService.isSuperAdmin()
    ) {
      this.actions.push({
        label: 'تعديل',
        icon: Pencil,
        action: (row) => this.edit(row),
        class: 'btn-edit',
        variant: 'warning',
        showLabel: false
      });
    }
    if (
      this.permissionService.hasPermission('PerpetratorType', 'Delete') ||
      this.permissionService.isSuperAdmin()
    ) {
      this.actions.push({
        label: 'حذف',
        icon: Trash2,
        action: (row) => this.delete(row),
        class: 'btn-delete',
        variant: 'danger',
        showLabel: false
      });
    }
  }

  loadCategories(): void {
    this.categoryService.getAllCategories(true).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.categories = Array.isArray(response.data) ? response.data : response.data.items || [];
        }
      },
      error: (err) => console.error('Error loading categories:', err)
    });
  }

  loadPerpetratorTypes(): void {
    this.loading = true;
    // Use POST /filter to avoid 405 when backend does not allow GET on list endpoint
    this.perpetratorTypeService.getAllPerpetratorTypesWithFilter({}).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.perpetratorTypes = Array.isArray(response.data)
            ? response.data
            : response.data.items || [];
        } else {
          this.toasterService.showError(response.message || 'حدث خطأ أثناء تحميل البيانات');
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading perpetrator types:', err);
        this.loading = false;
        this.toasterService.showError('حدث خطأ أثناء تحميل البيانات');
      }
    });
  }

  openAddModal(): void {
    this.modalTitle = 'إضافة نوع مرتكب الانتهاك';
    this.editingItem = null;
    this.form.reset({ name: '', description: '', categoryId: '' });
    this.showModal = true;
  }

  edit(item: PerpetratorTypeDto): void {
    this.modalTitle = 'تعديل نوع مرتكب الانتهاك';
    this.editingItem = item;
    this.form.patchValue({
      name: item.name,
      description: item.description || '',
      categoryId: item.categoryId
    });
    this.showModal = true;
  }

  delete(item: PerpetratorTypeDto): void {
    this.confirmationService
      .show({
        title: 'تأكيد الحذف',
        message: `هل أنت متأكد من حذف "${item.name}"؟`,
        confirmText: 'حذف',
        cancelText: 'إلغاء',
        type: 'danger'
      })
      .then((confirmed) => {
        if (confirmed) {
          this.perpetratorTypeService.delete(item.id).subscribe({
            next: () => {
              this.perpetratorTypes = this.perpetratorTypes.filter((p) => p.id !== item.id);
              this.toasterService.showSuccess('تم الحذف بنجاح');
            },
            error: (error: unknown) => {
              const err = error as { error?: { message?: string }; message?: string };
              this.toasterService.showError(err?.error?.message || err?.message || 'حدث خطأ أثناء الحذف');
            }
          });
        }
      });
  }

  save(): void {
    if (!this.form.valid) {
      Object.keys(this.form.controls).forEach((k) => this.form.get(k)?.markAsTouched());
      this.toasterService.showWarning('يرجى ملء جميع الحقول المطلوبة');
      return;
    }
    const v = this.form.value;
    if (this.editingItem) {
      const dto: UpdatePerpetratorTypeDto = {
        id: this.editingItem.id,
        name: v.name,
        description: v.description,
        categoryId: v.categoryId
      };
      this.perpetratorTypeService.update(dto).subscribe({
        next: () => {
          this.toasterService.showSuccess('تم التحديث بنجاح');
          this.closeModal();
          this.loadPerpetratorTypes();
        },
        error: (error: unknown) => {
          const err = error as { error?: { message?: string }; message?: string };
          this.toasterService.showError(err?.error?.message || err?.message || 'حدث خطأ');
        }
      });
    } else {
      const dto: AddPerpetratorTypeDto = {
        name: v.name,
        description: v.description,
        categoryId: v.categoryId
      };
      this.perpetratorTypeService.create(dto).subscribe({
        next: () => {
          this.toasterService.showSuccess('تم الإضافة بنجاح');
          this.closeModal();
          this.loadPerpetratorTypes();
        },
        error: (error: unknown) => {
          const err = error as { error?: { message?: string }; message?: string };
          this.toasterService.showError(err?.error?.message || err?.message || 'حدث خطأ');
        }
      });
    }
  }

  closeModal(): void {
    this.showModal = false;
    this.editingItem = null;
    this.form.reset();
  }

  isFieldInvalid(fieldName: string): boolean {
    const c = this.form.get(fieldName);
    return !!(c && c.invalid && (c.dirty || c.touched));
  }

  toggleActivity(item: PerpetratorTypeDto, event: Event): void {
    event.stopPropagation();
    if (this.togglingIds.has(item.id)) return;
    this.togglingIds.add(item.id);
    this.perpetratorTypeService.toggleActivity(item.id).subscribe({
      next: (updated: PerpetratorTypeDto) => {
        this.toasterService.showSuccess(
          updated.isActive ? 'تم التفعيل بنجاح' : 'تم إلغاء التفعيل بنجاح'
        );
        this.togglingIds.delete(item.id);
        const idx = this.perpetratorTypes.findIndex((p) => p.id === item.id);
        if (idx !== -1) this.perpetratorTypes[idx] = updated;
        this.loadPerpetratorTypes();
      },
      error: (error: unknown) => {
        const err = error as { error?: { message?: string }; message?: string };
        this.toasterService.showError(err?.error?.message || err?.message || 'حدث خطأ');
        this.togglingIds.delete(item.id);
      }
    });
  }

  isToggling(id: number): boolean {
    return this.togglingIds.has(id);
  }

  getCategoryName(categoryId: number): string {
    const c = this.categories.find((x) => x.id === categoryId);
    return c ? c.name : String(categoryId);
  }
}
