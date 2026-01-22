import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { ToasterService } from '../services/toaster.service';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(
    private router: Router,
    private authService: AuthService,
    private toasterService: ToasterService
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        let errorMessage = 'حدث خطأ غير متوقع';

        if (error.error instanceof ErrorEvent) {
          // Client-side error
          errorMessage = 'خطأ في الاتصال بالخادم';
        } else {
          // Server-side error
          switch (error.status) {
            case 401:
              // Unauthorized - token expired or invalid
              errorMessage = error.error?.message || 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى';
              this.authService.logout();
              this.router.navigate(['/login'], {
                queryParams: { returnUrl: this.router.url }
              });
              break;

            case 403:
              // Forbidden - no permission
              errorMessage = error.error?.message || 'ليس لديك صلاحية للوصول إلى هذا المورد';
              this.toasterService.showError(errorMessage, 'صلاحية مرفوضة');
              break;

            case 404:
              errorMessage = error.error?.message || 'المورد المطلوب غير موجود';
              break;

            case 400:
              errorMessage = error.error?.message || 'طلب غير صالح';
              break;

            case 409:
              errorMessage = error.error?.message || 'تعارض في البيانات';
              break;

            case 500:
              errorMessage = error.error?.message || 'حدث خطأ في الخادم، يرجى المحاولة لاحقاً';
              break;

            default:
              errorMessage = error.error?.message || `خطأ ${error.status}: ${error.statusText}`;
          }
        }

        // Only show error toast if not 401 (we're redirecting) and not 403 (already shown)
        if (error.status !== 401 && error.status !== 403) {
          this.toasterService.showError(errorMessage);
        }

        return throwError(() => error);
      })
    );
  }
}
