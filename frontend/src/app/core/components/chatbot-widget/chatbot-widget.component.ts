import { CommonModule } from '@angular/common';
import {
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { finalize } from 'rxjs';
import { ChatbotService } from '../../services/chatbot.service';
import { I18nService } from '../../services/i18n.service';
import { ChatbotMessageResponse, ChatbotSuggestion } from '../../../shared/models/chatbot.model';

type UiChatMessage = {
  id: number;
  author: 'assistant' | 'user';
  text: string;
  suggestions: ChatbotSuggestion[];
  sourceType?: ChatbotMessageResponse['sourceType'];
};

const INITIAL_ASSISTANT_MESSAGE_ID = 1;

@Component({
  selector: 'app-chatbot-widget',
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './chatbot-widget.component.html',
  styleUrl: './chatbot-widget.component.scss',
})
export class ChatbotWidgetComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly chatbotService = inject(ChatbotService);
  private readonly i18nService = inject(I18nService);
  private readonly router = inject(Router);
  private readonly translateService = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly isOpen = signal(false);
  protected readonly sending = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly messages = signal<UiChatMessage[]>([
    this.buildInitialAssistantMessage(),
  ]);
  protected readonly starterPrompts = computed(() => {
    this.i18nService.language();

    return [
      this.translateService.instant('chatbot.starter.workshop'),
      this.translateService.instant('chatbot.starter.registration'),
      this.translateService.instant('chatbot.starter.contact'),
    ];
  });
  protected readonly lastAssistantMessage = computed(() =>
    [...this.messages()].reverse().find((message) => message.author === 'assistant') ?? null,
  );

  protected readonly messageForm = this.formBuilder.nonNullable.group({
    message: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(1000)]],
  });

  constructor() {
    effect(() => {
      this.i18nService.language();

      const shouldRefreshInitialMessage = untracked(() => {
        const messages = this.messages();

        return (
          messages.length === 1 &&
          messages[0]?.id === INITIAL_ASSISTANT_MESSAGE_ID &&
          messages[0]?.author === 'assistant'
        );
      });

      if (shouldRefreshInitialMessage) {
        this.messages.set([this.buildInitialAssistantMessage()]);
      }
    });
  }

  protected toggleOpen() {
    this.isOpen.update((value) => !value);
  }

  protected close() {
    this.isOpen.set(false);
  }

  protected submit() {
    if (this.messageForm.invalid || this.sending()) {
      this.messageForm.markAllAsTouched();
      return;
    }

    const message = this.messageForm.controls.message.getRawValue().trim();

    this.messages.update((messages) => [
      ...messages,
      {
        id: Date.now(),
        author: 'user',
        text: message,
        suggestions: [],
      },
    ]);
    this.messageForm.reset({ message: '' });
    this.sending.set(true);
    this.error.set(null);

    this.chatbotService
      .sendMessage({
        message,
        context: {
          currentRoute: this.router.url,
        },
      })
      .pipe(
        finalize(() => {
          this.sending.set(false);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (response) => {
          this.messages.update((messages) => [
            ...messages,
            {
              id: Date.now() + 1,
              author: 'assistant',
              text: response.reply,
              suggestions: response.suggestions,
              sourceType: response.sourceType,
            },
          ]);
        },
        error: () => {
          this.error.set(this.translateService.instant('chatbot.error.unavailable'));
        },
      });
  }

  protected useStarterPrompt(prompt: string) {
    this.isOpen.set(true);
    this.messageForm.controls.message.setValue(prompt);
    this.submit();
  }

  protected navigateTo(route: string) {
    void this.router.navigateByUrl(route);
  }

  private buildInitialAssistantMessage(): UiChatMessage {
    this.i18nService.language();

    return {
      id: INITIAL_ASSISTANT_MESSAGE_ID,
      author: 'assistant',
      text: this.translateService.instant('chatbot.initialMessage'),
      suggestions: [
        {
          label: this.translateService.instant('chatbot.suggestion.workshops'),
          route: '/ateliers',
        },
        {
          label: this.translateService.instant('chatbot.suggestion.faq'),
          route: '/faq',
        },
        {
          label: this.translateService.instant('chatbot.suggestion.account'),
          route: '/inscription',
        },
      ],
      sourceType: 'guidance',
    };
  }
}
