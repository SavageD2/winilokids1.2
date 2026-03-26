import { Component, Input, computed, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import {
  ResolvedTheme,
  ThemePreference,
  ThemeService,
} from '../../services/theme.service';

let nextThemeSwitcherId = 0;

@Component({
  selector: 'app-theme-switcher',
  imports: [TranslatePipe],
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
  protected readonly options: Array<{
    value: ThemePreference;
    labelKey: string;
  }> = [
    { value: 'default', labelKey: 'theme.option.default' },
    { value: 'light', labelKey: 'theme.option.light' },
    { value: 'dark', labelKey: 'theme.option.dark' },
    { value: 'system', labelKey: 'theme.option.system' },
  ];
  protected readonly hintTranslation = computed(() => {
    const preference = this.preference();
    const resolvedTheme = this.resolvedTheme();

    if (preference === 'system') {
      return {
        key: 'theme.hint.system',
        params: {
          modeKey: this.getThemeLabelKey(resolvedTheme),
        },
      };
    }

    if (preference === 'default') {
      return {
        key: 'theme.hint.default',
        params: {},
      };
    }

    return {
      key: 'theme.hint.active',
      params: {
        modeKey: this.getThemeLabelKey(resolvedTheme),
      },
    };
  });

  protected updatePreference(event: Event) {
    const target = event.target as HTMLSelectElement;
    const preference = target.value as ThemePreference;

    this.themeService.setPreference(preference);
  }

  private getThemeLabelKey(theme: ResolvedTheme) {
    switch (theme) {
      case 'light':
        return 'theme.option.light';
      case 'dark':
        return 'theme.option.dark';
      default:
        return 'theme.option.default';
    }
  }
}
