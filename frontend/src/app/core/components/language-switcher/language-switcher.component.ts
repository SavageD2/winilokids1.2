import { Component, Input, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { AppLanguage, I18nService } from '../../services/i18n.service';

let nextLanguageSwitcherId = 0;

@Component({
  selector: 'app-language-switcher',
  imports: [TranslatePipe],
  templateUrl: './language-switcher.component.html',
  styleUrl: './language-switcher.component.scss',
})
export class LanguageSwitcherComponent {
  private readonly i18nService = inject(I18nService);

  @Input() label = 'Language';
  @Input() compact = false;

  protected readonly selectId = `language-switcher-${nextLanguageSwitcherId += 1}`;
  protected readonly language = this.i18nService.language;
  protected readonly options = this.i18nService.availableLanguages;

  protected updateLanguage(event: Event) {
    const target = event.target as HTMLSelectElement;
    const language = target.value as AppLanguage;

    void this.i18nService.setLanguage(language);
  }
}
