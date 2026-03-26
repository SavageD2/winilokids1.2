import { DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslatePipe } from '@ngx-translate/core';
import { I18nService } from '../../../core/services/i18n.service';
import { WorkshopsService } from '../../../core/services/workshops.service';
import { Workshop } from '../../../shared/models/workshop.model';

@Component({
  selector: 'app-home-page',
  imports: [RouterLink, DatePipe, TranslatePipe],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss',
})
export class HomePageComponent {
  private readonly i18nService = inject(I18nService);
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
      return this.i18nService.translateInstant('home.spotlight.age.free');
    }

    if (workshop.recommendedAgeMin !== null && workshop.recommendedAgeMax !== null) {
      return this.i18nService.translateInstant('home.spotlight.age.range', {
        min: workshop.recommendedAgeMin,
        max: workshop.recommendedAgeMax,
      });
    }

    if (workshop.recommendedAgeMin !== null) {
      return this.i18nService.translateInstant('home.spotlight.age.min', {
        min: workshop.recommendedAgeMin,
      });
    }

    return this.i18nService.translateInstant('home.spotlight.age.max', {
      max: workshop.recommendedAgeMax,
    });
  }

  protected availablePlacesLabel(availablePlaces: number) {
    return `${availablePlaces} ${this.i18nService.translateInstant('home.spotlight.remainingPlaces')}`;
  }
}
