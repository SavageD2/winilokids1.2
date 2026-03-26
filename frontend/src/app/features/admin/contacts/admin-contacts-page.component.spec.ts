import { TestBed } from '@angular/core/testing';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { AdminContactsService } from '../../../core/services/admin-contacts.service';
import { AdminContactsPageComponent } from './admin-contacts-page.component';
import { ContactRecord } from '../../../shared/models/contact.model';

describe('AdminContactsPageComponent', () => {
  const contacts: ContactRecord[] = [
    {
      id: 1,
      name: 'Camille Martin',
      email: 'camille@example.com',
      phone: '0611223344',
      message: 'Bonjour, je veux confirmer un besoin specifique.',
      status: 'NEW',
      adminNotes: null,
      handledAt: null,
      createdAt: '2026-03-25T10:00:00.000Z',
      updatedAt: '2026-03-25T10:00:00.000Z',
    },
  ];

  const contactsServiceMock = {
    getAll: vi.fn(),
    update: vi.fn(),
    getStatuses: vi.fn().mockReturnValue(['NEW', 'IN_PROGRESS', 'RESOLVED', 'ARCHIVED']),
  };

  beforeEach(async () => {
    contactsServiceMock.getAll.mockReset();
    contactsServiceMock.update.mockReset();

    await TestBed.configureTestingModule({
      imports: [AdminContactsPageComponent],
      providers: [
        ...provideTranslateService({
          fallbackLang: 'fr',
          lang: 'fr',
        }),
        { provide: AdminContactsService, useValue: contactsServiceMock },
      ],
    }).compileComponents();

    const translateService = TestBed.inject(TranslateService);
    translateService.setTranslation(
      'fr',
      {
        adminContacts: {
          status: {
            new: 'Nouveau',
            inProgress: 'En cours',
            resolved: 'Traité',
            archived: 'Archivé',
          },
          summary: {
            total: '{{count}} message(s) trouvé(s)',
            page: 'page {{page}} / {{totalPages}}',
          },
          success: {
            statusUpdated: 'Statut du message mis à jour.',
            noteSaved: 'Note interne enregistrée.',
          },
          errors: {
            load: 'Impossible de charger les messages de contact.',
            updateStatus: 'Impossible de mettre à jour ce message pour le moment.',
            saveNote: "Impossible d'enregistrer la note interne.",
          },
        },
      },
      true,
    );
    translateService.use('fr');
  });

  it('loads contacts with the default filters', () => {
    contactsServiceMock.getAll.mockReturnValue(
      of({
        items: contacts,
        total: 1,
        page: 1,
        pageSize: 8,
        totalPages: 1,
      }),
    );

    const fixture = TestBed.createComponent(AdminContactsPageComponent);
    const component = fixture.componentInstance as any;

    expect(contactsServiceMock.getAll).toHaveBeenCalledWith({
      page: 1,
      pageSize: 8,
      search: undefined,
      status: undefined,
    });
    expect(component.contacts()).toEqual(contacts);
    expect(component.draftNotes()).toEqual({ 1: '' });
    expect(component.loading()).toBe(false);
  });

  it('updates the contact status and refreshes the local item', () => {
    contactsServiceMock.getAll.mockReturnValue(
      of({
        items: contacts,
        total: 1,
        page: 1,
        pageSize: 8,
        totalPages: 1,
      }),
    );
    contactsServiceMock.update.mockReturnValue(
      of({
        ...contacts[0],
        status: 'IN_PROGRESS',
        handledAt: '2026-03-26T09:00:00.000Z',
      }),
    );

    const fixture = TestBed.createComponent(AdminContactsPageComponent);
    const component = fixture.componentInstance as any;

    component.updateStatus(contacts[0], 'IN_PROGRESS');

    expect(contactsServiceMock.update).toHaveBeenCalledWith(1, { status: 'IN_PROGRESS' });
    expect(component.contacts()[0]).toMatchObject({
      status: 'IN_PROGRESS',
      handledAt: '2026-03-26T09:00:00.000Z',
    });
    expect(component.successMessage()).toBe('Statut du message mis à jour.');
  });

  it('trims and saves internal notes', () => {
    contactsServiceMock.getAll.mockReturnValue(
      of({
        items: contacts,
        total: 1,
        page: 1,
        pageSize: 8,
        totalPages: 1,
      }),
    );
    contactsServiceMock.update.mockReturnValue(
      of({
        ...contacts[0],
        adminNotes: 'Parent rappele, dossier a suivre.',
      }),
    );

    const fixture = TestBed.createComponent(AdminContactsPageComponent);
    const component = fixture.componentInstance as any;

    component.draftNotes.set({ 1: '  Parent rappele, dossier a suivre.  ' });
    component.saveNotes(contacts[0]);

    expect(contactsServiceMock.update).toHaveBeenCalledWith(1, {
      adminNotes: 'Parent rappele, dossier a suivre.',
    });
    expect(component.draftNotes()[1]).toBe('Parent rappele, dossier a suivre.');
    expect(component.successMessage()).toBe('Note interne enregistrée.');
  });
});
