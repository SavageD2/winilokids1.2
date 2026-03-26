import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { ChatbotService } from '../../services/chatbot.service';
import { ChatbotMessageResponse } from '../../../shared/models/chatbot.model';
import { ChatbotWidgetComponent } from './chatbot-widget.component';

describe('ChatbotWidgetComponent', () => {
  const routerMock = {
    url: '/faq',
    navigateByUrl: vi.fn().mockResolvedValue(true),
  };

  const chatbotServiceMock = {
    sendMessage: vi.fn(),
  };

  beforeEach(async () => {
    routerMock.navigateByUrl.mockClear();
    chatbotServiceMock.sendMessage.mockReset();

    await TestBed.configureTestingModule({
      imports: [ChatbotWidgetComponent],
      providers: [
        { provide: ChatbotService, useValue: chatbotServiceMock },
        { provide: Router, useValue: routerMock },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('adds the assistant reply after a successful message send', () => {
    const response$ = new Subject<ChatbotMessageResponse>();
    chatbotServiceMock.sendMessage.mockReturnValue(response$.asObservable());

    const fixture = TestBed.createComponent(ChatbotWidgetComponent);
    const component = fixture.componentInstance as any;

    component.messageForm.setValue({ message: 'Je cherche un atelier pour 6 ans' });
    component.submit();

    expect(chatbotServiceMock.sendMessage).toHaveBeenCalledWith({
      message: 'Je cherche un atelier pour 6 ans',
      context: {
        currentRoute: '/faq',
      },
    });
    expect(component.sending()).toBe(true);
    expect(component.messages()).toHaveLength(2);
    expect(component.messages().at(-1)?.author).toBe('user');

    response$.next({
      reply: 'Je te conseille de regarder nos ateliers 5-7 ans.',
      sourceType: 'workshop',
      suggestions: [{ label: 'Voir les ateliers', route: '/ateliers' }],
      matchedFaqIds: [],
      matchedWorkshopIds: [2],
      fallbackToContact: false,
    });
    response$.complete();

    expect(component.sending()).toBe(false);
    expect(component.error()).toBeNull();
    expect(component.messageForm.controls.message.value).toBe('');
    expect(component.messages()).toHaveLength(3);
    expect(component.messages().at(-1)).toMatchObject({
      author: 'assistant',
      text: 'Je te conseille de regarder nos ateliers 5-7 ans.',
      sourceType: 'workshop',
    });
  });

  it('shows a fallback error when the chatbot request fails', () => {
    chatbotServiceMock.sendMessage.mockReturnValue(
      throwError(() => new Error('network')),
    );

    const fixture = TestBed.createComponent(ChatbotWidgetComponent);
    const component = fixture.componentInstance as any;

    component.messageForm.setValue({ message: 'Comment faire une inscription ?' });
    component.submit();

    expect(component.sending()).toBe(false);
    expect(component.error()).toContain("Impossible d'obtenir une reponse");
    expect(component.messages()).toHaveLength(2);
    expect(component.messages().at(-1)?.author).toBe('user');
  });

  it('uses a starter prompt to open the widget and send a message', () => {
    chatbotServiceMock.sendMessage.mockReturnValue(
      of({
        reply: 'Tu peux demarrer depuis la page inscription.',
        sourceType: 'guidance',
        suggestions: [{ label: 'Inscription / Connexion', route: '/inscription' }],
        matchedFaqIds: [],
        matchedWorkshopIds: [],
        fallbackToContact: false,
      }),
    );

    const fixture = TestBed.createComponent(ChatbotWidgetComponent);
    const component = fixture.componentInstance as any;

    component.useStarterPrompt("Comment se passe l'inscription ?");

    expect(component.isOpen()).toBe(true);
    expect(chatbotServiceMock.sendMessage).toHaveBeenCalledOnce();
    expect(component.messages().at(-1)).toMatchObject({
      author: 'assistant',
      text: 'Tu peux demarrer depuis la page inscription.',
    });
  });

  it('navigates when a suggestion is selected', () => {
    const fixture = TestBed.createComponent(ChatbotWidgetComponent);
    const component = fixture.componentInstance as any;

    component.navigateTo('/ateliers');

    expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/ateliers');
  });
});
