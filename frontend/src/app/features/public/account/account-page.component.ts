import { DatePipe } from '@angular/common';
import { Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { ParentAuthService } from '../../../core/services/parent-auth.service';
import { ParentRegistrationsService } from '../../../core/services/parent-registrations.service';
import { RegistrationRecord, RegistrationStatus } from '../../../shared/models/registration.model';

@Component({
  selector: 'app-account-page',
  imports: [ReactiveFormsModule, DatePipe],
  templateUrl: './account-page.component.html',
  styleUrl: './account-page.component.scss',
})
export class AccountPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly parentAuthService = inject(ParentAuthService);
  private readonly parentRegistrationsService = inject(ParentRegistrationsService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly parent = computed(() => this.parentAuthService.parent());
  protected readonly isAuthenticated = computed(() => this.parentAuthService.isAuthenticated());
  protected readonly registerSubmitting = signal(false);
  protected readonly loginSubmitting = signal(false);
  protected readonly loadingReservations = signal(false);
  protected readonly cancellingReservationId = signal<number | null>(null);
  protected readonly savingProfile = signal(false);
  protected readonly reservationsErrorMessage = signal<string | null>(null);
  protected readonly registerErrorMessage = signal<string | null>(null);
  protected readonly loginErrorMessage = signal<string | null>(null);
  protected readonly profileErrorMessage = signal<string | null>(null);
  protected readonly profileSuccessMessage = signal<string | null>(null);
  protected readonly reservations = signal<RegistrationRecord[]>([]);

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
          this.loadReservations();
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
    this.reservations.set([]);
    this.reservationsErrorMessage.set(null);
    this.registerErrorMessage.set(null);
    this.loginErrorMessage.set(null);
    this.profileErrorMessage.set(null);
    this.profileSuccessMessage.set(null);
  }

  protected continuePath() {
    void this.redirectAfterAuth();
  }

  protected statusLabel(status: RegistrationStatus): string {
    switch (status) {
      case 'PENDING':
        return 'En attente';
      case 'CONFIRMED':
        return 'Confirmee';
      case 'CANCELLED':
        return 'Annulee';
      case 'ATTENDED':
        return 'Presente';
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
      `Annuler la reservation pour "${reservation.workshop.title}" au nom de ${reservation.childFirstName} ?`,
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
            'Impossible d annuler cette reservation pour le moment.',
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
          this.profileSuccessMessage.set('Profil mis a jour avec succes.');
        },
        error: () => {
          this.profileErrorMessage.set(
            'Impossible de mettre a jour le profil pour le moment.',
          );
        },
      });
  }

  private redirectAfterAuth() {
    const redirectUrl = this.route.snapshot.queryParamMap.get('redirectUrl') ?? '/inscription';
    return this.router.navigateByUrl(redirectUrl);
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
            'Impossible de charger tes reservations pour le moment.',
          );
        },
      });
  }
}
