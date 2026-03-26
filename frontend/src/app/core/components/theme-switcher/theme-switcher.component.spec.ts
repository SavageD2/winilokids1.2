import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ThemeSwitcherComponent } from './theme-switcher.component';
import { ThemeService } from '../../services/theme.service';

describe('ThemeSwitcherComponent', () => {
  const preferenceSignal = signal<'default' | 'light' | 'dark' | 'system'>(
    'default',
  );
  const resolvedThemeSignal = signal<'default' | 'light' | 'dark'>('default');

  const themeServiceMock = {
    preference: preferenceSignal,
    resolvedTheme: resolvedThemeSignal,
    setPreference: vi.fn(),
  };

  beforeEach(async () => {
    preferenceSignal.set('default');
    resolvedThemeSignal.set('default');
    themeServiceMock.setPreference.mockReset();

    await TestBed.configureTestingModule({
      imports: [ThemeSwitcherComponent],
      providers: [{ provide: ThemeService, useValue: themeServiceMock }],
    }).compileComponents();
  });

  it('renders its explicit label in standard mode', () => {
    const fixture = TestBed.createComponent(ThemeSwitcherComponent);
    const component = fixture.componentInstance;

    component.label = 'Apparence';
    fixture.detectChanges();

    const label = fixture.nativeElement.querySelector('.theme-switcher-label');
    const select = fixture.nativeElement.querySelector('select');

    expect(label?.textContent?.trim()).toBe('Apparence');
    expect(select?.getAttribute('aria-label')).toBeNull();
  });

  it('renders as a nav-friendly compact control and forwards selection changes', () => {
    const fixture = TestBed.createComponent(ThemeSwitcherComponent);
    const component = fixture.componentInstance;

    component.label = 'Theme';
    component.compact = true;
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const label = host.querySelector('.theme-switcher-label');
    const prefix = host.querySelector('.theme-switcher-prefix');
    const select = host.querySelector('select') as HTMLSelectElement;

    expect(label).toBeNull();
    expect(prefix?.textContent?.trim()).toBe('Theme');
    expect(select.getAttribute('aria-label')).toBe('Theme');

    select.value = 'dark';
    select.dispatchEvent(new Event('change'));

    expect(themeServiceMock.setPreference).toHaveBeenCalledWith('dark');
  });

  it('renders the current resolved theme preview', () => {
    resolvedThemeSignal.set('dark');

    const fixture = TestBed.createComponent(ThemeSwitcherComponent);
    fixture.detectChanges();

    const preview = fixture.nativeElement.querySelector(
      '.theme-switcher-preview',
    ) as HTMLElement;

    expect(preview.getAttribute('data-theme-preview')).toBe('dark');
  });
});
