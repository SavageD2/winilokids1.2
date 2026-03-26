import { TestBed } from '@angular/core/testing';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { AdminChatbotService } from '../../../core/services/admin-chatbot.service';
import { AdminChatbotSummary, ChatbotLogRecord } from '../../../shared/models/chatbot.model';
import { AdminChatbotPageComponent } from './admin-chatbot-page.component';

describe('AdminChatbotPageComponent', () => {
  const summary: AdminChatbotSummary = {
    totalMessages: 24,
    fallbackMessages: 4,
    faqMessages: 10,
    workshopMessages: 7,
    guidanceMessages: 3,
    recentMessages: [],
  };

  const logs: ChatbotLogRecord[] = [
    {
      id: 1,
      message: 'Je cherche un atelier pour 6 ans',
      normalizedMessage: 'je cherche un atelier pour 6 ans',
      currentRoute: '/ateliers',
      sourceType: 'WORKSHOP',
      fallbackToContact: false,
      matchedFaqIds: [],
      matchedWorkshopIds: [4],
      reply: 'Je peux te proposer les ateliers sensoriels du mercredi.',
      createdAt: '2026-03-25T10:00:00.000Z',
    },
  ];

  const chatbotServiceMock = {
    getSummary: vi.fn(),
    getLogs: vi.fn(),
  };

  beforeEach(async () => {
    chatbotServiceMock.getSummary.mockReset();
    chatbotServiceMock.getLogs.mockReset();

    await TestBed.configureTestingModule({
      imports: [AdminChatbotPageComponent],
      providers: [
        ...provideTranslateService({
          fallbackLang: 'fr',
          lang: 'fr',
        }),
        { provide: AdminChatbotService, useValue: chatbotServiceMock },
      ],
    }).compileComponents();

    const translateService = TestBed.inject(TranslateService);
    translateService.setTranslation(
      'fr',
      {
        adminChatbot: {
          source: {
            faq: 'FAQ',
            workshop: 'Atelier',
            guidance: 'Guidage',
            fallback: 'Fallback',
          },
          summary: {
            total: '{{count}} message(s) trouvé(s)',
            page: 'page {{page}} / {{totalPages}}',
          },
          errors: {
            summary: 'Impossible de charger le résumé du chatbot.',
            logs: 'Impossible de charger les messages du chatbot.',
          },
        },
      },
      true,
    );
    translateService.use('fr');
  });

  it('loads summary and logs with the default filters', () => {
    chatbotServiceMock.getSummary.mockReturnValue(of(summary));
    chatbotServiceMock.getLogs.mockReturnValue(
      of({
        items: logs,
        total: 1,
        page: 1,
        pageSize: 10,
        totalPages: 1,
      }),
    );

    const fixture = TestBed.createComponent(AdminChatbotPageComponent);
    const component = fixture.componentInstance as any;

    expect(chatbotServiceMock.getSummary).toHaveBeenCalledOnce();
    expect(chatbotServiceMock.getLogs).toHaveBeenCalledWith({
      page: 1,
      pageSize: 10,
      search: undefined,
      sourceType: undefined,
      fallbackToContact: undefined,
    });
    expect(component.summary()).toEqual(summary);
    expect(component.logs()).toEqual(logs);
    expect(component.loading()).toBe(false);
  });

  it('translates the source and summary labels through i18n', () => {
    chatbotServiceMock.getSummary.mockReturnValue(of(summary));
    chatbotServiceMock.getLogs.mockReturnValue(
      of({
        items: logs,
        total: 11,
        page: 1,
        pageSize: 10,
        totalPages: 2,
      }),
    );

    const fixture = TestBed.createComponent(AdminChatbotPageComponent);
    const component = fixture.componentInstance as any;

    expect(component.sourceLabel('GUIDANCE')).toBe('Guidage');
    expect(component.summaryLabel(11)).toBe('11 message(s) trouvé(s)');
    expect(component.pageSummaryLabel()).toBe('page 1 / 2');
  });
});
