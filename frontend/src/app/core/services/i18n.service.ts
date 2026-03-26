import { DOCUMENT } from '@angular/common';
import { Injectable, computed, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';

export type AppLanguage = 'fr' | 'en';

type LanguageOption = {
  code: AppLanguage;
  labelKey: string;
};

const DEFAULT_LANGUAGE: AppLanguage = 'fr';
const LANGUAGE_STORAGE_KEY = 'winilo.language.preference';

@Injectable({
  providedIn: 'root',
})
export class I18nService {
  private readonly document = inject(DOCUMENT);
  private readonly translateService = inject(TranslateService);
  private readonly languageSignal = signal<AppLanguage>(DEFAULT_LANGUAGE);

  private initialized = false;

  readonly language = this.languageSignal.asReadonly();
  readonly locale = computed(() => this.languageSignal());
  readonly availableLanguages: LanguageOption[] = [
    { code: 'fr', labelKey: 'language.option.fr' },
    { code: 'en', labelKey: 'language.option.en' },
  ];

  async initialize() {
    if (this.initialized) {
      return;
    }

    this.initialized = true;

    const language = this.resolveInitialLanguage();

    this.translateService.addLangs(
      this.availableLanguages.map((option) => option.code),
    );

    await firstValueFrom(this.translateService.setFallbackLang(DEFAULT_LANGUAGE));
    await firstValueFrom(this.translateService.use(language));

    this.languageSignal.set(language);
    this.applyLanguageToDocument(language);
  }

  async setLanguage(language: AppLanguage) {
    if (language === this.languageSignal()) {
      return;
    }

    await firstValueFrom(this.translateService.use(language));

    this.languageSignal.set(language);
    this.persistLanguage(language);
    this.applyLanguageToDocument(language);
  }

  translateInstant(key: string, params?: Record<string, unknown>) {
    return this.translateService.instant(key, params);
  }

  private resolveInitialLanguage(): AppLanguage {
    const storedLanguage = this.readStoredLanguage();

    if (storedLanguage) {
      return storedLanguage;
    }

    if (typeof window === 'undefined') {
      return DEFAULT_LANGUAGE;
    }

    const browserLanguages = [
      ...window.navigator.languages,
      window.navigator.language,
    ].filter(Boolean);

    for (const candidate of browserLanguages) {
      if (candidate.toLowerCase().startsWith('en')) {
        return 'en';
      }

      if (candidate.toLowerCase().startsWith('fr')) {
        return 'fr';
      }
    }

    return DEFAULT_LANGUAGE;
  }

  private readStoredLanguage(): AppLanguage | null {
    if (typeof window === 'undefined') {
      return null;
    }

    const storedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);

    return storedLanguage === 'fr' || storedLanguage === 'en'
      ? storedLanguage
      : null;
  }

  private persistLanguage(language: AppLanguage) {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  }

  private applyLanguageToDocument(language: AppLanguage) {
    const root = this.document.documentElement;

    root.lang = language;
    root.dataset['language'] = language;
  }
}
