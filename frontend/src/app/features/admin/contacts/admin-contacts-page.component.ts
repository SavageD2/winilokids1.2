import { DatePipe } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, map } from 'rxjs';
import { AdminContactsService } from '../../../core/services/admin-contacts.service';
import { ContactRecord, ContactStatus } from '../../../shared/models/contact.model';

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
  protected readonly successMessage = signal<string | null>(null);
  protected readonly page = signal(1);
  protected readonly pageSize = 8;
  protected readonly total = signal(0);
  protected readonly totalPages = signal(0);
  protected readonly updatingContactId = signal<number | null>(null);
  protected readonly contactStatuses = this.contactsService.getStatuses();
  protected readonly draftNotes = signal<Record<number, string>>({});
  protected readonly hasPreviousPage = computed(() => this.page() > 1);
  protected readonly hasNextPage = computed(() => this.page() < this.totalPages());
  protected readonly filtersForm = this.formBuilder.nonNullable.group({
    search: [''],
    status: ['ALL'],
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

  protected statusLabel(status: ContactStatus): string {
    switch (status) {
      case 'NEW':
        return 'Nouveau';
      case 'IN_PROGRESS':
        return 'En cours';
      case 'RESOLVED':
        return 'Traite';
      case 'ARCHIVED':
        return 'Archive';
    }
  }

  protected updateStatus(contact: ContactRecord, status: string) {
    const nextStatus = status as ContactStatus;

    if (contact.status === nextStatus) {
      return;
    }

    this.updatingContactId.set(contact.id);
    this.error.set(null);
    this.successMessage.set(null);

    this.contactsService
      .update(contact.id, { status: nextStatus })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updatedContact) => {
          this.replaceContact(updatedContact);
          this.updatingContactId.set(null);
          this.successMessage.set('Statut du message mis a jour.');
        },
        error: () => {
          this.error.set("Impossible de mettre a jour ce message pour le moment.");
          this.updatingContactId.set(null);
        },
      });
  }

  protected updateNotesDraft(contactId: number, event: Event) {
    const textarea = event.target as HTMLTextAreaElement;
    this.draftNotes.update((drafts) => ({
      ...drafts,
      [contactId]: textarea.value,
    }));
  }

  protected saveNotes(contact: ContactRecord) {
    this.updatingContactId.set(contact.id);
    this.error.set(null);
    this.successMessage.set(null);

    this.contactsService
      .update(contact.id, {
        adminNotes: (this.draftNotes()[contact.id] ?? '').trim() || null,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updatedContact) => {
          this.replaceContact(updatedContact);
          this.updatingContactId.set(null);
          this.successMessage.set('Note interne enregistree.');
        },
        error: () => {
          this.error.set("Impossible d enregistrer la note interne.");
          this.updatingContactId.set(null);
        },
      });
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
        status:
          this.filtersForm.controls.status.getRawValue() === 'ALL'
            ? undefined
            : (this.filtersForm.controls.status.getRawValue() as ContactStatus),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.contacts.set(response.items);
          this.syncDraftNotes(response.items);
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

  private replaceContact(updatedContact: ContactRecord) {
    this.contacts.update((contacts) =>
      contacts.map((contact) => (contact.id === updatedContact.id ? updatedContact : contact)),
    );
    this.draftNotes.update((drafts) => ({
      ...drafts,
      [updatedContact.id]: updatedContact.adminNotes ?? '',
    }));
  }

  private syncDraftNotes(contacts: ContactRecord[]) {
    this.draftNotes.set(
      contacts.reduce<Record<number, string>>((drafts, contact) => {
        drafts[contact.id] = contact.adminNotes ?? '';
        return drafts;
      }, {}),
    );
  }
}
