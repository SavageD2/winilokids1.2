import { DatePipe } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AdminContactsService } from '../../../core/services/admin-contacts.service';
import { ContactRecord } from '../../../shared/models/contact.model';

@Component({
  selector: 'app-admin-contacts-page',
  imports: [DatePipe],
  templateUrl: './admin-contacts-page.component.html',
  styleUrl: './admin-contacts-page.component.scss',
})
export class AdminContactsPageComponent {
  private readonly contactsService = inject(AdminContactsService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly contacts = signal<ContactRecord[]>([]);
  protected readonly search = signal('');
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly filteredContacts = computed(() => {
    const query = this.search().trim().toLowerCase();

    if (!query) {
      return this.contacts();
    }

    return this.contacts().filter((contact) => {
      const haystack = [contact.name, contact.email, contact.phone ?? '', contact.message]
        .join(' ')
        .toLowerCase();

      return haystack.includes(query);
    });
  });

  constructor() {
    this.contactsService
      .getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (contacts) => {
          this.contacts.set(contacts);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Impossible de charger les messages de contact.');
          this.loading.set(false);
        },
      });
  }

  protected updateSearch(event: Event) {
    const input = event.target as HTMLInputElement;
    this.search.set(input.value);
  }

  protected phoneHref(phone: string) {
    return `tel:${phone.replace(/\s+/g, '')}`;
  }
}
