import { DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslatePipe } from '@ngx-translate/core';
import { AdminDashboardService } from '../../../core/services/admin-dashboard.service';
import { I18nService } from '../../../core/services/i18n.service';
import { AdminDashboardSummary } from '../../../shared/models/admin-dashboard.model';

@Component({
  selector: 'app-admin-dashboard-page',
  imports: [RouterLink, DatePipe, TranslatePipe],
  templateUrl: './admin-dashboard-page.component.html',
  styleUrl: './admin-dashboard-page.component.scss',
})
export class AdminDashboardPageComponent {
  private readonly dashboardService = inject(AdminDashboardService);
  private readonly i18nService = inject(I18nService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly summary = signal<AdminDashboardSummary | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  constructor() {
    this.dashboardService
      .getSummary()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (summary) => {
          this.summary.set(summary);
          this.loading.set(false);
        },
        error: () => {
          this.error.set(this.i18nService.translateInstant('adminDashboard.error'));
          this.loading.set(false);
        },
      });
  }

  protected remainingPlacesLabel(availablePlaces: number) {
    return `${availablePlaces} ${this.i18nService.translateInstant('adminDashboard.upcoming.remainingPlaces')}`;
  }
}
