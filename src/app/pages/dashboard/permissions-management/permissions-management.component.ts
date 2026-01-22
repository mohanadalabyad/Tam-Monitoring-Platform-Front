import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LucideAngularModule, ChevronDown, ChevronUp, Shield, Search, Filter, XCircle, Pencil, Power, PowerOff } from 'lucide-angular';
import { PermissionApiService } from '../../../services/permission-api.service';
import { ToasterService } from '../../../services/toaster.service';
import { PermissionCheckService } from '../../../services/permission-check.service';
import { ConfirmationDialogService } from '../../../services/confirmation-dialog.service';
import { PermissionDto, UpdatePermissionDto } from '../../../models/permission.model';
import { TableColumn, TableAction } from '../../../components/unified-table/unified-table.component';
import { ViewToggleComponent } from '../../../components/view-toggle/view-toggle.component';
import { ViewMode } from '../../../components/view-toggle/view-toggle.component';

interface PermissionGroup {
  type: string;
  permissions: PermissionDto[];
  expanded: boolean;
  count: number;
}

@Component({
  selector: 'app-permissions-management',
  standalone: false,
  templateUrl: './permissions-management.component.html',
  styleUrls: ['./permissions-management.component.scss']
})
export class PermissionsManagementComponent implements OnInit {
  permissions: PermissionDto[] = [];
  permissionGroups: PermissionGroup[] = [];
  loading = false;
  filterType = '';
  searchTerm: string = '';
  viewMode: ViewMode = 'cards';

  columns: TableColumn[] = [
    { key: 'type', label: 'النوع', sortable: true, filterable: true, render: (value) => this.getGroupChip(value) },
    { key: 'name', label: 'الاسم', sortable: true, filterable: true, render: (value) => this.getCodeChip(value) },
    { key: 'value', label: 'القيمة', sortable: true, filterable: true },
    { 
      key: 'isActive', 
      label: 'الحالة', 
      sortable: true, 
      filterable: false,
      type: 'toggle',
      toggleAction: (this.permissionService.hasPermission('Permission', 'ToggleActivity') || this.permissionService.isSuperAdmin()) 
        ? (row, event) => this.togglePermissionActivity(row, event)
        : undefined,
      isToggling: (row) => this.isToggling(row.id)
    }
  ];

  actions: TableAction[] = [];

  getCodeChip(value: string): string {
    return value; // Return value for display, styling will be done via CSS
  }

  getGroupChip(value: string): string {
    return value; // Return value for display, styling will be done via CSS
  }

  // Icons
  ChevronDown = ChevronDown;
  ChevronUp = ChevronUp;
  Shield = Shield;
  Search = Search;
  Filter = Filter;
  XCircle = XCircle;
  Pencil = Pencil;
  Power = Power;
  PowerOff = PowerOff;

  // Modal state
  showModal = false;
  modalTitle = '';
  permissionForm!: FormGroup;
  editingPermission: PermissionDto | null = null;
  togglingPermissions: Set<number> = new Set();

  constructor(
    private permissionApiService: PermissionApiService,
    private toasterService: ToasterService,
    public permissionService: PermissionCheckService,
    private confirmationService: ConfirmationDialogService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    // Load view preference
    const savedView = localStorage.getItem('permissions-view-mode');
    if (savedView === 'table' || savedView === 'cards') {
      this.viewMode = savedView;
    }
    this.initForm();
    this.loadPermissions();
    this.setupActions();
  }

  initForm(): void {
    this.permissionForm = this.fb.group({
      name: ['', Validators.required]
    });
  }

  setupActions(): void {
    this.actions = [];
    
    if (this.permissionService.hasPermission('Permission', 'Update') || this.permissionService.isSuperAdmin()) {
      this.actions.push({
        label: 'تعديل',
        icon: Pencil,
        action: (row) => this.editPermission(row),
        class: 'btn-edit',
        variant: 'warning',
        condition: () => true
      });
    }
    
    // Note: Delete functionality is not available for permissions in the backend
  }

  loadPermissions(): void {
    this.loading = true;
    // Main management page: get ALL permissions (active and inactive)
    this.permissionApiService.getAllPermissions(undefined, undefined, undefined).subscribe({
      next: (data) => {
        // Handle both array and paginated response
        if (Array.isArray(data)) {
          this.permissions = data;
        } else if (data && 'items' in data) {
          this.permissions = data.items || [];
        } else {
          this.permissions = [];
        }
        this.buildPermissionGroups();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading permissions:', error);
        this.loading = false;
        this.toasterService.showError('حدث خطأ أثناء تحميل الصلاحيات');
        this.permissions = [];
        this.permissionGroups = [];
      }
    });
  }

  buildPermissionGroups(): void {
    const groupsMap = new Map<string, PermissionDto[]>();
    
    this.permissions.forEach(permission => {
      if (!groupsMap.has(permission.type)) {
        groupsMap.set(permission.type, []);
      }
      groupsMap.get(permission.type)!.push(permission);
    });

    this.permissionGroups = Array.from(groupsMap.entries()).map(([type, permissions]) => ({
      type,
      permissions,
      expanded: false,
      count: permissions.length
    })).sort((a, b) => a.type.localeCompare(b.type));
  }

  toggleGroup(group: PermissionGroup): void {
    group.expanded = !group.expanded;
  }

  getFilteredGroups(): PermissionGroup[] {
    if (!this.searchTerm && !this.filterType) {
      return this.permissionGroups;
    }

    return this.permissionGroups.filter(group => {
      if (this.filterType && group.type !== this.filterType) {
        return false;
      }
      if (this.searchTerm) {
        const term = this.searchTerm.toLowerCase();
        return group.type.toLowerCase().includes(term) ||
               group.permissions.some(p => 
                 p.name.toLowerCase().includes(term) ||
                 p.value.toLowerCase().includes(term)
               );
      }
      return true;
    });
  }

  getFilteredPermissions(): PermissionDto[] {
    let filtered = [...this.permissions];

    if (this.filterType) {
      filtered = filtered.filter(p => p.type === this.filterType);
    }

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.type.toLowerCase().includes(term) ||
        p.name.toLowerCase().includes(term) ||
        p.value.toLowerCase().includes(term)
      );
    }

    return filtered;
  }

  getPermissionTypes(): string[] {
    return [...new Set(this.permissions.map(p => p.type))];
  }

  onViewChange(view: ViewMode): void {
    this.viewMode = view;
    localStorage.setItem('permissions-view-mode', view);
  }

  getGroupIcon(type: string): any {
    return Shield;
  }

  getGroupColor(type: string): string {
    const colors = [
      'var(--primary-color)',
      'var(--accent-color)',
      'var(--info-color)',
      'var(--success-color)',
      'var(--warning-color)',
      'var(--danger-color)'
    ];
    const index = this.permissionGroups.findIndex(g => g.type === type);
    return colors[index % colors.length];
  }

  togglePermissionActivity(permission: PermissionDto, event: Event): void {
    event.stopPropagation();
    
    if (this.togglingPermissions.has(permission.id)) {
      return;
    }

    this.togglingPermissions.add(permission.id);
    
    this.permissionApiService.togglePermissionActivity(permission.id).subscribe({
      next: (updatedPermission) => {
        this.toasterService.showSuccess(`تم ${updatedPermission.isActive ? 'تفعيل' : 'إلغاء تفعيل'} الصلاحية بنجاح`);
        this.togglingPermissions.delete(permission.id);
        // Update the permission in the list
        const index = this.permissions.findIndex(p => p.id === permission.id);
        if (index !== -1) {
          this.permissions[index] = updatedPermission;
        }
        this.buildPermissionGroups(); // Rebuild groups to reflect changes
      },
      error: (error) => {
        console.error('Error toggling permission activity:', error);
        this.toasterService.showError(error.message || 'حدث خطأ أثناء تغيير حالة الصلاحية');
        this.togglingPermissions.delete(permission.id);
      }
    });
  }

  isToggling(permissionId: number): boolean {
    return this.togglingPermissions.has(permissionId);
  }

  editPermission(permission: PermissionDto): void {
    this.modalTitle = 'تعديل الصلاحية';
    this.editingPermission = permission;
    this.permissionForm.patchValue({ name: permission.name });
    this.showModal = true;
  }


  savePermission(): void {
    if (this.permissionForm.valid) {
      const formValue = this.permissionForm.value;
      
      if (this.editingPermission) {
        const updateDto: UpdatePermissionDto = {
          id: this.editingPermission.id,
          name: formValue.name
        };
        
        this.permissionApiService.updatePermission(updateDto).subscribe({
          next: (updatedPermission) => {
            const index = this.permissions.findIndex(p => p.id === this.editingPermission!.id);
            if (index !== -1) {
              this.permissions[index] = { ...this.permissions[index], name: updatedPermission.name };
            }
            this.buildPermissionGroups();
            this.toasterService.showSuccess('تم تحديث الصلاحية بنجاح');
            this.closeModal();
          },
          error: (error) => {
            this.toasterService.showError(error.message || 'حدث خطأ أثناء تحديث الصلاحية');
          }
        });
      }
    } else {
      Object.keys(this.permissionForm.controls).forEach(key => {
        this.permissionForm.get(key)?.markAsTouched();
      });
      this.toasterService.showWarning('يرجى ملء جميع الحقول المطلوبة');
    }
  }

  closeModal(): void {
    this.showModal = false;
    this.editingPermission = null;
    this.permissionForm.reset();
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.permissionForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }
}
