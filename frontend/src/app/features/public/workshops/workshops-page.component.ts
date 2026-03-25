import { DatePipe } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ParentAuthService } from '../../../core/services/parent-auth.service';
import { WorkshopsService } from '../../../core/services/workshops.service';
import { Workshop } from '../../../shared/models/workshop.model';

@Component({
  selector: 'app-workshops-page',
  imports: [RouterLink, DatePipe],
  templateUrl: './workshops-page.component.html',
  styleUrl: './workshops-page.component.scss',
})
export class WorkshopsPageComponent {
  private readonly parentAuthService = inject(ParentAuthService);
  private readonly workshopsService = inject(WorkshopsService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly workshops = signal<Workshop[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly isParentAuthenticated = computed(() => this.parentAuthService.isAuthenticated());

  constructor() {
    this.workshopsService
      .getPublished()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (workshops) => {
          this.workshops.set(workshops);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Impossible de charger les ateliers pour le moment.');
          this.loading.set(false);
        },
      });
  }

  protected ageLabel(workshop: Workshop): string {
    if (workshop.recommendedAgeMin === null && workshop.recommendedAgeMax === null) {
      return 'Age a definir';
    }

    if (workshop.recommendedAgeMin !== null && workshop.recommendedAgeMax !== null) {
      return `${workshop.recommendedAgeMin} a ${workshop.recommendedAgeMax} ans`;
    }

    if (workshop.recommendedAgeMin !== null) {
      return `A partir de ${workshop.recommendedAgeMin} ans`;
    }

    return `Jusqu a ${workshop.recommendedAgeMax} ans`;
  }

  protected reservationLink(workshop: Workshop) {
    return this.isParentAuthenticated() ? '/reservation' : '/inscription';
  }

  protected reservationQueryParams(workshop: Workshop) {
    if (this.isParentAuthenticated()) {
      return { workshopId: workshop.id };
    }

    return { redirectUrl: `/reservation?workshopId=${workshop.id}` };
  }
}
