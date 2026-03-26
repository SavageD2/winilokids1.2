import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslatePipe } from '@ngx-translate/core';
import { finalize } from 'rxjs';
import { AdminFaqService } from '../../../core/services/admin-faq.service';
import { I18nService } from '../../../core/services/i18n.service';
import { CreateFaqEntryPayload, FaqEntry } from '../../../shared/models/faq.model';

@Component({
  selector: 'app-admin-faq-page',
  imports: [ReactiveFormsModule, TranslatePipe],
  templateUrl: './admin-faq-page.component.html',
  styleUrl: './admin-faq-page.component.scss',
})
export class AdminFaqPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly i18nService = inject(I18nService);
  private readonly faqService = inject(AdminFaqService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly entries = signal<FaqEntry[]>([]);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly deletingId = signal<number | null>(null);
  protected readonly editingEntryId = signal<number | null>(null);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly search = signal('');
  protected readonly filteredEntries = computed(() => {
    const query = this.search().trim().toLowerCase();

    if (!query) {
      return this.entries();
    }

    return this.entries().filter((entry) =>
      [entry.question, entry.answer, entry.category ?? ''].join(' ').toLowerCase().includes(query),
    );
  });

  protected readonly faqForm = this.formBuilder.nonNullable.group({
    question: ['', [Validators.required, Validators.minLength(10)]],
    answer: ['', [Validators.required, Validators.minLength(20)]],
    category: [''],
    displayOrder: [0, [Validators.required, Validators.min(0)]],
    isPublished: [false],
  });

  constructor() {
    this.loadEntries();
  }

  protected submit() {
    if (this.faqForm.invalid) {
      this.faqForm.markAllAsTouched();
      this.errorMessage.set(this.i18nService.translateInstant('adminFaq.errors.invalidForm'));
      return;
    }

    const payload = this.buildPayload();
    const faqEntryId = this.editingEntryId();

    this.saving.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const request$ = faqEntryId
      ? this.faqService.update(faqEntryId, payload)
      : this.faqService.create(payload);

    request$
      .pipe(
        finalize(() => {
          this.saving.set(false);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.successMessage.set(
            this.i18nService.translateInstant(
              faqEntryId ? 'adminFaq.success.updated' : 'adminFaq.success.created',
            ),
          );
          this.loadEntries();
          this.resetForm();
        },
        error: () => {
          this.errorMessage.set(this.i18nService.translateInstant('adminFaq.errors.save'));
        },
      });
  }

  protected editEntry(entry: FaqEntry) {
    this.editingEntryId.set(entry.id);
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.faqForm.patchValue({
      question: entry.question,
      answer: entry.answer,
      category: entry.category ?? '',
      displayOrder: entry.displayOrder,
      isPublished: entry.isPublished,
    });
  }

  protected createNewEntry() {
    this.resetForm();
  }

  protected removeEntry(entry: FaqEntry) {
    const confirmed = confirm(
      this.i18nService.translateInstant('adminFaq.delete.confirm', {
        question: entry.question,
      }),
    );

    if (!confirmed) {
      return;
    }

    this.deletingId.set(entry.id);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.faqService
      .remove(entry.id)
      .pipe(
        finalize(() => {
          this.deletingId.set(null);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.successMessage.set(this.i18nService.translateInstant('adminFaq.success.deleted'));
          if (this.editingEntryId() === entry.id) {
            this.resetForm();
          }
          this.loadEntries();
        },
        error: () => {
          this.errorMessage.set(this.i18nService.translateInstant('adminFaq.errors.delete'));
        },
      });
  }

  protected updateSearch(event: Event) {
    const input = event.target as HTMLInputElement;
    this.search.set(input.value);
  }

  private loadEntries() {
    this.loading.set(true);

    this.faqService
      .getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (entries) => {
          this.entries.set(entries);
          this.loading.set(false);
        },
        error: () => {
          this.errorMessage.set(this.i18nService.translateInstant('adminFaq.errors.load'));
          this.loading.set(false);
        },
      });
  }

  private resetForm() {
    this.editingEntryId.set(null);
    this.faqForm.reset({
      question: '',
      answer: '',
      category: '',
      displayOrder: 0,
      isPublished: false,
    });
  }

  private buildPayload(): CreateFaqEntryPayload {
    const rawValue = this.faqForm.getRawValue();

    return {
      question: rawValue.question.trim(),
      answer: rawValue.answer.trim(),
      category: rawValue.category.trim() || null,
      displayOrder: Number(rawValue.displayOrder),
      isPublished: rawValue.isPublished,
    };
  }
}
