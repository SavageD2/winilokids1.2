import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FaqService } from '../../../core/services/faq.service';
import { FaqEntry } from '../../../shared/models/faq.model';

type FaqCategoryGroup = {
  name: string;
  entries: FaqEntry[];
};

@Component({
  selector: 'app-faq-page',
  imports: [RouterLink],
  templateUrl: './faq-page.component.html',
  styleUrl: './faq-page.component.scss',
})
export class FaqPageComponent {
  private readonly faqService = inject(FaqService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly entries = signal<FaqEntry[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly groups = computed<FaqCategoryGroup[]>(() => {
    const byCategory = new Map<string, FaqEntry[]>();

    for (const entry of this.entries()) {
      const category = entry.category ?? 'Questions frequentes';
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
          this.error.set('Impossible de charger la FAQ pour le moment.');
          this.loading.set(false);
        },
      });
  }
}
