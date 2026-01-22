import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ConfirmationConfig } from '../components/confirmation-dialog/confirmation-dialog.component';

@Injectable({
  providedIn: 'root'
})
export class ConfirmationDialogService {
  private confirmationSubject = new BehaviorSubject<{
    show: boolean;
    config: ConfirmationConfig;
    resolve: (value: boolean) => void;
  } | null>(null);

  show(config: ConfirmationConfig): Promise<boolean> {
    return new Promise((resolve) => {
      this.confirmationSubject.next({
        show: true,
        config,
        resolve
      });
    });
  }

  getConfirmation(): Observable<{
    show: boolean;
    config: ConfirmationConfig;
    resolve: (value: boolean) => void;
  } | null> {
    return this.confirmationSubject.asObservable();
  }

  confirm(): void {
    const current = this.confirmationSubject.value;
    if (current) {
      current.resolve(true);
      this.confirmationSubject.next(null);
    }
  }

  cancel(): void {
    const current = this.confirmationSubject.value;
    if (current) {
      current.resolve(false);
      this.confirmationSubject.next(null);
    }
  }
}
