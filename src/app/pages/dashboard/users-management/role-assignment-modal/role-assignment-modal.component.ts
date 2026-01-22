import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, X, Search, ArrowRight, ArrowLeft, UserPlus, UserMinus } from 'lucide-angular';
import { UserDto } from '../../../../models/user-management.model';
import { RoleDto } from '../../../../models/role.model';
import { RoleService } from '../../../../services/role.service';
import { ToasterService } from '../../../../services/toaster.service';
import { PermissionCheckService } from '../../../../services/permission-check.service';

@Component({
  selector: 'app-role-assignment-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './role-assignment-modal.component.html',
  styleUrls: ['./role-assignment-modal.component.scss']
})
export class RoleAssignmentModalComponent implements OnInit, OnChanges {
  @Input() show: boolean = false;
  @Input() user: UserDto | null = null;
  @Output() closed = new EventEmitter<void>();
  @Output() updated = new EventEmitter<void>();

  availableRoles: RoleDto[] = [];
  assignedRoles: RoleDto[] = [];
  searchTerm: string = '';
  loading = false;

  // Icons
  X = X;
  Search = Search;
  ArrowRight = ArrowRight;
  ArrowLeft = ArrowLeft;
  UserPlus = UserPlus;
  UserMinus = UserMinus;

  constructor(
    private roleService: RoleService,
    private toasterService: ToasterService,
    private permissionService: PermissionCheckService
  ) {}

  ngOnInit(): void {
    if (this.show && this.user) {
      this.loadRoles();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['show'] && this.show && this.user) {
      this.loadRoles();
    }
  }

  loadRoles(): void {
    if (!this.user) return;

    this.loading = true;
    // Get only active roles for assignment
    this.roleService.getAllRoles(true).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const allRoles = Array.isArray(response.data) 
            ? response.data 
            : (response.data && 'items' in response.data ? response.data.items || [] : []);
          
          // Separate assigned and available roles
          const userRoleNames = this.user?.roles || [];
          this.assignedRoles = allRoles.filter(role => 
            userRoleNames.includes(role.name)
          );
          this.availableRoles = allRoles.filter(role => 
            !userRoleNames.includes(role.name)
          );
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading roles:', error);
        this.toasterService.showError('حدث خطأ أثناء تحميل الأدوار');
        this.loading = false;
      }
    });
  }

  get filteredAvailableRoles(): RoleDto[] {
    if (!this.searchTerm) {
      return this.availableRoles;
    }
    const term = this.searchTerm.toLowerCase();
    return this.availableRoles.filter(role => 
      role.name.toLowerCase().includes(term)
    );
  }

  assignRole(role: RoleDto): void {
    if (!this.user) return;

    this.roleService.assignRoleToUser(this.user.id, role.id).subscribe({
      next: () => {
        this.availableRoles = this.availableRoles.filter(r => r.id !== role.id);
        this.assignedRoles.push(role);
        this.toasterService.showSuccess(`تم تعيين الدور "${role.name}" بنجاح`);
        this.updated.emit();
      },
      error: (error) => {
        console.error('Error assigning role:', error);
        this.toasterService.showError(error.message || 'حدث خطأ أثناء تعيين الدور');
      }
    });
  }

  removeRole(role: RoleDto): void {
    if (!this.user) return;

    this.roleService.removeRoleFromUser(this.user.id, role.id).subscribe({
      next: () => {
        this.assignedRoles = this.assignedRoles.filter(r => r.id !== role.id);
        this.availableRoles.push(role);
        this.toasterService.showSuccess(`تم إلغاء تعيين الدور "${role.name}" بنجاح`);
        this.updated.emit();
      },
      error: (error) => {
        console.error('Error removing role:', error);
        this.toasterService.showError(error.message || 'حدث خطأ أثناء إلغاء تعيين الدور');
      }
    });
  }

  close(): void {
    this.show = false;
    this.searchTerm = '';
    this.closed.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.close();
    }
  }

  canAssignRole(): boolean {
    return this.permissionService.hasPermission('User', 'AssignRole') || 
           this.permissionService.isSuperAdmin();
  }
}
