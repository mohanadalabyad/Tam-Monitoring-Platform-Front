import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, AlertTriangle, X, Info, AlertCircle } from 'lucide-angular';

export interface ConfirmationConfig {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  icon?: any;
}

@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './confirmation-dialog.component.html',
  styleUrls: ['./confirmation-dialog.component.scss']
})
export class ConfirmationDialogComponent {
  @Input() show: boolean = false;
  @Input() config: ConfirmationConfig = {
    title: 'تأكيد',
    message: 'هل أنت متأكد من هذا الإجراء؟',
    confirmText: 'تأكيد',
    cancelText: 'إلغاء',
    type: 'warning'
  };

  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();

  // Lucide icons
  AlertTriangle = AlertTriangle;
  AlertCircle = AlertCircle;
  Info = Info;
  X = X;

  onConfirm(): void {
    this.confirmed.emit();
    // Don't set show = false here, let the service handle it
  }

  onCancel(): void {
    this.cancelled.emit();
    // Don't set show = false here, let the service handle it
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      // When clicking backdrop, treat it as cancel to resolve the promise
      this.onCancel();
    }
  }

  onClose(): void {
    // Close button should also cancel to properly resolve the promise
    this.onCancel();
  }

  getIcon(): any {
    if (this.config.icon) {
      return this.config.icon;
    }
    switch (this.config.type) {
      case 'danger':
        return AlertCircle;
      case 'info':
        return Info;
      case 'warning':
      default:
        return AlertTriangle;
    }
  }

  getIconColor(): string {
    switch (this.config.type) {
      case 'danger':
        return '#ef4444';
      case 'info':
        return '#3b82f6';
      case 'warning':
      default:
        return '#f59e0b';
    }
  }
}
