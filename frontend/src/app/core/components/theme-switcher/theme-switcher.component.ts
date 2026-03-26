import { Component, Input, computed, inject } from '@angular/core';
import {
  ResolvedTheme,
  ThemePreference,
  ThemeService,
} from '../../services/theme.service';

let nextThemeSwitcherId = 0;

@Component({
  selector: 'app-theme-switcher',
  templateUrl: './theme-switcher.component.html',
  styleUrl: './theme-switcher.component.scss',
})
export class ThemeSwitcherComponent {
  private readonly themeService = inject(ThemeService);

  @Input() label = 'Apparence';
  @Input() showHint = false;
  @Input() compact = false;

  protected readonly selectId = `theme-switcher-${nextThemeSwitcherId += 1}`;
  protected readonly hintId = `${this.selectId}-hint`;
  protected readonly preference = this.themeService.preference;
  protected readonly resolvedTheme = this.themeService.resolvedTheme;
  protected readonly options: Array<{ value: ThemePreference; label: string }> = [
    { value: 'default', label: 'Par defaut' },
    { value: 'light', label: 'Clair' },
    { value: 'dark', label: 'Sombre' },
    { value: 'system', label: 'Systeme' },
  ];
  protected readonly hint = computed(() => {
    const preference = this.preference();
    const resolvedTheme = this.resolvedTheme();

    if (preference === 'system') {
      return `Le theme suit actuellement le systeme en mode ${this.getThemeLabel(resolvedTheme).toLowerCase()}.`;
    }

    if (preference === 'default') {
      return "Utilise l'apparence editoriale actuelle de l'application.";
    }

    return `Apparence ${this.getThemeLabel(resolvedTheme).toLowerCase()} activee sur cet appareil.`;
  });

  protected updatePreference(event: Event) {
    const target = event.target as HTMLSelectElement;
    const preference = target.value as ThemePreference;

    this.themeService.setPreference(preference);
  }

  private getThemeLabel(theme: ResolvedTheme) {
    switch (theme) {
      case 'light':
        return 'Clair';
      case 'dark':
        return 'Sombre';
      default:
        return 'Par defaut';
    }
  }
}
