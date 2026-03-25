import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { ChatbotService } from '../../services/chatbot.service';
import { ChatbotMessageResponse, ChatbotSuggestion } from '../../../shared/models/chatbot.model';

type UiChatMessage = {
  id: number;
  author: 'assistant' | 'user';
  text: string;
  suggestions: ChatbotSuggestion[];
  sourceType?: ChatbotMessageResponse['sourceType'];
};

@Component({
  selector: 'app-chatbot-widget',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './chatbot-widget.component.html',
  styleUrl: './chatbot-widget.component.scss',
})
export class ChatbotWidgetComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly chatbotService = inject(ChatbotService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly isOpen = signal(false);
  protected readonly sending = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly messages = signal<UiChatMessage[]>([
    {
      id: 1,
      author: 'assistant',
      text: "Je peux aider a choisir un atelier, expliquer l'inscription et repondre aux questions frequentes.",
      suggestions: [
        { label: 'Voir les ateliers', route: '/ateliers' },
        { label: 'Consulter la FAQ', route: '/faq' },
        { label: 'Inscription / Connexion', route: '/inscription' },
      ],
      sourceType: 'guidance',
    },
  ]);
  protected readonly starterPrompts = [
    'Je cherche un atelier pour 5 ans',
    "Comment se passe l'inscription ?",
    'Quand faut-il utiliser le contact ?',
  ];
  protected readonly lastAssistantMessage = computed(() =>
    [...this.messages()].reverse().find((message) => message.author === 'assistant') ?? null,
  );

  protected readonly messageForm = this.formBuilder.nonNullable.group({
    message: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(1000)]],
  });

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
          this.error.set(
            "Impossible d'obtenir une reponse pour le moment. Tu peux toujours utiliser le formulaire de contact.",
          );
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
}
