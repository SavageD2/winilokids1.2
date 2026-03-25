import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { RegistrationsService } from '../../../core/services/registrations.service';
import { WorkshopsService } from '../../../core/services/workshops.service';
import { Workshop } from '../../../shared/models/workshop.model';

@Component({
  selector: 'app-registration-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './registration-page.component.html',
  styleUrl: './registration-page.component.scss',
})
export class RegistrationPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly workshopsService = inject(WorkshopsService);
  private readonly registrationsService = inject(RegistrationsService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly workshops = signal<Workshop[]>([]);
  protected readonly loadingWorkshops = signal(true);
  protected readonly submitting = signal(false);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly registrationForm = this.formBuilder.nonNullable.group({
    parentName: ['', [Validators.required, Validators.minLength(2)]],
    parentEmail: ['', [Validators.required, Validators.email]],
    parentPhone: [''],
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
          this.errorMessage.set('Impossible de charger la liste des ateliers.');
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
        parentPhone: this.registrationForm.getRawValue().parentPhone || null,
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
            `Demande enregistree pour l atelier "${registration.workshop.title}". Nous reviendrons vers vous rapidement.`,
          );
          this.registrationForm.patchValue({
            parentName: '',
            parentEmail: '',
            parentPhone: '',
            childFirstName: '',
            childAge: 5,
            message: '',
          });
        },
        error: () => {
          this.errorMessage.set(
            "Impossible d envoyer l inscription pour le moment. Merci de reessayer dans quelques instants.",
          );
        },
      });
  }
}
