import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslatePipe } from '@ngx-translate/core';
import { FaqService } from '../../../core/services/faq.service';
import { I18nService } from '../../../core/services/i18n.service';
import { FaqEntry } from '../../../shared/models/faq.model';

type FaqCategoryGroup = {
  name: string;
  entries: FaqEntry[];
};

@Component({
  selector: 'app-faq-page',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './faq-page.component.html',
  styleUrl: './faq-page.component.scss',
})
export class FaqPageComponent {
  private readonly faqService = inject(FaqService);
  private readonly i18nService = inject(I18nService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly entries = signal<FaqEntry[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly groups = computed<FaqCategoryGroup[]>(() => {
    this.i18nService.language();

    const byCategory = new Map<string, FaqEntry[]>();

    for (const entry of this.entries()) {
      const category =
        entry.category ?? this.i18nService.translateInstant('faq.defaultCategory');
      const currentEntries = byCategory.get(category) ?? [];
      currentEntries.push(entry);
      byCategory.set(category, currentEntries);
    }

    return Array.from(byCategory.entries()).map(([name, entries]) => ({
      name,
      entries,
    }));
  });

  constructor() {
    this.faqService
      .getPublished()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (entries) => {
          this.entries.set(entries);
          this.loading.set(false);
        },
        error: () => {
          this.error.set(this.i18nService.translateInstant('faq.error'));
          this.loading.set(false);
        },
      });
  }
}
