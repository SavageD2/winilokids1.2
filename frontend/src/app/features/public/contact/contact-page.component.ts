import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslatePipe } from '@ngx-translate/core';
import { finalize } from 'rxjs';
import { I18nService } from '../../../core/services/i18n.service';
import { ContactsService } from '../../../core/services/contacts.service';

@Component({
  selector: 'app-contact-page',
  imports: [ReactiveFormsModule, TranslatePipe],
  templateUrl: './contact-page.component.html',
  styleUrl: './contact-page.component.scss',
})
export class ContactPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly i18nService = inject(I18nService);
  private readonly contactsService = inject(ContactsService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly submitting = signal(false);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly contactForm = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    message: ['', [Validators.required, Validators.minLength(10)]],
  });

  protected submit() {
    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.contactsService
      .create({
        ...this.contactForm.getRawValue(),
        phone: this.contactForm.getRawValue().phone || null,
      })
      .pipe(
        finalize(() => {
          this.submitting.set(false);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.successMessage.set(this.i18nService.translateInstant('contact.success'));
          this.contactForm.reset({
            name: '',
            email: '',
            phone: '',
            message: '',
          });
        },
        error: () => {
          this.errorMessage.set(this.i18nService.translateInstant('contact.error'));
        },
      });
  }
}
