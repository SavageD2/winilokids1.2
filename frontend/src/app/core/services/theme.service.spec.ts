import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

type MatchMediaMock = MediaQueryList & {
  emitChange: (matches: boolean) => void;
};

function createMatchMediaMock(initialMatches: boolean): MatchMediaMock {
  let changeListener: ((event: MediaQueryListEvent) => void) | null = null;
  let currentMatches = initialMatches;

  return {
    get matches() {
      return currentMatches;
    },
    media: '(prefers-color-scheme: dark)',
    onchange: null,
    addEventListener: vi.fn((_type: string, listener: EventListenerOrEventListenerObject) => {
      changeListener = listener as (event: MediaQueryListEvent) => void;
    }),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
    emitChange(matches: boolean) {
      currentMatches = matches;
      changeListener?.({ matches } as MediaQueryListEvent);
    },
  };
}

describe('ThemeService', () => {
  let document: Document;
  let matchMediaMock: MatchMediaMock;
  let originalMatchMedia: typeof window.matchMedia | undefined;

  beforeEach(() => {
    localStorage.clear();
    document = globalThis.document;
    document.documentElement.dataset['theme'] = '';
    document.documentElement.dataset['themeSetting'] = '';
    document.documentElement.style.colorScheme = '';
    matchMediaMock = createMatchMediaMock(false);
    originalMatchMedia = window.matchMedia;
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn(() => matchMediaMock),
    });

    TestBed.configureTestingModule({
      providers: [{ provide: DOCUMENT, useValue: document }],
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: originalMatchMedia,
    });
  });

  it('initializes with the default theme when no preference is stored', () => {
    const service = TestBed.inject(ThemeService);

    service.initialize();
    TestBed.flushEffects();

    expect(service.preference()).toBe('default');
    expect(service.resolvedTheme()).toBe('default');
    expect(document.documentElement.dataset['themeSetting']).toBe('default');
    expect(document.documentElement.dataset['theme']).toBe('default');
    expect(document.documentElement.style.colorScheme).toBe('light');
  });

  it('restores the stored system preference and follows the OS preference', () => {
    localStorage.setItem('winilo.theme.preference', 'system');
    matchMediaMock = createMatchMediaMock(true);
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn(() => matchMediaMock),
    });

    const service = TestBed.inject(ThemeService);

    service.initialize();
    TestBed.flushEffects();

    expect(service.preference()).toBe('system');
    expect(service.followsSystem()).toBe(true);
    expect(service.resolvedTheme()).toBe('dark');
    expect(document.documentElement.dataset['theme']).toBe('dark');
    expect(document.documentElement.style.colorScheme).toBe('dark');

    matchMediaMock.emitChange(false);
    TestBed.flushEffects();

    expect(service.resolvedTheme()).toBe('light');
    expect(document.documentElement.dataset['theme']).toBe('light');
    expect(document.documentElement.style.colorScheme).toBe('light');
  });

  it('persists an explicit preference change', () => {
    const service = TestBed.inject(ThemeService);
    service.initialize();
    TestBed.flushEffects();

    service.setPreference('dark');
    TestBed.flushEffects();

    expect(service.preference()).toBe('dark');
    expect(service.resolvedTheme()).toBe('dark');
    expect(localStorage.getItem('winilo.theme.preference')).toBe('dark');
    expect(document.documentElement.dataset['themeSetting']).toBe('dark');
    expect(document.documentElement.dataset['theme']).toBe('dark');
  });
});
