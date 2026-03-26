import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslatePipe } from '@ngx-translate/core';
import { finalize } from 'rxjs';
import { AdminWorkshopsService } from '../../../core/services/admin-workshops.service';
import { I18nService } from '../../../core/services/i18n.service';
import {
  CreateWorkshopPayload,
  Workshop,
  WorkshopCalendarSyncStatus,
} from '../../../shared/models/workshop.model';

@Component({
  selector: 'app-admin-workshops-page',
  imports: [ReactiveFormsModule, DatePipe, TranslatePipe],
  templateUrl: './admin-workshops-page.component.html',
  styleUrl: './admin-workshops-page.component.scss',
})
export class AdminWorkshopsPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly i18nService = inject(I18nService);
  private readonly workshopsService = inject(AdminWorkshopsService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly workshops = signal<Workshop[]>([]);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly deletingId = signal<number | null>(null);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly editingWorkshopId = signal<number | null>(null);

  protected readonly workshopForm = this.formBuilder.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    slug: [
      '',
      [
        Validators.required,
        Validators.minLength(3),
        Validators.pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
      ],
    ],
    shortDescription: ['', [Validators.required, Validators.minLength(10)]],
    description: ['', [Validators.required, Validators.minLength(20)]],
    startAt: ['', [Validators.required]],
    endAt: [''],
    location: ['', [Validators.required, Validators.minLength(2)]],
    recommendedAgeMin: [''],
    recommendedAgeMax: [''],
    capacity: [''],
    isPublished: [false],
  });

  constructor() {
    this.loadWorkshops();
  }

  protected submit() {
    const normalizedSlug = this.slugify(this.workshopForm.controls.slug.getRawValue());

    if (normalizedSlug) {
      this.workshopForm.controls.slug.setValue(normalizedSlug);
    } else {
      this.generateSlug();
    }

    if (this.workshopForm.invalid) {
      this.workshopForm.markAllAsTouched();
      this.errorMessage.set(
        this.i18nService.translateInstant('adminWorkshops.errors.invalidForm'),
      );
      return;
    }

    const payload = this.buildPayload();
    const workshopId = this.editingWorkshopId();

    this.saving.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const request$ = workshopId
      ? this.workshopsService.update(workshopId, payload)
      : this.workshopsService.create(payload);

    request$
      .pipe(
        finalize(() => {
          this.saving.set(false);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.successMessage.set(
            this.i18nService.translateInstant(
              workshopId ? 'adminWorkshops.success.updated' : 'adminWorkshops.success.created',
            ),
          );
          this.loadWorkshops();
          this.resetForm();
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(this.getSaveErrorMessage(error));
        },
      });
  }

  protected editWorkshop(workshop: Workshop) {
    this.editingWorkshopId.set(workshop.id);
    this.successMessage.set(null);
    this.errorMessage.set(null);
    this.workshopForm.patchValue({
      title: workshop.title,
      slug: workshop.slug,
      shortDescription: workshop.shortDescription,
      description: workshop.description,
      startAt: this.toLocalDateTimeInput(workshop.startAt),
      endAt: workshop.endAt ? this.toLocalDateTimeInput(workshop.endAt) : '',
      location: workshop.location,
      recommendedAgeMin:
        workshop.recommendedAgeMin !== null ? String(workshop.recommendedAgeMin) : '',
      recommendedAgeMax:
        workshop.recommendedAgeMax !== null ? String(workshop.recommendedAgeMax) : '',
      capacity: workshop.capacity !== null ? String(workshop.capacity) : '',
      isPublished: workshop.isPublished,
    });
  }

  protected createNewWorkshop() {
    this.resetForm();
  }

  protected generateSlug() {
    const title = this.workshopForm.controls.title.getRawValue();
    const slug = this.slugify(title);

    this.workshopForm.controls.slug.setValue(slug);
  }

  protected removeWorkshop(workshop: Workshop) {
    const confirmed = confirm(
      this.i18nService.translateInstant('adminWorkshops.delete.confirm', {
        title: workshop.title,
      }),
    );

    if (!confirmed) {
      return;
    }

    this.deletingId.set(workshop.id);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.workshopsService
      .remove(workshop.id)
      .pipe(
        finalize(() => {
          this.deletingId.set(null);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.successMessage.set(this.i18nService.translateInstant('adminWorkshops.success.deleted'));
          if (this.editingWorkshopId() === workshop.id) {
            this.resetForm();
          }
          this.loadWorkshops();
        },
        error: () => {
          this.errorMessage.set(this.i18nService.translateInstant('adminWorkshops.errors.delete'));
        },
      });
  }

  protected ageLabel(workshop: Workshop): string {
    if (workshop.recommendedAgeMin === null && workshop.recommendedAgeMax === null) {
      return this.i18nService.translateInstant('adminWorkshops.age.unspecified');
    }

    if (workshop.recommendedAgeMin !== null && workshop.recommendedAgeMax !== null) {
      return this.i18nService.translateInstant('adminWorkshops.age.range', {
        min: workshop.recommendedAgeMin,
        max: workshop.recommendedAgeMax,
      });
    }

    if (workshop.recommendedAgeMin !== null) {
      return this.i18nService.translateInstant('adminWorkshops.age.min', {
        min: workshop.recommendedAgeMin,
      });
    }

    return this.i18nService.translateInstant('adminWorkshops.age.max', {
      max: workshop.recommendedAgeMax,
    });
  }

  protected calendarSyncLabel(workshop: Workshop) {
    switch (workshop.googleCalendarSyncStatus) {
      case 'SYNCED':
        return this.i18nService.translateInstant('adminWorkshops.calendar.status.synced');
      case 'FAILED':
        return this.i18nService.translateInstant('adminWorkshops.calendar.status.failed');
      case 'DISABLED':
        return this.i18nService.translateInstant('adminWorkshops.calendar.status.disabled');
      case 'PENDING':
        return this.i18nService.translateInstant('adminWorkshops.calendar.status.pending');
      case 'INACTIVE':
      default:
        return this.i18nService.translateInstant('adminWorkshops.calendar.status.inactive');
    }
  }

  protected calendarSyncDetail(workshop: Workshop) {
    if (workshop.googleCalendarSyncStatus === 'FAILED') {
      return (
        workshop.googleCalendarSyncError ??
        this.i18nService.translateInstant('adminWorkshops.calendar.detail.failed')
      );
    }

    if (workshop.googleCalendarSyncStatus === 'SYNCED' && workshop.googleCalendarSyncedAt) {
      return this.i18nService.translateInstant('adminWorkshops.calendar.detail.syncedAt', {
        date: new Date(workshop.googleCalendarSyncedAt).toLocaleString(this.i18nService.locale()),
      });
    }

    if (workshop.googleCalendarSyncStatus === 'DISABLED') {
      return this.i18nService.translateInstant('adminWorkshops.calendar.detail.disabled');
    }

    if (workshop.googleCalendarSyncStatus === 'INACTIVE') {
      return this.i18nService.translateInstant('adminWorkshops.calendar.detail.inactive');
    }

    return this.i18nService.translateInstant('adminWorkshops.calendar.detail.pending');
  }

  protected calendarSyncClass(workshop: Workshop): string {
    return this.toCalendarSyncClass(workshop.googleCalendarSyncStatus);
  }

  protected fieldErrorMessage(fieldName: keyof typeof this.workshopForm.controls) {
    const control = this.workshopForm.controls[fieldName];

    if (!control.touched || !control.errors) {
      return null;
    }

    if (control.errors['required']) {
      return this.i18nService.translateInstant('adminWorkshops.validation.required');
    }

    if (control.errors['minlength']) {
      return this.i18nService.translateInstant('adminWorkshops.validation.minlength', {
        count: control.errors['minlength'].requiredLength,
      });
    }

    if (control.errors['pattern']) {
      return this.i18nService.translateInstant('adminWorkshops.validation.pattern');
    }

    return this.i18nService.translateInstant('adminWorkshops.validation.invalid');
  }

  private loadWorkshops() {
    this.loading.set(true);

    this.workshopsService
      .getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (workshops) => {
          this.workshops.set(workshops);
          this.loading.set(false);
        },
        error: () => {
          this.errorMessage.set(this.i18nService.translateInstant('adminWorkshops.errors.load'));
          this.loading.set(false);
        },
      });
  }

  private resetForm() {
    this.editingWorkshopId.set(null);
    this.workshopForm.reset({
      title: '',
      slug: '',
      shortDescription: '',
      description: '',
      startAt: '',
      endAt: '',
      location: '',
      recommendedAgeMin: '',
      recommendedAgeMax: '',
      capacity: '',
      isPublished: false,
    });
  }

  private buildPayload(): CreateWorkshopPayload {
    const rawValue = this.workshopForm.getRawValue();
    const slug = rawValue.slug.trim() || this.slugify(rawValue.title);

    return {
      title: rawValue.title.trim(),
      slug,
      shortDescription: rawValue.shortDescription.trim(),
      description: rawValue.description.trim(),
      startAt: new Date(rawValue.startAt).toISOString(),
      endAt: rawValue.endAt ? new Date(rawValue.endAt).toISOString() : null,
      location: rawValue.location.trim(),
      recommendedAgeMin: rawValue.recommendedAgeMin ? Number(rawValue.recommendedAgeMin) : null,
      recommendedAgeMax: rawValue.recommendedAgeMax ? Number(rawValue.recommendedAgeMax) : null,
      capacity: rawValue.capacity ? Number(rawValue.capacity) : null,
      isPublished: rawValue.isPublished,
    };
  }

  private toLocalDateTimeInput(value: string): string {
    const date = new Date(value);
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offset * 60_000);
    return localDate.toISOString().slice(0, 16);
  }

  private getSaveErrorMessage(error: HttpErrorResponse) {
    if (error.status === 409) {
      return this.i18nService.translateInstant('adminWorkshops.errors.slugConflict');
    }

    if (error.status === 400) {
      const backendMessage = error.error?.message;

      if (Array.isArray(backendMessage) && backendMessage.length > 0) {
        return backendMessage.join(' ');
      }

      if (typeof backendMessage === 'string' && backendMessage.trim()) {
        return backendMessage;
      }

      return this.i18nService.translateInstant('adminWorkshops.errors.invalidPayload');
    }

    return this.i18nService.translateInstant('adminWorkshops.errors.save');
  }

  private slugify(value: string) {
    return value
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private toCalendarSyncClass(status: WorkshopCalendarSyncStatus | undefined): string {
    switch (status) {
      case 'SYNCED':
        return 'calendar-sync-pill-success';
      case 'FAILED':
        return 'calendar-sync-pill-danger';
      case 'DISABLED':
        return 'calendar-sync-pill-muted';
      case 'PENDING':
        return 'calendar-sync-pill-pending';
      case 'INACTIVE':
      default:
        return 'calendar-sync-pill-muted';
    }
  }
}
