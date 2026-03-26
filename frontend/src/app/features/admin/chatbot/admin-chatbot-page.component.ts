import { DatePipe } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslatePipe } from '@ngx-translate/core';
import { debounceTime, distinctUntilChanged, map } from 'rxjs';
import { AdminChatbotService } from '../../../core/services/admin-chatbot.service';
import { I18nService } from '../../../core/services/i18n.service';
import {
  AdminChatbotSourceType,
  AdminChatbotSummary,
  ChatbotLogRecord,
} from '../../../shared/models/chatbot.model';

@Component({
  selector: 'app-admin-chatbot-page',
  imports: [ReactiveFormsModule, DatePipe, TranslatePipe],
  templateUrl: './admin-chatbot-page.component.html',
  styleUrl: './admin-chatbot-page.component.scss',
})
export class AdminChatbotPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly i18nService = inject(I18nService);
  private readonly chatbotService = inject(AdminChatbotService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly summary = signal<AdminChatbotSummary | null>(null);
  protected readonly logs = signal<ChatbotLogRecord[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly page = signal(1);
  protected readonly pageSize = 10;
  protected readonly total = signal(0);
  protected readonly totalPages = signal(0);
  protected readonly hasPreviousPage = computed(() => this.page() > 1);
  protected readonly hasNextPage = computed(() => this.page() < this.totalPages());
  protected readonly sourceTypes: AdminChatbotSourceType[] = [
    'FAQ',
    'WORKSHOP',
    'GUIDANCE',
    'FALLBACK',
  ];

  protected readonly filtersForm = this.formBuilder.nonNullable.group({
    search: [''],
    sourceType: ['ALL'],
    fallbackOnly: ['ALL'],
  });

  constructor() {
    this.loadSummary();
    this.loadLogs();

    this.filtersForm.valueChanges
      .pipe(
        debounceTime(250),
        map((value) => JSON.stringify(value)),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.page.set(1);
        this.loadLogs();
      });
  }

  protected changePage(nextPage: number) {
    if (nextPage < 1 || nextPage > this.totalPages()) {
      return;
    }

    this.page.set(nextPage);
    this.loadLogs();
  }

  protected sourceLabel(sourceType: AdminChatbotSourceType) {
    switch (sourceType) {
      case 'FAQ':
        return this.i18nService.translateInstant('adminChatbot.source.faq');
      case 'WORKSHOP':
        return this.i18nService.translateInstant('adminChatbot.source.workshop');
      case 'GUIDANCE':
        return this.i18nService.translateInstant('adminChatbot.source.guidance');
      case 'FALLBACK':
        return this.i18nService.translateInstant('adminChatbot.source.fallback');
    }
  }

  protected summaryLabel(count: number) {
    return this.i18nService.translateInstant('adminChatbot.summary.total', { count });
  }

  protected pageSummaryLabel() {
    return this.i18nService.translateInstant('adminChatbot.summary.page', {
      page: this.page(),
      totalPages: this.totalPages(),
    });
  }

  private loadSummary() {
    this.chatbotService
      .getSummary()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (summary) => {
          this.summary.set(summary);
        },
        error: () => {
          this.error.set(this.i18nService.translateInstant('adminChatbot.errors.summary'));
        },
      });
  }

  private loadLogs() {
    this.loading.set(true);
    this.error.set(null);
    const { search, sourceType, fallbackOnly } = this.filtersForm.getRawValue();

    this.chatbotService
      .getLogs({
        page: this.page(),
        pageSize: this.pageSize,
        search: search.trim() || undefined,
        sourceType: sourceType === 'ALL' ? undefined : (sourceType as AdminChatbotSourceType),
        fallbackToContact:
          fallbackOnly === 'ALL' ? undefined : fallbackOnly === 'ONLY_TRUE',
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.logs.set(response.items);
          this.total.set(response.total);
          this.totalPages.set(response.totalPages);
          this.loading.set(false);
        },
        error: () => {
          this.error.set(this.i18nService.translateInstant('adminChatbot.errors.logs'));
          this.loading.set(false);
        },
      });
  }
}
