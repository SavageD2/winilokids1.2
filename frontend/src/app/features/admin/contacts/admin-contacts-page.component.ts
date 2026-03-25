import { DatePipe } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, map } from 'rxjs';
import { AdminContactsService } from '../../../core/services/admin-contacts.service';
import { ContactRecord } from '../../../shared/models/contact.model';

@Component({
  selector: 'app-admin-contacts-page',
  imports: [DatePipe, ReactiveFormsModule],
  templateUrl: './admin-contacts-page.component.html',
  styleUrl: './admin-contacts-page.component.scss',
})
export class AdminContactsPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly contactsService = inject(AdminContactsService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly contacts = signal<ContactRecord[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly page = signal(1);
  protected readonly pageSize = 8;
  protected readonly total = signal(0);
  protected readonly totalPages = signal(0);
  protected readonly hasPreviousPage = computed(() => this.page() > 1);
  protected readonly hasNextPage = computed(() => this.page() < this.totalPages());
  protected readonly filtersForm = this.formBuilder.nonNullable.group({
    search: [''],
  });

  constructor() {
    this.loadContacts();

    this.filtersForm.valueChanges
      .pipe(
        debounceTime(250),
        map((value) => JSON.stringify(value)),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.page.set(1);
          this.loadContacts();
        },
      });
  }

  protected phoneHref(phone: string) {
    return `tel:${phone.replace(/\s+/g, '')}`;
  }

  protected changePage(nextPage: number) {
    if (nextPage < 1 || nextPage > this.totalPages()) {
      return;
    }

    this.page.set(nextPage);
    this.loadContacts();
  }

  private loadContacts() {
    this.loading.set(true);
    this.error.set(null);

    this.contactsService
      .getAll({
        page: this.page(),
        pageSize: this.pageSize,
        search: this.filtersForm.controls.search.getRawValue().trim() || undefined,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.contacts.set(response.items);
          this.total.set(response.total);
          this.totalPages.set(response.totalPages);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Impossible de charger les messages de contact.');
          this.loading.set(false);
        },
      });
  }
}
