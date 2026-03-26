import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { AdminWorkshopsService } from '../../../core/services/admin-workshops.service';
import {
  CreateWorkshopPayload,
  Workshop,
  WorkshopCalendarSyncStatus,
} from '../../../shared/models/workshop.model';

@Component({
  selector: 'app-admin-workshops-page',
  imports: [ReactiveFormsModule, DatePipe],
  templateUrl: './admin-workshops-page.component.html',
  styleUrl: './admin-workshops-page.component.scss',
})
export class AdminWorkshopsPageComponent {
  private readonly formBuilder = inject(FormBuilder);
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
    if (!this.workshopForm.controls.slug.getRawValue().trim()) {
      this.generateSlug();
    }

    if (this.workshopForm.invalid) {
      this.workshopForm.markAllAsTouched();
      this.errorMessage.set(
        'Certains champs sont incomplets ou invalides. Verifie les messages sous le formulaire.',
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
            workshopId ? 'Atelier mis a jour avec succes.' : 'Atelier cree avec succes.',
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
    const confirmed = confirm(`Supprimer l atelier "${workshop.title}" ?`);

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
          this.successMessage.set('Atelier supprime avec succes.');
          if (this.editingWorkshopId() === workshop.id) {
            this.resetForm();
          }
          this.loadWorkshops();
        },
        error: () => {
          this.errorMessage.set('Impossible de supprimer l atelier pour le moment.');
        },
      });
  }

  protected ageLabel(workshop: Workshop): string {
    if (workshop.recommendedAgeMin === null && workshop.recommendedAgeMax === null) {
      return 'Age non precise';
    }

    if (workshop.recommendedAgeMin !== null && workshop.recommendedAgeMax !== null) {
      return `${workshop.recommendedAgeMin} a ${workshop.recommendedAgeMax} ans`;
    }

    if (workshop.recommendedAgeMin !== null) {
      return `A partir de ${workshop.recommendedAgeMin} ans`;
    }

    return `Jusqu a ${workshop.recommendedAgeMax} ans`;
  }

  protected calendarSyncLabel(workshop: Workshop) {
    switch (workshop.googleCalendarSyncStatus) {
      case 'SYNCED':
        return 'Google Calendar synchronise';
      case 'FAILED':
        return 'Google Calendar en erreur';
      case 'DISABLED':
        return 'Google Calendar non configure';
      case 'PENDING':
        return 'Google Calendar en attente';
      case 'INACTIVE':
      default:
        return 'Google Calendar inactif';
    }
  }

  protected calendarSyncDetail(workshop: Workshop) {
    if (workshop.googleCalendarSyncStatus === 'FAILED') {
      return (
        workshop.googleCalendarSyncError ??
        'La synchronisation a echoue. Verifie la configuration backend.'
      );
    }

    if (workshop.googleCalendarSyncStatus === 'SYNCED' && workshop.googleCalendarSyncedAt) {
      return `Derniere sync: ${new Date(workshop.googleCalendarSyncedAt).toLocaleString('fr-FR')}`;
    }

    if (workshop.googleCalendarSyncStatus === 'DISABLED') {
      return 'Renseigne GOOGLE_CALENDAR_ID et le compte de service Google cote backend pour activer la sync.';
    }

    if (workshop.googleCalendarSyncStatus === 'INACTIVE') {
      return 'La synchronisation ne demarre que pour les ateliers publies.';
    }

    return 'La publication de cet atelier declenche la creation ou mise a jour de l evenement.';
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
      return 'Ce champ est obligatoire.';
    }

    if (control.errors['minlength']) {
      return `Minimum ${control.errors['minlength'].requiredLength} caracteres.`;
    }

    if (control.errors['pattern']) {
      return 'Utilise seulement des lettres minuscules, chiffres et tirets.';
    }

    return 'Valeur invalide.';
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
          this.errorMessage.set('Impossible de charger les ateliers.');
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
      return 'Un atelier avec ce slug existe deja. Modifie le titre ou le slug puis reessaie.';
    }

    if (error.status === 400) {
      const backendMessage = error.error?.message;

      if (Array.isArray(backendMessage) && backendMessage.length > 0) {
        return backendMessage.join(' ');
      }

      if (typeof backendMessage === 'string' && backendMessage.trim()) {
        return backendMessage;
      }

      return 'Les donnees envoyees sont invalides. Verifie le slug, les dates et les champs numeriques.';
    }

    return 'Impossible d enregistrer cet atelier pour le moment. Reessaie dans quelques instants.';
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
