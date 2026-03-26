import { DatePipe } from '@angular/common';
import { Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslatePipe } from '@ngx-translate/core';
import { finalize } from 'rxjs';
import { GoogleSignInButtonComponent } from '../../../core/components/google-sign-in-button/google-sign-in-button.component';
import { I18nService } from '../../../core/services/i18n.service';
import { ParentAuthService } from '../../../core/services/parent-auth.service';
import { ParentRegistrationsService } from '../../../core/services/parent-registrations.service';
import { RegistrationRecord, RegistrationStatus } from '../../../shared/models/registration.model';

@Component({
  selector: 'app-account-page',
  imports: [ReactiveFormsModule, DatePipe, GoogleSignInButtonComponent, TranslatePipe],
  templateUrl: './account-page.component.html',
  styleUrl: './account-page.component.scss',
})
export class AccountPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly i18nService = inject(I18nService);
  private readonly parentAuthService = inject(ParentAuthService);
  private readonly parentRegistrationsService = inject(ParentRegistrationsService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly parent = computed(() => this.parentAuthService.parent());
  protected readonly isAuthenticated = computed(() => this.parentAuthService.isAuthenticated());
  protected readonly registerSubmitting = signal(false);
  protected readonly loginSubmitting = signal(false);
  protected readonly googleSubmitting = signal(false);
  protected readonly loadingReservations = signal(false);
  protected readonly cancellingReservationId = signal<number | null>(null);
  protected readonly savingProfile = signal(false);
  protected readonly reservationsErrorMessage = signal<string | null>(null);
  protected readonly registerErrorMessage = signal<string | null>(null);
  protected readonly loginErrorMessage = signal<string | null>(null);
  protected readonly googleErrorMessage = signal<string | null>(null);
  protected readonly profileErrorMessage = signal<string | null>(null);
  protected readonly profileSuccessMessage = signal<string | null>(null);
  protected readonly passwordErrorMessage = signal<string | null>(null);
  protected readonly passwordSuccessMessage = signal<string | null>(null);
  protected readonly settingPassword = signal(false);
  protected readonly reservations = signal<RegistrationRecord[]>([]);
  protected readonly authMethodsLabel = computed(() => {
    this.i18nService.language();

    const parent = this.parent();

    if (!parent) {
      return null;
    }

    const methods: string[] = [];

    if (parent.hasPassword) {
      methods.push(this.i18nService.translateInstant('account.auth.methods.password'));
    }

    if (parent.hasGoogleAccount) {
      methods.push(this.i18nService.translateInstant('account.auth.methods.google'));
    }

    return methods.length > 0
      ? methods.join(' + ')
      : this.i18nService.translateInstant('account.auth.methods.parentLogin');
  });
  protected readonly connectedParentDisplayName = computed(() => {
    const parent = this.parent();

    if (!parent) {
      return '';
    }

    return this.buildParentDisplayName(parent.firstName, parent.lastName, parent.email);
  });
  protected readonly canSetPassword = computed(() => {
    const parent = this.parent();

    return !!parent?.hasGoogleAccount && !parent.hasPassword;
  });

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

  protected readonly profileForm = this.formBuilder.nonNullable.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
  });

  protected readonly passwordForm = this.formBuilder.nonNullable.group({
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required, Validators.minLength(8)]],
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
          this.loadReservations();
          void this.redirectAfterAuth();
        },
        error: () => {
          this.registerErrorMessage.set(
            this.i18nService.translateInstant('account.auth.errors.register'),
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
          this.loadReservations();
          void this.redirectAfterAuth();
        },
        error: () => {
          this.loginErrorMessage.set(this.i18nService.translateInstant('account.auth.errors.login'));
        },
      });
  }

  protected logout() {
    this.parentAuthService.logout();
    this.reservations.set([]);
    this.reservationsErrorMessage.set(null);
    this.registerErrorMessage.set(null);
    this.loginErrorMessage.set(null);
    this.googleErrorMessage.set(null);
    this.profileErrorMessage.set(null);
    this.profileSuccessMessage.set(null);
    this.passwordErrorMessage.set(null);
    this.passwordSuccessMessage.set(null);
  }

  protected submitGoogleLogin(credential: string) {
    if (this.googleSubmitting()) {
      return;
    }

    this.googleSubmitting.set(true);
    this.googleErrorMessage.set(null);

    this.parentAuthService
      .loginWithGoogle({ idToken: credential })
      .pipe(
        finalize(() => {
          this.googleSubmitting.set(false);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.loadReservations();
          void this.redirectAfterAuth();
        },
        error: () => {
          this.googleErrorMessage.set(
            this.i18nService.translateInstant('account.auth.errors.google'),
          );
        },
      });
  }

  protected continuePath() {
    void this.redirectAfterAuth();
  }

  protected statusLabel(status: RegistrationStatus): string {
    switch (status) {
      case 'PENDING':
        return this.i18nService.translateInstant('account.reservations.status.pending');
      case 'CONFIRMED':
        return this.i18nService.translateInstant('account.reservations.status.confirmed');
      case 'CANCELLED':
        return this.i18nService.translateInstant('account.reservations.status.cancelled');
      case 'ATTENDED':
        return this.i18nService.translateInstant('account.reservations.status.attended');
    }
  }

  protected canCancel(reservation: RegistrationRecord) {
    return reservation.status === 'PENDING' || reservation.status === 'CONFIRMED';
  }

  protected cancelReservation(reservation: RegistrationRecord) {
    if (!this.canCancel(reservation)) {
      return;
    }

    const confirmed = confirm(
      this.i18nService.translateInstant('account.reservations.cancel.confirm', {
        workshopTitle: reservation.workshop.title,
        childFirstName: reservation.childFirstName,
      }),
    );

    if (!confirmed) {
      return;
    }

    this.cancellingReservationId.set(reservation.id);
    this.reservationsErrorMessage.set(null);

    this.parentRegistrationsService
      .cancel(reservation.id)
      .pipe(
        finalize(() => {
          this.cancellingReservationId.set(null);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (updatedReservation) => {
          this.reservations.update((reservations) =>
            reservations.map((item) =>
              item.id === updatedReservation.id ? updatedReservation : item,
            ),
          );
        },
        error: () => {
          this.reservationsErrorMessage.set(
            this.i18nService.translateInstant('account.reservations.cancel.error'),
          );
        },
      });
  }

  constructor() {
    effect(() => {
      const parent = this.parent();

      if (!parent) {
        return;
      }

      this.profileForm.reset({
        firstName: parent.firstName,
        lastName: parent.lastName,
        email: parent.email,
        phone: parent.phone ?? '',
      });
    });

    if (this.parentAuthService.isAuthenticated()) {
      this.loadReservations();
    }
  }

  protected saveProfile() {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.savingProfile.set(true);
    this.profileErrorMessage.set(null);
    this.profileSuccessMessage.set(null);

    this.parentAuthService
      .updateProfile({
        ...this.profileForm.getRawValue(),
        phone: this.profileForm.getRawValue().phone || null,
      })
      .pipe(
        finalize(() => {
          this.savingProfile.set(false);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.profileSuccessMessage.set(
            this.i18nService.translateInstant('account.profile.success'),
          );
        },
        error: () => {
          this.profileErrorMessage.set(
            this.i18nService.translateInstant('account.profile.error'),
          );
        },
      });
  }

  protected setPassword() {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    const { password, confirmPassword } = this.passwordForm.getRawValue();

    if (password !== confirmPassword) {
      this.passwordErrorMessage.set(
        this.i18nService.translateInstant('account.password.errors.mismatch'),
      );
      this.passwordSuccessMessage.set(null);
      return;
    }

    this.settingPassword.set(true);
    this.passwordErrorMessage.set(null);
    this.passwordSuccessMessage.set(null);

    this.parentAuthService
      .setPassword({ password })
      .pipe(
        finalize(() => {
          this.settingPassword.set(false);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.passwordForm.reset({
            password: '',
            confirmPassword: '',
          });
          this.passwordSuccessMessage.set(
            this.i18nService.translateInstant('account.password.success'),
          );
        },
        error: () => {
          this.passwordErrorMessage.set(
            this.i18nService.translateInstant('account.password.errors.unavailable'),
          );
        },
      });
  }

  protected childSummary(registration: RegistrationRecord) {
    return this.i18nService.translateInstant('account.reservations.childSummary', {
      childFirstName: registration.childFirstName,
      childAge: registration.childAge,
    });
  }

  private redirectAfterAuth() {
    const redirectUrl = this.route.snapshot.queryParamMap.get('redirectUrl') ?? '/inscription';
    return this.router.navigateByUrl(redirectUrl);
  }

  private buildParentDisplayName(firstName: string, lastName: string, email: string) {
    const fullName = [firstName.trim(), lastName.trim()]
      .filter((value) => value.length > 0)
      .join(' ');

    return fullName || email;
  }

  private loadReservations() {
    this.loadingReservations.set(true);
    this.reservationsErrorMessage.set(null);

    this.parentRegistrationsService
      .getMine()
      .pipe(
        finalize(() => {
          this.loadingReservations.set(false);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (reservations) => {
          this.reservations.set(reservations);
        },
        error: () => {
          this.reservationsErrorMessage.set(
            this.i18nService.translateInstant('account.reservations.error'),
          );
        },
      });
  }
}
