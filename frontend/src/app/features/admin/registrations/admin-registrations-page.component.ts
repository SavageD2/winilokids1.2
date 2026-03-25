import { DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin, of, switchMap } from 'rxjs';
import { AdminRegistrationsService } from '../../../core/services/admin-registrations.service';
import { AdminWorkshopsService } from '../../../core/services/admin-workshops.service';
import { RegistrationRecord, RegistrationStatus } from '../../../shared/models/registration.model';
import { Workshop } from '../../../shared/models/workshop.model';

type RegistrationGroup = {
  workshop: Workshop;
  registrations: RegistrationRecord[];
};

@Component({
  selector: 'app-admin-registrations-page',
  imports: [ReactiveFormsModule, DatePipe],
  templateUrl: './admin-registrations-page.component.html',
  styleUrl: './admin-registrations-page.component.scss',
})
export class AdminRegistrationsPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly workshopsService = inject(AdminWorkshopsService);
  private readonly registrationsService = inject(AdminRegistrationsService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly groups = signal<RegistrationGroup[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly updatingRegistrationId = signal<number | null>(null);
  protected readonly statuses = this.registrationsService.getStatuses();

  protected readonly filtersForm = this.formBuilder.nonNullable.group({
    search: [''],
    status: ['ALL'],
  });

  constructor() {
    this.loadGroups();
  }

  protected visibleRegistrations(group: RegistrationGroup) {
    const { search, status } = this.filtersForm.getRawValue();
    const normalizedSearch = search.trim().toLowerCase();

    return group.registrations.filter((registration) => {
      const matchesStatus = status === 'ALL' || registration.status === status;
      const matchesSearch =
        normalizedSearch.length === 0 ||
        registration.parentName.toLowerCase().includes(normalizedSearch) ||
        registration.parentEmail.toLowerCase().includes(normalizedSearch) ||
        registration.childFirstName.toLowerCase().includes(normalizedSearch);

      return matchesStatus && matchesSearch;
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
          this.groups.update((groups) =>
            groups.map((group) => ({
              ...group,
              registrations: group.registrations.map((item) =>
                item.id === updatedRegistration.id ? updatedRegistration : item,
              ),
            })),
          );
          this.updatingRegistrationId.set(null);
        },
        error: () => {
          this.error.set("Impossible de mettre a jour le statut pour le moment.");
          this.updatingRegistrationId.set(null);
        },
      });
  }

  protected totalVisible(group: RegistrationGroup) {
    return this.visibleRegistrations(group).length;
  }

  protected statusLabel(status: RegistrationStatus): string {
    switch (status) {
      case 'PENDING':
        return 'En attente';
      case 'CONFIRMED':
        return 'Confirmee';
      case 'CANCELLED':
        return 'Annulee';
      case 'ATTENDED':
        return 'Presente';
    }
  }

  private loadGroups() {
    this.loading.set(true);
    this.error.set(null);

    this.workshopsService
      .getAll()
      .pipe(
        switchMap((workshops) => {
          if (workshops.length === 0) {
            return of([] as RegistrationGroup[]);
          }

          return forkJoin(
            workshops.map((workshop) =>
              this.registrationsService.getByWorkshop(workshop.id).pipe(
                switchMap((registrations) =>
                  of({
                    workshop,
                    registrations,
                  }),
                ),
              ),
            ),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (groups) => {
          this.groups.set(groups);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Impossible de charger les inscriptions.');
          this.loading.set(false);
        },
      });
  }
}
