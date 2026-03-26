import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslatePipe } from '@ngx-translate/core';
import { finalize } from 'rxjs';
import { I18nService } from '../../../core/services/i18n.service';
import { ParentAuthService } from '../../../core/services/parent-auth.service';
import { RegistrationsService } from '../../../core/services/registrations.service';
import { WorkshopsService } from '../../../core/services/workshops.service';
import { Workshop } from '../../../shared/models/workshop.model';

@Component({
  selector: 'app-registration-page',
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe],
  templateUrl: './registration-page.component.html',
  styleUrl: './registration-page.component.scss',
})
export class RegistrationPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly i18nService = inject(I18nService);
  private readonly route = inject(ActivatedRoute);
  private readonly workshopsService = inject(WorkshopsService);
  private readonly registrationsService = inject(RegistrationsService);
  protected readonly parentAuthService = inject(ParentAuthService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly workshops = signal<Workshop[]>([]);
  protected readonly loadingWorkshops = signal(true);
  protected readonly submitting = signal(false);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly errorMessage = signal<string | null>(null);

  protected parentDisplayName() {
    const parent = this.parentAuthService.parent();

    if (!parent) {
      return '';
    }

    const fullName = [parent.firstName.trim(), parent.lastName.trim()]
      .filter((value) => value.length > 0)
      .join(' ');

    return fullName || parent.email;
  }

  protected readonly registrationForm = this.formBuilder.nonNullable.group({
    childFirstName: ['', [Validators.required, Validators.minLength(2)]],
    childAge: [5, [Validators.required, Validators.min(0), Validators.max(17)]],
    workshopId: [0, [Validators.required, Validators.min(1)]],
    message: [''],
  });

  constructor() {
    this.workshopsService
      .getPublished()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (workshops) => {
          this.workshops.set(workshops);
          this.loadingWorkshops.set(false);

          const workshopIdFromUrl = Number(this.route.snapshot.queryParamMap.get('workshopId'));
          const initialWorkshopId = workshopIdFromUrl || workshops[0]?.id || 0;
          this.registrationForm.patchValue({ workshopId: initialWorkshopId });
        },
        error: () => {
          this.errorMessage.set(
            this.i18nService.translateInstant('registration.error.workshops'),
          );
          this.loadingWorkshops.set(false);
        },
      });
  }

  protected submit() {
    if (this.registrationForm.invalid) {
      this.registrationForm.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.registrationsService
      .create({
        ...this.registrationForm.getRawValue(),
        message: this.registrationForm.getRawValue().message || null,
      })
      .pipe(
        finalize(() => {
          this.submitting.set(false);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (registration) => {
          this.successMessage.set(
            this.i18nService.translateInstant('registration.success', {
              workshopTitle: registration.workshop.title,
            }),
          );
          this.registrationForm.patchValue({
            childFirstName: '',
            childAge: 5,
            message: '',
          });
        },
        error: () => {
          this.errorMessage.set(
            this.i18nService.translateInstant('registration.error.submit'),
          );
        },
      });
  }
}
