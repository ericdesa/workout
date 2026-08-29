import { inject } from '@angular/core';
import { CanMatchFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanMatchFn = async (): Promise<boolean | UrlTree> => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isLoggedIn()) {
    return true;
  }

  if (auth.loading()) {
    await new Promise<void>((resolve) => {
      const interval = setInterval(() => {
        if (!auth.loading()) {
          clearInterval(interval);
          resolve();
        }
      }, 30);
    });
  }

  if (auth.isLoggedIn()) {
    return true;
  }

  return router.createUrlTree(['/login']);
};
