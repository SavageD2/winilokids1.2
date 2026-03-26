import { TestBed } from '@angular/core/testing';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { AdminFaqService } from '../../../core/services/admin-faq.service';
import { FaqEntry } from '../../../shared/models/faq.model';
import { AdminFaqPageComponent } from './admin-faq-page.component';

describe('AdminFaqPageComponent', () => {
  const entries: FaqEntry[] = [
    {
      id: 1,
      question: 'Comment reserver un atelier pour mon enfant ?',
      answer: 'Il faut d abord se connecter, puis choisir un atelier et confirmer la demande.',
      category: 'Inscription',
      displayOrder: 10,
      isPublished: true,
      createdAt: '2026-03-25T10:00:00.000Z',
      updatedAt: '2026-03-25T10:00:00.000Z',
    },
  ];

  const faqServiceMock = {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  };

  beforeEach(async () => {
    faqServiceMock.getAll.mockReset();
    faqServiceMock.create.mockReset();
    faqServiceMock.update.mockReset();
    faqServiceMock.remove.mockReset();

    await TestBed.configureTestingModule({
      imports: [AdminFaqPageComponent],
      providers: [
        ...provideTranslateService({
          fallbackLang: 'fr',
          lang: 'fr',
        }),
        { provide: AdminFaqService, useValue: faqServiceMock },
      ],
    }).compileComponents();

    const translateService = TestBed.inject(TranslateService);
    translateService.setTranslation(
      'fr',
      {
        adminFaq: {
          success: {
            created: 'Réponse FAQ créée avec succès.',
            updated: 'Réponse FAQ mise à jour avec succès.',
            deleted: 'Réponse FAQ supprimée avec succès.',
          },
          errors: {
            invalidForm: 'Le formulaire FAQ est incomplet ou invalide.',
            load: 'Impossible de charger la FAQ admin.',
            save: "Impossible d'enregistrer cette réponse FAQ pour le moment.",
            delete: 'Impossible de supprimer cette réponse FAQ.',
          },
          delete: {
            confirm: 'Supprimer la question FAQ "{{question}}" ?',
          },
        },
      },
      true,
    );
    translateService.use('fr');
  });

  it('loads entries and filters them from the search field', () => {
    faqServiceMock.getAll.mockReturnValue(of(entries));

    const fixture = TestBed.createComponent(AdminFaqPageComponent);
    const component = fixture.componentInstance as any;

    expect(component.entries()).toEqual(entries);
    component.search.set('reserver');
    expect(component.filteredEntries()).toHaveLength(1);
  });

  it('creates a new FAQ entry with trimmed values and resets the editor', () => {
    faqServiceMock.getAll.mockReturnValue(of(entries));
    faqServiceMock.create.mockReturnValue(
      of({
        ...entries[0],
        id: 2,
      }),
    );

    const fixture = TestBed.createComponent(AdminFaqPageComponent);
    const component = fixture.componentInstance as any;

    component.faqForm.setValue({
      question: '  Comment annuler une reservation ?  ',
      answer:
        '  Une reservation peut etre annulee depuis le compte parent tant que son statut le permet.  ',
      category: '  Compte parent  ',
      displayOrder: 20,
      isPublished: false,
    });

    component.submit();

    expect(faqServiceMock.create).toHaveBeenCalledWith({
      question: 'Comment annuler une reservation ?',
      answer: 'Une reservation peut etre annulee depuis le compte parent tant que son statut le permet.',
      category: 'Compte parent',
      displayOrder: 20,
      isPublished: false,
    });
    expect(component.successMessage()).toBe('Réponse FAQ créée avec succès.');
    expect(component.editingEntryId()).toBeNull();
    expect(component.faqForm.getRawValue()).toEqual({
      question: '',
      answer: '',
      category: '',
      displayOrder: 0,
      isPublished: false,
    });
  });

  it('loads an existing entry into the editor when editing', () => {
    faqServiceMock.getAll.mockReturnValue(of(entries));

    const fixture = TestBed.createComponent(AdminFaqPageComponent);
    const component = fixture.componentInstance as any;

    component.editEntry(entries[0]);

    expect(component.editingEntryId()).toBe(1);
    expect(component.faqForm.getRawValue()).toEqual({
      question: 'Comment reserver un atelier pour mon enfant ?',
      answer: 'Il faut d abord se connecter, puis choisir un atelier et confirmer la demande.',
      category: 'Inscription',
      displayOrder: 10,
      isPublished: true,
    });
  });
});
