import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ParentAuthService } from '../services/parent-auth.service';

export const parentAuthGuard: CanActivateFn = (_route, state) => {
  const authService = inject(ParentAuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/inscription'], {
    queryParams: {
      redirectUrl: state.url,
    },
  });
};
