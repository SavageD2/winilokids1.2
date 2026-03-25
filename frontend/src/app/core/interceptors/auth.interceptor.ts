import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { AdminSessionService } from '../services/admin-session.service';
import { ParentSessionService } from '../services/parent-session.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const adminSession = inject(AdminSessionService);
  const parentSession = inject(ParentSessionService);
  const router = inject(Router);
  const isApiRequest = req.url.startsWith(API_BASE_URL);
  const isAdminRequest = req.url.includes('/admin/');
  const isParentRequest = req.url.includes('/parent/');
  const isParentAuthRequest = req.url.includes('/parent/auth/');
  const token = isAdminRequest ? adminSession.token() : isParentRequest ? parentSession.token() : null;

  const request = token && isApiRequest
    ? req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      })
    : req;

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && req.url.includes('/admin/')) {
        adminSession.clearSession();
        void router.navigate(['/admin/login']);
      }

      if (error.status === 401 && req.url.includes('/parent/') && !isParentAuthRequest) {
        parentSession.clearSession();
        void router.navigate(['/inscription'], {
          queryParams: {
            redirectUrl: router.url,
          },
        });
      }

      return throwError(() => error);
    }),
  );
};
