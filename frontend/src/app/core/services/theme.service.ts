import { DOCUMENT } from '@angular/common';
import { Injectable, computed, effect, inject, signal } from '@angular/core';

export type ThemePreference = 'default' | 'light' | 'dark' | 'system';
export type ResolvedTheme = Exclude<ThemePreference, 'system'>;

const THEME_STORAGE_KEY = 'winilo.theme.preference';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly preferenceSignal = signal<ThemePreference>('default');
  private readonly systemPrefersDarkSignal = signal(false);

  private mediaQuery: MediaQueryList | null = null;
  private initialized = false;

  readonly preference = this.preferenceSignal.asReadonly();
  readonly resolvedTheme = computed<ResolvedTheme>(() => {
    switch (this.preferenceSignal()) {
      case 'light':
        return 'light';
      case 'dark':
        return 'dark';
      case 'system':
        return this.systemPrefersDarkSignal() ? 'dark' : 'light';
      default:
        return 'default';
    }
  });

  readonly followsSystem = computed(() => this.preferenceSignal() === 'system');

  constructor() {
    effect(() => {
      this.applyTheme(this.preferenceSignal(), this.resolvedTheme());
    });
  }

  initialize() {
    if (this.initialized) {
      return;
    }

    this.initialized = true;
    this.preferenceSignal.set(this.readStoredPreference());

    if (typeof window === 'undefined' || !('matchMedia' in window)) {
      return;
    }

    this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    this.systemPrefersDarkSignal.set(this.mediaQuery.matches);

    if ('addEventListener' in this.mediaQuery) {
      this.mediaQuery.addEventListener('change', this.handleSystemThemeChange);
      return;
    }

    const legacyMediaQuery = this.mediaQuery as MediaQueryList & {
      addListener?: (listener: (event: MediaQueryListEvent) => void) => void;
    };

    legacyMediaQuery.addListener?.(this.handleSystemThemeChange);
  }

  setPreference(preference: ThemePreference) {
    this.preferenceSignal.set(preference);
    this.persistPreference(preference);
  }

  private applyTheme(preference: ThemePreference, resolvedTheme: ResolvedTheme) {
    const root = this.document.documentElement;

    root.dataset['themeSetting'] = preference;
    root.dataset['theme'] = resolvedTheme;
    root.style.colorScheme = resolvedTheme === 'dark' ? 'dark' : 'light';
  }

  private handleSystemThemeChange = (
    event: MediaQueryListEvent | MediaQueryList,
  ) => {
    this.systemPrefersDarkSignal.set(event.matches);
  };

  private readStoredPreference(): ThemePreference {
    if (typeof window === 'undefined') {
      return 'default';
    }

    const storedPreference = window.localStorage.getItem(THEME_STORAGE_KEY);

    if (
      storedPreference === 'default' ||
      storedPreference === 'light' ||
      storedPreference === 'dark' ||
      storedPreference === 'system'
    ) {
      return storedPreference;
    }

    return 'default';
  }

  private persistPreference(preference: ThemePreference) {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(THEME_STORAGE_KEY, preference);
  }
}
