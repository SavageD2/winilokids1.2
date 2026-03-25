import { DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs';
import { WorkshopsService } from '../../../core/services/workshops.service';
import { Workshop } from '../../../shared/models/workshop.model';

@Component({
  selector: 'app-workshop-detail-page',
  imports: [RouterLink, DatePipe],
  templateUrl: './workshop-detail-page.component.html',
  styleUrl: './workshop-detail-page.component.scss',
})
export class WorkshopDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly workshopsService = inject(WorkshopsService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly workshop = signal<Workshop | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  constructor() {
    this.route.paramMap
      .pipe(
        switchMap((params) => {
          const slug = params.get('slug') ?? '';
          this.loading.set(true);
          this.error.set(null);
          return this.workshopsService.getBySlug(slug);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (workshop) => {
          this.workshop.set(workshop);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Atelier introuvable ou indisponible.');
          this.loading.set(false);
        },
      });
  }

  protected ageLabel(workshop: Workshop): string {
    if (workshop.recommendedAgeMin === null && workshop.recommendedAgeMax === null) {
      return 'Age communique sur demande';
    }

    if (workshop.recommendedAgeMin !== null && workshop.recommendedAgeMax !== null) {
      return `${workshop.recommendedAgeMin} a ${workshop.recommendedAgeMax} ans`;
    }

    if (workshop.recommendedAgeMin !== null) {
      return `A partir de ${workshop.recommendedAgeMin} ans`;
    }

    return `Jusqu a ${workshop.recommendedAgeMax} ans`;
  }
}
