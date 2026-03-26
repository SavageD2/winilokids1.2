import {
  APP_INITIALIZER,
  LOCALE_ID,
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { registerLocaleData } from '@angular/common';
import localeEn from '@angular/common/locales/en';
import localeFr from '@angular/common/locales/fr';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { I18nService } from './core/services/i18n.service';
import { ThemeService } from './core/services/theme.service';

import { routes } from './app.routes';

registerLocaleData(localeEn);
registerLocaleData(localeFr);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideRouter(routes),
    provideTranslateService({
      fallbackLang: 'fr',
      loader: provideTranslateHttpLoader({
        prefix: '/i18n/',
        suffix: '.json',
      }),
    }),
    {
      provide: APP_INITIALIZER,
      multi: true,
      deps: [ThemeService],
      useFactory: (themeService: ThemeService) => () => themeService.initialize(),
    },
    {
      provide: APP_INITIALIZER,
      multi: true,
      deps: [I18nService],
      useFactory: (i18nService: I18nService) => () => i18nService.initialize(),
    },
    {
      provide: LOCALE_ID,
      deps: [I18nService],
      useFactory: (i18nService: I18nService) => i18nService.locale(),
    },
  ],
};
