import { TestBed } from '@angular/core/testing';
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
      providers: [{ provide: AdminFaqService, useValue: faqServiceMock }],
    }).compileComponents();
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
    expect(component.successMessage()).toBe('Reponse FAQ creee avec succes.');
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
