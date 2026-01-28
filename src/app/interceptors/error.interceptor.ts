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
          // Server-side error - extract message from ApiResponse structure
          // Backend returns: { success: false, message: "...", data: ... }
          // Try multiple ways to extract the message
          if (error.error) {
            if (typeof error.error === 'object') {
              // Try to get message from ApiResponse structure
              errorMessage = error.error.message || error.error.error || error.error.title || '';
            } else if (typeof error.error === 'string') {
              // If error.error is a string, try to parse it as JSON first
              try {
                const parsed = JSON.parse(error.error);
                errorMessage = parsed.message || parsed.error || error.error;
              } catch {
                // If parsing fails, use the string directly
                errorMessage = error.error;
              }
            }
          }

          // Server-side error - set default messages if extraction failed
          switch (error.status) {
            case 401:
              // Unauthorized - token expired or invalid
              errorMessage = errorMessage || 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى';
              this.authService.logout();
              this.router.navigate(['/login'], {
                queryParams: { returnUrl: this.router.url }
              });
              break;

            case 403:
              // Forbidden - no permission
              errorMessage = errorMessage || 'ليس لديك صلاحية للوصول إلى هذا المورد';
              this.toasterService.showError(errorMessage, 'صلاحية مرفوضة');
              break;

            case 404:
              errorMessage = errorMessage || 'المورد المطلوب غير موجود';
              break;

            case 400:
              // Bad Request - use the message from API response, or default message
              errorMessage = errorMessage || 'طلب غير صالح';
              break;

            case 409:
              errorMessage = errorMessage || 'تعارض في البيانات';
              break;

            case 500:
              errorMessage = errorMessage || 'حدث خطأ في الخادم، يرجى المحاولة لاحقاً';
              break;

            default:
              errorMessage = errorMessage || `خطأ ${error.status}: ${error.statusText}`;
          }
        }

        // Only show error toast if not 401 (we're redirecting), not 403 (already shown), and not 400 (components handle it)
        if (error.status !== 401 && error.status !== 403 && error.status !== 400) {
          this.toasterService.showError(errorMessage);
        }

        // Create a new error with the extracted message so components can access it via error.message
        const customError = new Error(errorMessage);
        (customError as any).originalError = error;
        (customError as any).status = error.status;
        (customError as any).error = error.error;

        return throwError(() => customError);
      })
    );
  }
}
