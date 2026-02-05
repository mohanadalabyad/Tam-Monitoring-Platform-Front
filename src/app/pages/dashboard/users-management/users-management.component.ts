import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserService } from '../../../services/user.service';
import { ToasterService } from '../../../services/toaster.service';
import { PermissionCheckService } from '../../../services/permission-check.service';
import { ConfirmationDialogService } from '../../../services/confirmation-dialog.service';
import { UserDto, AddUserDto, UpdateUserDto } from '../../../models/user-management.model';
import { TableColumn, TableAction } from '../../../components/unified-table/unified-table.component';
import { ViewMode } from '../../../components/view-toggle/view-toggle.component';
import { Pencil, Trash2, UserPlus, Power, PowerOff, Shield } from 'lucide-angular';

@Component({
  selector: 'app-users-management',
  templateUrl: './users-management.component.html',
  styleUrls: ['./users-management.component.scss']
})
export class UsersManagementComponent implements OnInit {
  users: UserDto[] = [];
  loading = false;
  showModal = false;
  modalTitle = '';
  userForm!: FormGroup;
  editingUser: UserDto | null = null;
  viewMode: ViewMode = 'table';

  columns: TableColumn[] = [
    { key: 'fullName', label: 'الاسم الكامل', sortable: true, filterable: false },
    { key: 'userName', label: 'اسم المستخدم', sortable: true, filterable: false },
    { key: 'email', label: 'البريد الإلكتروني', sortable: true, filterable: false },
    { key: 'roles', label: 'الأدوار', sortable: false, filterable: false, render: (value) => this.formatRoles(value) },
    { 
      key: 'isSuperAdmin', 
      label: 'مدير عام', 
      sortable: true, 
      filterable: false, 
      type: 'icon',
      iconRenderer: (value) => value ? Shield : null
    },
    { 
      key: 'isActive', 
      label: 'الحالة', 
      sortable: true, 
      filterable: false,
      type: 'toggle',
      toggleAction: (this.permissionService.hasPermission('User', 'ToggleActivity') || this.permissionService.isSuperAdmin()) 
        ? (row, event) => this.toggleUserActivity(row, event)
        : undefined,
      isToggling: (row) => this.isToggling(row.id)
    }
  ];

  actions: TableAction[] = [];
  
  // Lucide icons
  Pencil = Pencil;
  Trash2 = Trash2;
  UserPlus = UserPlus;
  Power = Power;
  PowerOff = PowerOff;
  Shield = Shield;
  
  // Track toggling users
  togglingUsers: Set<string> = new Set();

  constructor(
    private userService: UserService,
    private toasterService: ToasterService,
    public permissionService: PermissionCheckService,
    private confirmationService: ConfirmationDialogService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    // Load view preference
    const savedView = localStorage.getItem('users-view-mode');
    if (savedView === 'table' || savedView === 'cards') {
      this.viewMode = savedView;
    }
    this.initForm();
    this.loadUsers();
    // Setup actions after a brief delay to ensure user data is loaded
    setTimeout(() => {
      this.setupActions();
    }, 0);
  }

  onViewChange(view: ViewMode): void {
    this.viewMode = view;
    localStorage.setItem('users-view-mode', view);
  }

  onUserClick(user: UserDto): void {
    // Handle card click if needed
  }

  setupActions(): void {
    this.actions = [];
    
    if (this.permissionService.hasPermission('User', 'Update') || this.permissionService.isSuperAdmin()) {
      this.actions.push({
        label: 'تعديل',
        icon: Pencil,
        action: (row) => this.editUser(row),
        class: 'btn-edit',
        variant: 'warning',
        showLabel: false
      });
    }
    
    // Only show role assignment if user has Role.AssignRoleToUser
    if ((this.permissionService.hasPermission('Role', 'AssignRoleToUser') || this.permissionService.isSuperAdmin())) {
      // Note: We'll filter this in the template based on row.isSuperAdmin
      this.actions.push({
        label: 'تعيين الأدوار',
        icon: UserPlus,
        action: (row) => this.openRoleAssignmentModal(row),
        class: 'btn-assign',
        variant: 'primary',
        showLabel: false,
        condition: (row: UserDto) => !row.isSuperAdmin // Only show if not super admin
      });
    }
    
    if (this.permissionService.hasPermission('User', 'Delete') || this.permissionService.isSuperAdmin()) {
      this.actions.push({
        label: 'حذف',
        icon: Trash2,
        action: (row) => this.deleteUser(row),
        class: 'btn-delete',
        variant: 'danger',
        showLabel: false
      });
    }
  }
  
  showRoleAssignmentModal = false;
  selectedUserForRoleAssignment: UserDto | null = null;

  openRoleAssignmentModal(user: UserDto): void {
    this.selectedUserForRoleAssignment = user;
    this.showRoleAssignmentModal = true;
  }

  onRoleAssignmentUpdated(): void {
    this.loadUsers(); // Reload users to get updated roles
  }

  closeRoleAssignmentModal(): void {
    this.showRoleAssignmentModal = false;
    this.selectedUserForRoleAssignment = null;
  }

  initForm(): void {
    this.userForm = this.fb.group({
      userName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      fullName: ['', Validators.required],
      password: ['', [Validators.minLength(6)]],
      isSuperAdmin: [false]
    });
  }

  loadUsers(): void {
    this.loading = true;
    // Main management page: get ALL users (active and inactive) - pass undefined for isActive
    this.userService.getAllUsers(undefined, undefined, undefined).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          // Handle both array and paginated response
          if (Array.isArray(response.data)) {
            this.users = response.data;
          } else {
            this.users = response.data.items || [];
          }
        } else {
          this.toasterService.showError(response.message || 'حدث خطأ أثناء تحميل المستخدمين');
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.loading = false;
        this.toasterService.showError('حدث خطأ أثناء تحميل المستخدمين');
      }
    });
  }

  openAddModal(): void {
    this.modalTitle = 'إضافة مستخدم جديد';
    this.editingUser = null;
    this.userForm.reset({
      userName: '',
      email: '',
      fullName: '',
      password: '',
      isSuperAdmin: false
    });
    // Password is required for new users
    this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
    this.userForm.get('password')?.updateValueAndValidity();
    this.showModal = true;
  }

  editUser(user: UserDto): void {
    // Check permission before opening edit modal
    if (!this.permissionService.hasPermission('User', 'Update') && !this.permissionService.isSuperAdmin()) {
      this.toasterService.showWarning('ليس لديك صلاحية لتعديل المستخدمين', 'صلاحية مرفوضة');
      return;
    }
    
    this.modalTitle = 'تعديل مستخدم';
    this.editingUser = user;
    this.userForm.patchValue({
      userName: user.userName,
      email: user.email,
      fullName: user.fullName,
      password: '', // Don't populate password
      isSuperAdmin: user.isSuperAdmin
    });
    // Password is optional for updates
    this.userForm.get('password')?.clearValidators();
    this.userForm.get('password')?.setValidators([Validators.minLength(6)]);
    this.userForm.get('password')?.updateValueAndValidity();
    this.showModal = true;
  }

  deleteUser(user: UserDto): void {
    this.confirmationService.show({
      title: 'تأكيد الحذف',
      message: `هل أنت متأكد من حذف المستخدم "${user.fullName}"؟`,
      confirmText: 'حذف',
      cancelText: 'إلغاء',
      type: 'danger'
    }).then(confirmed => {
      if (confirmed) {
        this.userService.deleteUser(user.id).subscribe({
          next: () => {
            this.toasterService.showSuccess('تم حذف المستخدم بنجاح');
            this.loadUsers(); // Reload users after delete
          },
          error: (error) => {
            console.error('Error deleting user:', error);
            this.toasterService.showError('حدث خطأ أثناء حذف المستخدم');
          }
        });
      }
    });
  }

  saveUser(): void {
    if (this.userForm.valid) {
      const formValue = this.userForm.value;
      
      if (this.editingUser) {
        // Update existing
        const updateDto: UpdateUserDto = {
          id: this.editingUser.id,
          userName: formValue.userName,
          email: formValue.email,
          fullName: formValue.fullName,
          password: formValue.password || undefined, // Only include if provided
          isSuperAdmin: formValue.isSuperAdmin,
          roleNames: [] // Roles are managed through role assignment modal
        };
        
        this.userService.updateUser(updateDto).subscribe({
          next: (updatedUser) => {
            this.toasterService.showSuccess('تم تحديث المستخدم بنجاح');
            this.closeModal();
            this.loadUsers(); // Reload users after edit
          },
          error: (error) => {
            console.error('Error updating user:', error);
            this.toasterService.showError(error.message || 'حدث خطأ أثناء تحديث المستخدم');
          }
        });
      } else {
        // Add new - generate GUID for id
        const addDto: AddUserDto = {
          id: this.generateGuid(),
          userName: formValue.userName,
          email: formValue.email,
          fullName: formValue.fullName,
          password: formValue.password,
          isSuperAdmin: formValue.isSuperAdmin,
          roleNames: [] // Roles are managed through role assignment modal
        };
        
        this.userService.createUser(addDto).subscribe({
          next: (newUser) => {
            this.toasterService.showSuccess('تم إضافة المستخدم بنجاح');
            this.closeModal();
            this.loadUsers(); // Reload users after add
          },
          error: (error) => {
            console.error('Error creating user:', error);
            this.toasterService.showError(error.message || 'حدث خطأ أثناء إضافة المستخدم');
          }
        });
      }
    } else {
      Object.keys(this.userForm.controls).forEach(key => {
        this.userForm.get(key)?.markAsTouched();
      });
      this.toasterService.showWarning('يرجى ملء جميع الحقول المطلوبة');
    }
  }

  closeModal(): void {
    this.showModal = false;
    this.editingUser = null;
    this.userForm.reset();
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.userForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  formatRoles(roles: string[]): string {
    if (!roles || roles.length === 0) {
      return 'لا يوجد';
    }
    return roles.join(', ');
  }



  toggleUserActivity(user: UserDto, event: Event): void {
    event.stopPropagation();
    
    if (this.togglingUsers.has(user.id)) {
      return; // Already toggling
    }

    this.togglingUsers.add(user.id);
    
    this.userService.toggleUserActivity(user.id).subscribe({
      next: (updatedUser) => {
        this.toasterService.showSuccess(`تم ${updatedUser.isActive ? 'تفعيل' : 'إلغاء تفعيل'} المستخدم بنجاح`);
        this.togglingUsers.delete(user.id);
        this.loadUsers(); // Reload users after toggle
      },
      error: (error) => {
        console.error('Error toggling user activity:', error);
        this.toasterService.showError(error.message || 'حدث خطأ أثناء تغيير حالة المستخدم');
        this.togglingUsers.delete(user.id);
      }
    });
  }

  isToggling(userId: string): boolean {
    return this.togglingUsers.has(userId);
  }

  generateGuid(): string {
    // Use crypto.randomUUID() if available (modern browsers), otherwise generate manually
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    // Fallback: Generate a GUID/UUID v4 manually
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}
