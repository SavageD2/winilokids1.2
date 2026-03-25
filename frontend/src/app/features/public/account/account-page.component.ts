import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { ParentAuthService } from '../../../core/services/parent-auth.service';

@Component({
  selector: 'app-account-page',
  imports: [ReactiveFormsModule],
  templateUrl: './account-page.component.html',
  styleUrl: './account-page.component.scss',
})
export class AccountPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly parentAuthService = inject(ParentAuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly parent = computed(() => this.parentAuthService.parent());
  protected readonly isAuthenticated = computed(() => this.parentAuthService.isAuthenticated());
  protected readonly registerSubmitting = signal(false);
  protected readonly loginSubmitting = signal(false);
  protected readonly registerErrorMessage = signal<string | null>(null);
  protected readonly loginErrorMessage = signal<string | null>(null);

  protected readonly registerForm = this.formBuilder.nonNullable.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  protected readonly loginForm = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  protected submitRegistration() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.registerSubmitting.set(true);
    this.registerErrorMessage.set(null);

    this.parentAuthService
      .register({
        ...this.registerForm.getRawValue(),
        phone: this.registerForm.getRawValue().phone || null,
      })
      .pipe(
        finalize(() => {
          this.registerSubmitting.set(false);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          void this.redirectAfterAuth();
        },
        error: () => {
          this.registerErrorMessage.set(
            'Creation du compte impossible pour le moment. Verifie les informations et reessaie.',
          );
        },
      });
  }

  protected submitLogin() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loginSubmitting.set(true);
    this.loginErrorMessage.set(null);

    this.parentAuthService
      .login(this.loginForm.getRawValue())
      .pipe(
        finalize(() => {
          this.loginSubmitting.set(false);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          void this.redirectAfterAuth();
        },
        error: () => {
          this.loginErrorMessage.set(
            'Connexion impossible. Verifie ton email et ton mot de passe.',
          );
        },
      });
  }

  protected logout() {
    this.parentAuthService.logout();
    this.registerErrorMessage.set(null);
    this.loginErrorMessage.set(null);
  }

  protected continuePath() {
    void this.redirectAfterAuth();
  }

  private redirectAfterAuth() {
    const redirectUrl = this.route.snapshot.queryParamMap.get('redirectUrl') ?? '/ateliers';
    return this.router.navigateByUrl(redirectUrl);
  }
}
