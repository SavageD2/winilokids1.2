import { DatePipe } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslatePipe } from '@ngx-translate/core';
import { debounceTime, distinctUntilChanged, map } from 'rxjs';
import { AdminRegistrationsService } from '../../../core/services/admin-registrations.service';
import { AdminWorkshopsService } from '../../../core/services/admin-workshops.service';
import { I18nService } from '../../../core/services/i18n.service';
import { RegistrationRecord, RegistrationStatus } from '../../../shared/models/registration.model';
import { Workshop } from '../../../shared/models/workshop.model';

type RegistrationGroup = {
  workshop: RegistrationRecord['workshop'];
  registrations: RegistrationRecord[];
};

@Component({
  selector: 'app-admin-registrations-page',
  imports: [ReactiveFormsModule, DatePipe, TranslatePipe],
  templateUrl: './admin-registrations-page.component.html',
  styleUrl: './admin-registrations-page.component.scss',
})
export class AdminRegistrationsPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly i18nService = inject(I18nService);
  private readonly workshopsService = inject(AdminWorkshopsService);
  private readonly registrationsService = inject(AdminRegistrationsService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly registrations = signal<RegistrationRecord[]>([]);
  protected readonly groups = computed<RegistrationGroup[]>(() => {
    const byWorkshop = new Map<number, RegistrationGroup>();

    for (const registration of this.registrations()) {
      const currentGroup = byWorkshop.get(registration.workshop.id);

      if (currentGroup) {
        currentGroup.registrations.push(registration);
        continue;
      }

      byWorkshop.set(registration.workshop.id, {
        workshop: registration.workshop,
        registrations: [registration],
      });
    }

    return Array.from(byWorkshop.values());
  });
  protected readonly workshops = signal<Workshop[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly updatingRegistrationId = signal<number | null>(null);
  protected readonly page = signal(1);
  protected readonly pageSize = 10;
  protected readonly total = signal(0);
  protected readonly totalPages = signal(0);
  protected readonly statuses = this.registrationsService.getStatuses();
  protected readonly hasPreviousPage = computed(() => this.page() > 1);
  protected readonly hasNextPage = computed(() => this.page() < this.totalPages());

  protected readonly filtersForm = this.formBuilder.nonNullable.group({
    search: [''],
    status: ['ALL'],
    workshopId: ['ALL'],
  });

  constructor() {
    this.loadWorkshops();
    this.loadRegistrations();

    this.filtersForm.valueChanges
      .pipe(
        debounceTime(250),
        map((value) => JSON.stringify(value)),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.page.set(1);
        this.loadRegistrations();
      });
  }

  protected updateStatus(registration: RegistrationRecord, status: string) {
    const nextStatus = status as RegistrationStatus;

    if (registration.status === nextStatus) {
      return;
    }

    this.updatingRegistrationId.set(registration.id);

    this.registrationsService
      .updateStatus(registration.id, { status: nextStatus })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updatedRegistration) => {
          this.registrations.update((registrations) =>
            registrations.map((item) =>
              item.id === updatedRegistration.id ? updatedRegistration : item,
            ),
          );
          this.updatingRegistrationId.set(null);
        },
        error: () => {
          this.error.set(
            this.i18nService.translateInstant('adminRegistrations.errors.updateStatus'),
          );
          this.updatingRegistrationId.set(null);
        },
      });
  }

  protected changePage(nextPage: number) {
    if (nextPage < 1 || nextPage > this.totalPages()) {
      return;
    }

    this.page.set(nextPage);
    this.loadRegistrations();
  }

  protected statusLabel(status: RegistrationStatus): string {
    switch (status) {
      case 'PENDING':
        return this.i18nService.translateInstant('adminRegistrations.status.pending');
      case 'CONFIRMED':
        return this.i18nService.translateInstant('adminRegistrations.status.confirmed');
      case 'CANCELLED':
        return this.i18nService.translateInstant('adminRegistrations.status.cancelled');
      case 'ATTENDED':
        return this.i18nService.translateInstant('adminRegistrations.status.attended');
    }
  }

  protected summaryLabel(count: number) {
    return this.i18nService.translateInstant('adminRegistrations.summary.total', { count });
  }

  protected pageSummaryLabel() {
    return this.i18nService.translateInstant('adminRegistrations.summary.page', {
      page: this.page(),
      totalPages: this.totalPages(),
    });
  }

  protected registrationsCountLabel(count: number) {
    return this.i18nService.translateInstant('adminRegistrations.group.count', { count });
  }

  protected childSummary(registration: RegistrationRecord) {
    return this.i18nService.translateInstant('adminRegistrations.registration.child', {
      childFirstName: registration.childFirstName,
      childAge: registration.childAge,
    });
  }

  protected phoneSummary(phone: string) {
    return this.i18nService.translateInstant('adminRegistrations.registration.phone', { phone });
  }

  private loadWorkshops() {
    this.workshopsService
      .getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (workshops) => {
          this.workshops.set(workshops);
        },
        error: () => {
          this.error.set(this.i18nService.translateInstant('adminRegistrations.errors.workshops'));
        },
      });
  }

  private loadRegistrations() {
    this.loading.set(true);
    this.error.set(null);
    const { search, status, workshopId } = this.filtersForm.getRawValue();

    this.registrationsService
      .getAll({
        page: this.page(),
        pageSize: this.pageSize,
        search: search.trim() || undefined,
        status: status === 'ALL' ? undefined : (status as RegistrationStatus),
        workshopId: workshopId === 'ALL' ? undefined : Number(workshopId),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.registrations.set(response.items);
          this.total.set(response.total);
          this.totalPages.set(response.totalPages);
          this.loading.set(false);
        },
        error: () => {
          this.error.set(this.i18nService.translateInstant('adminRegistrations.errors.load'));
          this.loading.set(false);
        },
      });
  }
}
