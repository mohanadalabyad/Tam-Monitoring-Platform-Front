import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EducationLevelService } from '../../../services/education-level.service';
import { ToasterService } from '../../../services/toaster.service';
import { PermissionCheckService } from '../../../services/permission-check.service';
import { ConfirmationDialogService } from '../../../services/confirmation-dialog.service';
import { EducationLevelDto, AddEducationLevelDto, UpdateEducationLevelDto } from '../../../models/education-level.model';
import { TableColumn, TableAction } from '../../../components/unified-table/unified-table.component';
import { ViewMode } from '../../../components/view-toggle/view-toggle.component';
import { Pencil, Trash2, FolderPlus, Power, PowerOff } from 'lucide-angular';

@Component({
  selector: 'app-education-levels-management',
  templateUrl: './education-levels-management.component.html',
  styleUrls: ['./education-levels-management.component.scss']
})
export class EducationLevelsManagementComponent implements OnInit {
  educationLevels: EducationLevelDto[] = [];
  loading = false;
  showModal = false;
  modalTitle = '';
  educationLevelForm!: FormGroup;
  editingEducationLevel: EducationLevelDto | null = null;
  viewMode: ViewMode = 'table';
  togglingEducationLevels: Set<number> = new Set();

  columns: TableColumn[] = [
    { key: 'name', label: 'الاسم', sortable: true, filterable: false },
    { 
      key: 'isActive', 
      label: 'الحالة', 
      sortable: true, 
      filterable: false,
      type: 'toggle',
      toggleAction: (this.permissionService.hasPermission('EducationLevel', 'ToggleActivity') || this.permissionService.isSuperAdmin()) 
        ? (row, event) => this.toggleEducationLevelActivity(row, event)
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
    private educationLevelService: EducationLevelService,
    private toasterService: ToasterService,
    public permissionService: PermissionCheckService,
    private confirmationService: ConfirmationDialogService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    // Load view preference
    const savedView = localStorage.getItem('education-levels-view-mode');
    if (savedView === 'table' || savedView === 'cards') {
      this.viewMode = savedView;
    }
    this.initForm();
    this.loadEducationLevels();
    // Setup actions after a brief delay to ensure user data is loaded
    setTimeout(() => {
      this.setupActions();
    }, 0);
  }

  onViewChange(view: ViewMode): void {
    this.viewMode = view;
    localStorage.setItem('education-levels-view-mode', view);
  }

  initForm(): void {
    this.educationLevelForm = this.fb.group({
      name: ['', Validators.required]
    });
  }

  setupActions(): void {
    this.actions = [];
    
    if (this.permissionService.hasPermission('EducationLevel', 'Update') || this.permissionService.isSuperAdmin()) {
      this.actions.push({
        label: 'تعديل',
        icon: Pencil,
        action: (row) => this.editEducationLevel(row),
        class: 'btn-edit',
        variant: 'warning',
        showLabel: false
      });
    }
    
    if (this.permissionService.hasPermission('EducationLevel', 'Delete') || this.permissionService.isSuperAdmin()) {
      this.actions.push({
        label: 'حذف',
        icon: Trash2,
        action: (row) => this.deleteEducationLevel(row),
        class: 'btn-delete',
        variant: 'danger',
        showLabel: false
      });
    }
  }

  loadEducationLevels(): void {
    this.loading = true;
    // Main management page: get ALL education levels (active and inactive) - pass undefined for isActive
    this.educationLevelService.getAllEducationLevels(undefined).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.educationLevels = Array.isArray(response.data) ? response.data : response.data.items || [];
        } else {
          this.toasterService.showError(response.message || 'حدث خطأ أثناء تحميل المستويات التعليمية');
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading education levels:', error);
        this.loading = false;
        this.toasterService.showError('حدث خطأ أثناء تحميل المستويات التعليمية');
      }
    });
  }

  openAddModal(): void {
    if (!this.permissionService.hasPermission('EducationLevel', 'Create') && !this.permissionService.isSuperAdmin()) {
      this.toasterService.showWarning('ليس لديك صلاحية لإضافة مستوى تعليمي', 'صلاحية مرفوضة');
      return;
    }
    this.modalTitle = 'إضافة مستوى تعليمي جديد';
    this.editingEducationLevel = null;
    this.educationLevelForm.reset({ name: '' });
    this.showModal = true;
  }

  editEducationLevel(educationLevel: EducationLevelDto): void {
    if (!this.permissionService.hasPermission('EducationLevel', 'Update') && !this.permissionService.isSuperAdmin()) {
      this.toasterService.showWarning('ليس لديك صلاحية لتعديل المستويات التعليمية', 'صلاحية مرفوضة');
      return;
    }
    this.modalTitle = 'تعديل مستوى تعليمي';
    this.editingEducationLevel = educationLevel;
    this.educationLevelForm.patchValue({
      name: educationLevel.name
    });
    this.showModal = true;
  }

  deleteEducationLevel(educationLevel: EducationLevelDto): void {
    if (!this.permissionService.hasPermission('EducationLevel', 'Delete') && !this.permissionService.isSuperAdmin()) {
      this.toasterService.showWarning('ليس لديك صلاحية لحذف المستويات التعليمية', 'صلاحية مرفوضة');
      return;
    }
    this.confirmationService.show({
      title: 'تأكيد الحذف',
      message: `هل أنت متأكد من حذف المستوى التعليمي "${educationLevel.name}"؟`,
      confirmText: 'حذف',
      cancelText: 'إلغاء',
      type: 'danger'
    }).then(confirmed => {
      if (confirmed) {
        this.educationLevelService.deleteEducationLevel(educationLevel.id).subscribe({
          next: () => {
            this.educationLevels = this.educationLevels.filter(el => el.id !== educationLevel.id);
            this.toasterService.showSuccess('تم حذف المستوى التعليمي بنجاح');
          },
          error: (error) => {
            console.error('Error deleting education level:', error);
            this.toasterService.showError(error.message || 'حدث خطأ أثناء حذف المستوى التعليمي');
          }
        });
      }
    });
  }

  saveEducationLevel(): void {
    if (this.educationLevelForm.valid) {
      const formValue = this.educationLevelForm.value;
      
      if (this.editingEducationLevel) {
        const updateDto: UpdateEducationLevelDto = {
          id: this.editingEducationLevel.id,
          name: formValue.name
        };
        
        this.educationLevelService.updateEducationLevel(updateDto).subscribe({
          next: (updatedEducationLevel) => {
            this.toasterService.showSuccess('تم تحديث المستوى التعليمي بنجاح');
            this.closeModal();
            this.loadEducationLevels(); // Reload data from backend
          },
          error: (error) => {
            this.toasterService.showError(error.message || 'حدث خطأ أثناء تحديث المستوى التعليمي');
          }
        });
      } else {
        const addDto: AddEducationLevelDto = {
          name: formValue.name
        };
        
        this.educationLevelService.createEducationLevel(addDto).subscribe({
          next: (newEducationLevel) => {
            this.toasterService.showSuccess('تم إضافة المستوى التعليمي بنجاح');
            this.closeModal();
            this.loadEducationLevels(); // Reload data from backend
          },
          error: (error) => {
            this.toasterService.showError(error.message || 'حدث خطأ أثناء إضافة المستوى التعليمي');
          }
        });
      }
    } else {
      Object.keys(this.educationLevelForm.controls).forEach(key => {
        this.educationLevelForm.get(key)?.markAsTouched();
      });
      this.toasterService.showWarning('يرجى ملء جميع الحقول المطلوبة');
    }
  }

  closeModal(): void {
    this.showModal = false;
    this.editingEducationLevel = null;
    this.educationLevelForm.reset();
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.educationLevelForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  toggleEducationLevelActivity(educationLevel: EducationLevelDto, event: Event): void {
    event.stopPropagation();
    
    if (!this.permissionService.hasPermission('EducationLevel', 'ToggleActivity') && !this.permissionService.isSuperAdmin()) {
      this.toasterService.showWarning('ليس لديك صلاحية لتغيير حالة المستوى التعليمي', 'صلاحية مرفوضة');
      return;
    }
    
    if (this.togglingEducationLevels.has(educationLevel.id)) {
      return; // Already toggling
    }

    this.togglingEducationLevels.add(educationLevel.id);
    
    this.educationLevelService.toggleEducationLevelActivity(educationLevel.id).subscribe({
      next: (updatedEducationLevel) => {
        this.toasterService.showSuccess(`تم ${updatedEducationLevel.isActive ? 'تفعيل' : 'إلغاء تفعيل'} المستوى التعليمي بنجاح`);
        this.togglingEducationLevels.delete(educationLevel.id);
        // Update the education level in the list
        const index = this.educationLevels.findIndex(el => el.id === educationLevel.id);
        if (index !== -1) {
          this.educationLevels[index] = updatedEducationLevel;
        }
        this.loadEducationLevels(); // Reload to get fresh data
      },
      error: (error) => {
        console.error('Error toggling education level activity:', error);
        this.toasterService.showError(error.message || 'حدث خطأ أثناء تغيير حالة المستوى التعليمي');
        this.togglingEducationLevels.delete(educationLevel.id);
      }
    });
  }

  isToggling(educationLevelId: number): boolean {
    return this.togglingEducationLevels.has(educationLevelId);
  }
}
