import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserService } from '../../../services/user.service';
import { ToasterService } from '../../../services/toaster.service';
import { User } from '../../../auth/user.model';
import { TableColumn, TableAction } from '../../../components/unified-table/unified-table.component';

@Component({
  selector: 'app-users-management',
  templateUrl: './users-management.component.html',
  styleUrls: ['./users-management.component.scss']
})
export class UsersManagementComponent implements OnInit {
  users: User[] = [];
  loading = false;
  showModal = false;
  modalTitle = '';
  userForm!: FormGroup;
  editingUser: User | null = null;

  columns: TableColumn[] = [
    { key: 'name', label: 'الاسم', sortable: true, filterable: true },
    { key: 'email', label: 'البريد الإلكتروني', sortable: true, filterable: true },
    { key: 'role', label: 'الدور', sortable: true, filterable: true, type: 'badge', render: (value) => this.getRoleLabel(value) },
    { key: 'status', label: 'الحالة', sortable: true, type: 'badge', render: (value) => this.getStatusLabel(value) },
    { key: 'createdAt', label: 'تاريخ الإنشاء', sortable: true, type: 'date' },
    { key: 'lastLogin', label: 'آخر تسجيل دخول', sortable: true, type: 'date' }
  ];

  actions: TableAction[] = [
    {
      label: 'تعديل',
      action: (row) => this.editUser(row),
      class: 'btn-edit'
    },
    {
      label: 'حذف',
      action: (row) => this.deleteUser(row),
      class: 'btn-delete'
    }
  ];

  roles = ['admin', 'moderator', 'viewer'];
  statuses = ['active', 'inactive', 'suspended'];

  constructor(
    private userService: UserService,
    private toasterService: ToasterService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadUsers();
  }

  initForm(): void {
    this.userForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      role: ['viewer', Validators.required],
      status: ['active', Validators.required]
    });
  }

  loadUsers(): void {
    this.loading = true;
    this.userService.getUsers().subscribe({
      next: (data) => {
        this.users = data;
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
      role: 'viewer',
      status: 'active'
    });
    this.showModal = true;
  }

  editUser(user: User): void {
    this.modalTitle = 'تعديل مستخدم';
    this.editingUser = user;
    this.userForm.patchValue({
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status
    });
    this.showModal = true;
  }

  deleteUser(user: User): void {
    if (confirm(`هل أنت متأكد من حذف المستخدم "${user.name}"؟`)) {
      this.userService.deleteUser(user.id).subscribe({
        next: () => {
          this.users = this.users.filter(u => u.id !== user.id);
          this.toasterService.showSuccess('تم حذف المستخدم بنجاح');
        },
        error: (error) => {
          console.error('Error deleting user:', error);
          this.toasterService.showError('حدث خطأ أثناء حذف المستخدم');
        }
      });
    }
  }

  saveUser(): void {
    if (this.userForm.valid) {
      const formValue = this.userForm.value;
      
      if (this.editingUser) {
        // Update existing
        this.userService.updateUser(this.editingUser.id, formValue).subscribe({
          next: (updatedUser) => {
            const index = this.users.findIndex(u => u.id === this.editingUser!.id);
            if (index !== -1) {
              this.users[index] = updatedUser;
            }
            this.toasterService.showSuccess('تم تحديث المستخدم بنجاح');
            this.closeModal();
          },
          error: (error) => {
            console.error('Error updating user:', error);
            this.toasterService.showError('حدث خطأ أثناء تحديث المستخدم');
          }
        });
      } else {
        // Add new
        this.userService.createUser(formValue).subscribe({
          next: (newUser) => {
            this.users.unshift(newUser);
            this.toasterService.showSuccess('تم إضافة المستخدم بنجاح');
            this.closeModal();
          },
          error: (error) => {
            console.error('Error creating user:', error);
            this.toasterService.showError('حدث خطأ أثناء إضافة المستخدم');
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

  getRoleLabel(role: string): string {
    const labels: { [key: string]: string } = {
      'admin': 'مدير',
      'moderator': 'مشرف',
      'viewer': 'مشاهد'
    };
    return labels[role] || role;
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'active': 'نشط',
      'inactive': 'غير نشط',
      'suspended': 'معلق'
    };
    return labels[status] || status;
  }
}
