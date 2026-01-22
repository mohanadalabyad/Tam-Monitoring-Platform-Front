import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { switchMap } from 'rxjs/operators';
import { RoleService } from '../../../services/role.service';
import { PermissionApiService } from '../../../services/permission-api.service';
import { PermissionCheckService } from '../../../services/permission-check.service';
import { ToasterService } from '../../../services/toaster.service';
import { ConfirmationDialogService } from '../../../services/confirmation-dialog.service';
import { RoleDto, AddRoleDto, UpdateRoleDto } from '../../../models/role.model';
import { PermissionDto } from '../../../models/permission.model';

import { Pencil, Trash2, Shield, XCircle, ChevronDown, ChevronUp, ChevronRight, Power, PowerOff } from 'lucide-angular';

interface PermissionGroup {
  type: string;
  permissions: PermissionDto[];
  count: number;
}

@Component({
  selector: 'app-roles-management',
  templateUrl: './roles-management.component.html',
  styleUrls: ['./roles-management.component.scss']
})
export class RolesManagementComponent implements OnInit {
  roles: RoleDto[] = [];
  permissions: PermissionDto[] = [];
  loading = false;
  showModal = false;
  modalTitle = '';
  roleForm!: FormGroup;
  editingRole: RoleDto | null = null;
  selectedRole: RoleDto | null = null;
  expandedGroups: Set<string> = new Set();
  rolePermissionGroups: Map<string, PermissionGroup[]> = new Map();
  togglingRoles: Set<string> = new Set();
  
  // Icons
  Pencil = Pencil;
  Trash2 = Trash2;
  Shield = Shield;
  XCircle = XCircle;
  ChevronDown = ChevronDown;
  ChevronUp = ChevronUp;
  ChevronRight = ChevronRight;
  Power = Power;
  PowerOff = PowerOff;

  constructor(
    private roleService: RoleService,
    private permissionApiService: PermissionApiService,
    private toasterService: ToasterService,
    public permissionService: PermissionCheckService,
    private confirmationService: ConfirmationDialogService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadPermissions();
    this.loadRoles();
  }

  selectRole(role: RoleDto): void {
    this.selectedRole = role;
    // Initialize permission groups for this role if not already done
    if (!this.rolePermissionGroups.has(role.id)) {
      this.rolePermissionGroups.set(role.id, this.getPermissionGroupsForRole(role.id));
    }
  }

  initForm(): void {
    this.roleForm = this.fb.group({
      name: ['', Validators.required]
    });
  }

  loadRoles(): void {
    this.loading = true;
    // Main management page: get ALL roles (active and inactive)
    this.roleService.getAllRoles(undefined).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          // Handle both array and paginated response
          if (Array.isArray(response.data)) {
            this.roles = response.data;
          } else {
            this.roles = response.data.items || [];
          }
          // Clear cached permission groups when roles are reloaded
          this.rolePermissionGroups.clear();
        } else {
          this.toasterService.showError(response.message || 'حدث خطأ أثناء تحميل الأدوار');
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading roles:', error);
        this.loading = false;
        this.toasterService.showError('حدث خطأ أثناء تحميل الأدوار');
      }
    });
  }

  loadPermissions(): void {
    this.permissionApiService.getAllPermissions(undefined, undefined, true).subscribe({
      next: (data) => {
        if (Array.isArray(data)) {
          this.permissions = data;
        } else {
          this.permissions = data.items || [];
        }
      },
      error: (error) => {
        console.error('Error loading permissions:', error);
      }
    });
  }

  openAddModal(): void {
    this.modalTitle = 'إضافة دور جديد';
    this.editingRole = null;
    this.roleForm.reset({ name: '' });
    this.showModal = true;
  }

  editRole(role: RoleDto): void {
    this.modalTitle = 'تعديل دور';
    this.editingRole = role;
    this.roleForm.patchValue({ name: role.name });
    this.showModal = true;
  }

  deleteRole(role: RoleDto): void {
    this.confirmationService.show({
      title: 'تأكيد الحذف',
      message: `هل أنت متأكد من حذف الدور "${role.name}"؟`,
      confirmText: 'حذف',
      cancelText: 'إلغاء',
      type: 'danger'
    }).then(confirmed => {
      if (confirmed) {
        this.roleService.deleteRole(role.id).subscribe({
          next: () => {
            this.roles = this.roles.filter(r => r.id !== role.id);
            this.toasterService.showSuccess('تم حذف الدور بنجاح');
          },
          error: (error) => {
            console.error('Error deleting role:', error);
            this.toasterService.showError('حدث خطأ أثناء حذف الدور');
          }
        });
      }
    });
  }

  saveRole(): void {
    if (this.roleForm.valid) {
      const formValue = this.roleForm.value;
      
      if (this.editingRole) {
        const updateDto: UpdateRoleDto = {
          id: this.editingRole.id,
          name: formValue.name
        };
        
        this.roleService.updateRole(updateDto).pipe(
          switchMap((updatedRole) => {
            // Reload role to get updated data
            return this.roleService.getRoleById(updatedRole.id);
          })
        ).subscribe({
          next: (updatedRole) => {
            const index = this.roles.findIndex(r => r.id === this.editingRole!.id);
            if (index !== -1) {
              this.roles[index] = updatedRole;
              // Clear cached permission groups for this role
              this.rolePermissionGroups.delete(updatedRole.id);
            }
            this.toasterService.showSuccess('تم تحديث الدور بنجاح');
            this.closeModal();
            this.loadRoles(); // Reload to get fresh data
          },
          error: (error) => {
            this.toasterService.showError(error.message || 'حدث خطأ أثناء تحديث الدور');
          }
        });
      } else {
        const addDto: AddRoleDto = {
          name: formValue.name
        };
        
        this.roleService.createRole(addDto).subscribe({
          next: (newRole) => {
            this.toasterService.showSuccess('تم إضافة الدور بنجاح');
            this.closeModal();
            this.loadRoles(); // Reload to get fresh data
          },
          error: (error) => {
            this.toasterService.showError(error.message || 'حدث خطأ أثناء إضافة الدور');
          }
        });
      }
    } else {
      Object.keys(this.roleForm.controls).forEach(key => {
        this.roleForm.get(key)?.markAsTouched();
      });
      this.toasterService.showWarning('يرجى ملء جميع الحقول المطلوبة');
    }
  }


  closeModal(): void {
    this.showModal = false;
    this.editingRole = null;
    this.roleForm.reset();
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.roleForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getRolePermissions(role: RoleDto): string[] {
    if (!role.permissionIds || role.permissionIds.length === 0) {
      return [];
    }
    return role.permissionIds
      .map(id => {
        const perm = this.permissions.find(p => p.id === id);
        return perm ? perm.name : null;
      })
      .filter(name => name !== null) as string[];
  }

  getPermissionGroupsForRole(roleId: string): PermissionGroup[] {
    // Return cached groups if available
    if (this.rolePermissionGroups.has(roleId)) {
      return this.rolePermissionGroups.get(roleId)!;
    }

    const role = this.roles.find(r => r.id === roleId);
    if (!role) {
      return [];
    }

    const groupsMap = new Map<string, PermissionDto[]>();
    
    // Group all permissions by type
    this.permissions.forEach(permission => {
      if (!groupsMap.has(permission.type)) {
        groupsMap.set(permission.type, []);
      }
      groupsMap.get(permission.type)!.push(permission);
    });

    // Convert to PermissionGroup array
    const groups = Array.from(groupsMap.entries()).map(([type, permissions]) => ({
      type,
      permissions,
      count: permissions.length
    })).sort((a, b) => a.type.localeCompare(b.type));

    // Cache the groups
    this.rolePermissionGroups.set(roleId, groups);
    return groups;
  }

  togglePermissionGroup(group: PermissionGroup): void {
    if (this.expandedGroups.has(group.type)) {
      this.expandedGroups.delete(group.type);
    } else {
      this.expandedGroups.add(group.type);
    }
  }

  isGroupExpanded(groupType: string): boolean {
    return this.expandedGroups.has(groupType);
  }

  expandAllGroups(): void {
    if (!this.selectedRole) return;
    const groups = this.getPermissionGroupsForRole(this.selectedRole.id);
    groups.forEach(group => {
      this.expandedGroups.add(group.type);
    });
  }

  collapseAllGroups(): void {
    this.expandedGroups.clear();
  }

  getAssignedCount(group: PermissionGroup): number {
    if (!this.selectedRole) return 0;
    return group.permissions.filter(p => 
      this.isPermissionAssignedToRole(this.selectedRole!.id, p.id)
    ).length;
  }

  isPermissionAssignedToRole(roleId: string, permissionId: number): boolean {
    const role = this.roles.find(r => r.id === roleId);
    if (!role || !role.permissionIds) {
      return false;
    }
    return role.permissionIds.includes(permissionId);
  }

  togglePermissionAssignment(roleId: string, permissionId: number, event: Event): void {
    event.stopPropagation();
    
    const role = this.roles.find(r => r.id === roleId);
    if (!role) {
      return;
    }

    const isAssigned = this.isPermissionAssignedToRole(roleId, permissionId);
    
    // Optimistic update
    if (!role.permissionIds) {
      role.permissionIds = [];
    }
    
    if (isAssigned) {
      // Unassign
      const index = role.permissionIds.indexOf(permissionId);
      if (index > -1) {
        role.permissionIds.splice(index, 1);
      }
      this.roleService.unassignPermissionFromRole(roleId, permissionId).subscribe({
        next: () => {
          // Success - state already updated
        },
        error: (error) => {
          // Revert on error
          if (!role.permissionIds.includes(permissionId)) {
            role.permissionIds.push(permissionId);
          }
          console.error('Error unassigning permission:', error);
          this.toasterService.showError('حدث خطأ أثناء إلغاء تعيين الصلاحية');
        }
      });
    } else {
      // Assign
      if (!role.permissionIds.includes(permissionId)) {
        role.permissionIds.push(permissionId);
      }
      this.roleService.assignPermissionToRole(roleId, permissionId).subscribe({
        next: () => {
          // Success - state already updated
        },
        error: (error) => {
          // Revert on error
          const index = role.permissionIds.indexOf(permissionId);
          if (index > -1) {
            role.permissionIds.splice(index, 1);
          }
          console.error('Error assigning permission:', error);
          this.toasterService.showError('حدث خطأ أثناء تعيين الصلاحية');
        }
      });
    }
  }

  getGroupIcon(type: string): any {
    // Use Shield as default, can be customized based on type
    return Shield;
  }

  getGroupColor(type: string): string {
    const colorsMap: { [key: string]: string } = {
      'User': 'var(--info-color)',
      'Role': 'var(--primary-color)',
      'Permission': 'var(--accent-color)',
      'Category': 'var(--success-color)',
      'Violation': 'var(--danger-color)'
    };
    return colorsMap[type] || 'var(--text-secondary)';
  }

  toggleRoleActivity(role: RoleDto, event: Event): void {
    event.stopPropagation();
    
    if (this.togglingRoles.has(role.id)) {
      return; // Already toggling
    }

    this.togglingRoles.add(role.id);
    
    this.roleService.toggleRoleActivity(role.id).subscribe({
      next: (updatedRole) => {
        this.toasterService.showSuccess(`تم ${updatedRole.isActive ? 'تفعيل' : 'إلغاء تفعيل'} الدور بنجاح`);
        this.togglingRoles.delete(role.id);
        // Update the role in the list
        const index = this.roles.findIndex(r => r.id === role.id);
        if (index !== -1) {
          this.roles[index] = updatedRole;
        }
        // Update selected role if it's the same
        if (this.selectedRole?.id === role.id) {
          this.selectedRole = updatedRole;
        }
        this.loadRoles(); // Reload to get fresh data
      },
      error: (error) => {
        console.error('Error toggling role activity:', error);
        this.toasterService.showError(error.message || 'حدث خطأ أثناء تغيير حالة الدور');
        this.togglingRoles.delete(role.id);
      }
    });
  }

  isToggling(roleId: string): boolean {
    return this.togglingRoles.has(roleId);
  }
}
