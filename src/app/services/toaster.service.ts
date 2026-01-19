import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type ToastType = 'success' | 'warning' | 'error';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToasterService {
  private toastsSubject = new BehaviorSubject<Toast[]>([]);
  public toasts$: Observable<Toast[]> = this.toastsSubject.asObservable();

  private defaultDuration = 5000; // 5 seconds

  showSuccess(message: string, title?: string, duration?: number): void {
    this.addToast({
      type: 'success',
      message,
      title,
      duration: duration || this.defaultDuration
    });
  }

  showWarning(message: string, title?: string, duration?: number): void {
    this.addToast({
      type: 'warning',
      message,
      title,
      duration: duration || this.defaultDuration
    });
  }

  showError(message: string, title?: string, duration?: number): void {
    this.addToast({
      type: 'error',
      message,
      title,
      duration: duration || this.defaultDuration
    });
  }

  removeToast(id: string): void {
    const currentToasts = this.toastsSubject.value;
    this.toastsSubject.next(currentToasts.filter(toast => toast.id !== id));
  }

  clearAll(): void {
    this.toastsSubject.next([]);
  }

  private addToast(toast: Omit<Toast, 'id'>): void {
    const id = this.generateId();
    const newToast: Toast = { ...toast, id };
    const currentToasts = this.toastsSubject.value;
    this.toastsSubject.next([...currentToasts, newToast]);

    // Auto-remove after duration
    if (toast.duration && toast.duration > 0) {
      setTimeout(() => {
        this.removeToast(id);
      }, toast.duration);
    }
  }

  private generateId(): string {
    return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
