import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ViolationService } from '../../../services/violation.service';
import { ToasterService } from '../../../services/toaster.service';
import { Violation } from '../../../models/violation.model';
import { TableColumn, TableAction } from '../../../components/unified-table/unified-table.component';
import { PermissionCheckService } from '../../../services/permission-check.service';

@Component({
  selector: 'app-violations-management',
  templateUrl: './violations-management.component.html',
  styleUrls: ['./violations-management.component.scss']
})
export class ViolationsManagementComponent implements OnInit {
  violations: Violation[] = [];
  loading = false;
  showModal = false;
  modalTitle = '';
  violationForm!: FormGroup;
  editingViolation: Violation | null = null;

  columns: TableColumn[] = [
    { key: 'title', label: 'العنوان', sortable: true, filterable: true },
    { key: 'category', label: 'الفئة', sortable: true, filterable: true },
    { key: 'location', label: 'الموقع', sortable: true, filterable: true },
    { key: 'status', label: 'الحالة', sortable: true, type: 'badge', render: (value) => this.getStatusLabel(value) },
    { key: 'reporterName', label: 'المبلغ', sortable: true, filterable: true },
    { key: 'reportedDate', label: 'تاريخ الإبلاغ', sortable: true, type: 'date' }
  ];

  actions: TableAction[] = [];

  categories: string[] = [];

  constructor(
    private violationService: ViolationService,
    private toasterService: ToasterService,
    private fb: FormBuilder,
    public permissionService: PermissionCheckService
  ) {}

  ngOnInit(): void {
    this.categories = this.violationService.getCategories();
    this.initForm();
    this.loadViolations();
    this.setupActions();
  }

  setupActions(): void {
    this.actions = [];
    
    if (this.permissionService.hasPermission('Violation', 'Update') || this.permissionService.isSuperAdmin()) {
      this.actions.push({
        label: 'تعديل',
        action: (row) => this.editViolation(row),
        class: 'btn-edit',
        variant: 'warning',
        showLabel: false
      });
    }
    
    if (this.permissionService.hasPermission('Violation', 'Delete') || this.permissionService.isSuperAdmin()) {
      this.actions.push({
        label: 'حذف',
        action: (row) => this.deleteViolation(row),
        class: 'btn-delete',
        variant: 'danger',
        showLabel: false
      });
    }
  }

  initForm(): void {
    this.violationForm = this.fb.group({
      title: ['', Validators.required],
      category: ['', Validators.required],
      location: ['', Validators.required],
      description: ['', Validators.required],
      reporterName: ['', Validators.required],
      reporterEmail: ['', [Validators.required, Validators.email]],
      reporterPhone: [''],
      status: ['pending', Validators.required]
    });
  }

  loadViolations(): void {
    this.loading = true;
    this.violationService.getViolations().subscribe({
      next: (data) => {
        this.violations = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading violations:', error);
        this.loading = false;
        this.toasterService.showError('حدث خطأ أثناء تحميل الحوادث');
      }
    });
  }

  openAddModal(): void {
    this.modalTitle = 'إضافة حادثة جديدة';
    this.editingViolation = null;
    this.violationForm.reset({
      status: 'pending'
    });
    this.showModal = true;
  }

  editViolation(violation: Violation): void {
    this.modalTitle = 'تعديل حادثة';
    this.editingViolation = violation;
    this.violationForm.patchValue({
      title: violation.title,
      category: violation.category,
      location: violation.location,
      description: violation.description,
      reporterName: violation.reporterName,
      reporterEmail: violation.reporterEmail,
      reporterPhone: violation.reporterPhone || '',
      status: violation.status
    });
    this.showModal = true;
  }

  deleteViolation(violation: Violation): void {
    if (confirm(`هل أنت متأكد من حذف الحادثة "${violation.title}"؟`)) {
      // In a real app, this would call the service
      this.violations = this.violations.filter(v => v.id !== violation.id);
      this.toasterService.showSuccess('تم حذف الحادثة بنجاح');
    }
  }

  saveViolation(): void {
    if (this.violationForm.valid) {
      const formValue = this.violationForm.value;
      
      if (this.editingViolation) {
        // Update existing
        const updatedViolation: Violation = {
          ...this.editingViolation,
          ...formValue,
          reportedDate: this.editingViolation.reportedDate
        };
        const index = this.violations.findIndex(v => v.id === this.editingViolation!.id);
        if (index !== -1) {
          this.violations[index] = updatedViolation;
        }
        this.toasterService.showSuccess('تم تحديث الحادثة بنجاح');
      } else {
        // Add new
        const newViolation: Violation = {
          ...formValue,
          id: (this.violations.length + 1).toString(),
          reportedDate: new Date()
        };
        this.violations.unshift(newViolation);
        this.toasterService.showSuccess('تم إضافة الحادثة بنجاح');
      }
      
      this.closeModal();
    } else {
      Object.keys(this.violationForm.controls).forEach(key => {
        this.violationForm.get(key)?.markAsTouched();
      });
      this.toasterService.showWarning('يرجى ملء جميع الحقول المطلوبة');
    }
  }

  closeModal(): void {
    this.showModal = false;
    this.editingViolation = null;
    this.violationForm.reset();
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.violationForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'pending': 'قيد المراجعة',
      'investigating': 'قيد التحقيق',
      'resolved': 'تم الحل',
      'rejected': 'مرفوض'
    };
    return labels[status] || status;
  }
}
