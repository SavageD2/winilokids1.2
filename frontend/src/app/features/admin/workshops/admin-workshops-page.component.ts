import { DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { AdminWorkshopsService } from '../../../core/services/admin-workshops.service';
import { CreateWorkshopPayload, Workshop } from '../../../shared/models/workshop.model';

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
    slug: ['', [Validators.required, Validators.minLength(3)]],
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
    if (this.workshopForm.invalid) {
      this.workshopForm.markAllAsTouched();
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
        error: () => {
          this.errorMessage.set(
            "Impossible d enregistrer cet atelier. Verifie les champs et reessaie.",
          );
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
    const slug = title
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

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
          this.errorMessage.set("Impossible de supprimer l atelier pour le moment.");
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

    return {
      title: rawValue.title.trim(),
      slug: rawValue.slug.trim(),
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
}
