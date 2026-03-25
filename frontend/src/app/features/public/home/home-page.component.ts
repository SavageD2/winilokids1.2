import { DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { WorkshopsService } from '../../../core/services/workshops.service';
import { Workshop } from '../../../shared/models/workshop.model';

@Component({
  selector: 'app-home-page',
  imports: [RouterLink, DatePipe],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss',
})
export class HomePageComponent {
  private readonly workshopsService = inject(WorkshopsService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly featuredWorkshops = signal<Workshop[]>([]);
  protected readonly loading = signal(true);

  constructor() {
    this.workshopsService
      .getPublished()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (workshops) => {
          this.featuredWorkshops.set(workshops.slice(0, 3));
          this.loading.set(false);
        },
        error: () => {
          this.featuredWorkshops.set([]);
          this.loading.set(false);
        },
      });
  }

  protected ageLabel(workshop: Workshop): string {
    if (workshop.recommendedAgeMin === null && workshop.recommendedAgeMax === null) {
      return 'Age libre selon l atelier';
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
