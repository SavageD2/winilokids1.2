import { DatePipe } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslatePipe } from '@ngx-translate/core';
import { I18nService } from '../../../core/services/i18n.service';
import { ParentAuthService } from '../../../core/services/parent-auth.service';
import { WorkshopsService } from '../../../core/services/workshops.service';
import { Workshop } from '../../../shared/models/workshop.model';

@Component({
  selector: 'app-workshops-page',
  imports: [RouterLink, DatePipe, TranslatePipe],
  templateUrl: './workshops-page.component.html',
  styleUrl: './workshops-page.component.scss',
})
export class WorkshopsPageComponent {
  private readonly i18nService = inject(I18nService);
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
          this.error.set(
            this.i18nService.translateInstant('workshops.list.error.unavailable'),
          );
          this.loading.set(false);
        },
      });
  }

  protected ageLabel(workshop: Workshop): string {
    if (workshop.recommendedAgeMin === null && workshop.recommendedAgeMax === null) {
      return this.i18nService.translateInstant('workshops.list.age.free');
    }

    if (workshop.recommendedAgeMin !== null && workshop.recommendedAgeMax !== null) {
      return this.i18nService.translateInstant('workshops.list.age.range', {
        min: workshop.recommendedAgeMin,
        max: workshop.recommendedAgeMax,
      });
    }

    if (workshop.recommendedAgeMin !== null) {
      return this.i18nService.translateInstant('workshops.list.age.min', {
        min: workshop.recommendedAgeMin,
      });
    }

    return this.i18nService.translateInstant('workshops.list.age.max', {
      max: workshop.recommendedAgeMax,
    });
  }

  protected availabilityLabel(workshop: Workshop) {
    if (workshop.availablePlaces === null) {
      return this.i18nService.translateInstant('workshops.list.availability.onRequest');
    }

    return `${workshop.availablePlaces} ${this.i18nService.translateInstant('workshops.list.availability.remaining')}`;
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
