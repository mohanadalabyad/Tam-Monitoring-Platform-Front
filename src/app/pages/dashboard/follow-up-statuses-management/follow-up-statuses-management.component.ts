import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FollowUpStatusService } from '../../../services/follow-up-status.service';
import { ToasterService } from '../../../services/toaster.service';
import { PermissionCheckService } from '../../../services/permission-check.service';
import { ConfirmationDialogService } from '../../../services/confirmation-dialog.service';
import { FollowUpStatusDto, AddFollowUpStatusDto, UpdateFollowUpStatusDto } from '../../../models/follow-up-status.model';
import { TableColumn, TableAction } from '../../../components/unified-table/unified-table.component';
import { ViewMode } from '../../../components/view-toggle/view-toggle.component';
import { Pencil, Trash2, Power, PowerOff, Plus } from 'lucide-angular';

@Component({
  selector: 'app-follow-up-statuses-management',
  templateUrl: './follow-up-statuses-management.component.html',
  styleUrls: ['./follow-up-statuses-management.component.scss']
})
export class FollowUpStatusesManagementComponent implements OnInit {
  followUpStatuses: FollowUpStatusDto[] = [];
  loading = false;
  showModal = false;
  modalTitle = '';
  followUpStatusForm!: FormGroup;
  public editingStatus: FollowUpStatusDto | null = null;
  viewMode: ViewMode = 'table';
  togglingStatuses: Set<number> = new Set();

  columns: TableColumn[] = [
    { key: 'name', label: 'الاسم', sortable: true, filterable: false },
    { key: 'description', label: 'الوصف', sortable: false, filterable: false },
    { 
      key: 'isActive', 
      label: 'الحالة', 
      sortable: true, 
      filterable: false,
      type: 'toggle',
      toggleAction: (this.permissionService.hasPermission('FollowUpStatus', 'ToggleActivity') || this.permissionService.isSuperAdmin()) 
        ? (row, event) => this.toggleActivity(row, event)
        : undefined,
      isToggling: (row) => this.isToggling(row.id)
    }
  ];

  actions: TableAction[] = [];
  
  // Lucide icons
  Pencil = Pencil;
  Trash2 = Trash2;
  Power = Power;
  PowerOff = PowerOff;
  Plus = Plus;

  constructor(
    private followUpStatusService: FollowUpStatusService,
    private toasterService: ToasterService,
    public permissionService: PermissionCheckService,
    private confirmationService: ConfirmationDialogService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    // Load view preference
    const savedView = localStorage.getItem('follow-up-statuses-view-mode');
    if (savedView === 'table' || savedView === 'cards') {
      this.viewMode = savedView;
    }
    this.initForm();
    this.loadFollowUpStatuses();
    // Setup actions after a brief delay to ensure user data is loaded
    setTimeout(() => {
      this.setupActions();
    }, 0);
  }

  onViewChange(view: ViewMode): void {
    this.viewMode = view;
    localStorage.setItem('follow-up-statuses-view-mode', view);
  }

  initForm(): void {
    this.followUpStatusForm = this.fb.group({
      name: ['', Validators.required],
      description: ['']
    });
  }

  setupActions(): void {
    this.actions = [];
    
    if (this.permissionService.hasPermission('FollowUpStatus', 'Update') || this.permissionService.isSuperAdmin()) {
      this.actions.push({
        label: 'تعديل',
        icon: Pencil,
        action: (row) => this.editFollowUpStatus(row),
        class: 'btn-edit',
        variant: 'warning',
        showLabel: false
      });
    }
    
    if (this.permissionService.hasPermission('FollowUpStatus', 'Delete') || this.permissionService.isSuperAdmin()) {
      this.actions.push({
        label: 'حذف',
        icon: Trash2,
        action: (row) => this.deleteFollowUpStatus(row),
        class: 'btn-delete',
        variant: 'danger',
        showLabel: false
      });
    }
  }

  loadFollowUpStatuses(): void {
    this.loading = true;
    // Main management page: get ALL statuses (active and inactive) - pass undefined for isActive
    this.followUpStatusService.getAllFollowUpStatuses(undefined, undefined, undefined).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.followUpStatuses = Array.isArray(response.data) ? response.data : response.data.items || [];
        } else {
          this.toasterService.showError(response.message || 'حدث خطأ أثناء تحميل حالات المتابعة');
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading follow-up statuses:', error);
        this.loading = false;
        this.toasterService.showError('حدث خطأ أثناء تحميل حالات المتابعة');
      }
    });
  }

  openAddModal(): void {
    this.modalTitle = 'إضافة حالة متابعة جديدة';
    this.editingStatus = null;
    this.followUpStatusForm.reset({ 
      name: '', 
      description: ''
    });
    this.showModal = true;
  }

  editFollowUpStatus(status: FollowUpStatusDto): void {
    this.modalTitle = 'تعديل حالة متابعة';
    this.editingStatus = status;
    this.followUpStatusForm.patchValue({
      name: status.name,
      description: status.description || ''
    });
    this.showModal = true;
  }

  deleteFollowUpStatus(status: FollowUpStatusDto): void {
    this.confirmationService.show({
      title: 'تأكيد الحذف',
      message: `هل أنت متأكد من حذف حالة المتابعة "${status.name}"؟`,
      confirmText: 'حذف',
      cancelText: 'إلغاء',
      type: 'danger'
    }).then(confirmed => {
      if (confirmed) {
        this.followUpStatusService.deleteFollowUpStatus(status.id).subscribe({
          next: () => {
            this.followUpStatuses = this.followUpStatuses.filter(s => s.id !== status.id);
            this.toasterService.showSuccess('تم حذف حالة المتابعة بنجاح');
          },
          error: (error) => {
            console.error('Error deleting follow-up status:', error);
            this.toasterService.showError(error.message || 'حدث خطأ أثناء حذف حالة المتابعة');
          }
        });
      }
    });
  }

  saveFollowUpStatus(): void {
    if (this.followUpStatusForm.valid) {
      const formValue = this.followUpStatusForm.value;
      
      if (this.editingStatus) {
        const updateDto: UpdateFollowUpStatusDto = {
          id: this.editingStatus.id,
          name: formValue.name,
          description: formValue.description || undefined
        };
        
        this.followUpStatusService.updateFollowUpStatus(updateDto).subscribe({
          next: (updatedStatus) => {
            this.toasterService.showSuccess('تم تحديث حالة المتابعة بنجاح');
            this.closeModal();
            this.loadFollowUpStatuses();
          },
          error: (error) => {
            this.toasterService.showError(error.message || 'حدث خطأ أثناء تحديث حالة المتابعة');
          }
        });
      } else {
        const addDto: AddFollowUpStatusDto = {
          name: formValue.name,
          description: formValue.description || undefined
        };
        
        this.followUpStatusService.createFollowUpStatus(addDto).subscribe({
          next: (newStatus) => {
            this.toasterService.showSuccess('تم إضافة حالة المتابعة بنجاح');
            this.closeModal();
            this.loadFollowUpStatuses();
          },
          error: (error) => {
            this.toasterService.showError(error.message || 'حدث خطأ أثناء إضافة حالة المتابعة');
          }
        });
      }
    } else {
      Object.keys(this.followUpStatusForm.controls).forEach(key => {
        this.followUpStatusForm.get(key)?.markAsTouched();
      });
    }
  }

  toggleActivity(status: FollowUpStatusDto, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    if (!this.permissionService.hasPermission('FollowUpStatus', 'ToggleActivity') && !this.permissionService.isSuperAdmin()) {
      this.toasterService.showWarning('ليس لديك صلاحية لتغيير حالة حالة المتابعة', 'صلاحية مرفوضة');
      return;
    }

    this.togglingStatuses.add(status.id);
    this.followUpStatusService.toggleFollowUpStatusActivity(status.id).subscribe({
      next: (updatedStatus) => {
        this.togglingStatuses.delete(status.id);
        this.toasterService.showSuccess(`تم ${updatedStatus.isActive ? 'تفعيل' : 'إلغاء تفعيل'} حالة المتابعة بنجاح`);
        this.loadFollowUpStatuses(); // Reload to get fresh data
      },
      error: (error) => {
        console.error('Error toggling follow-up status activity:', error);
        this.togglingStatuses.delete(status.id);
        this.toasterService.showError(error.message || 'حدث خطأ أثناء تغيير حالة حالة المتابعة');
      }
    });
  }

  isToggling(id: number): boolean {
    return this.togglingStatuses.has(id);
  }

  closeModal(): void {
    this.showModal = false;
    this.editingStatus = null;
    this.followUpStatusForm.reset();
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.followUpStatusForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }
}
