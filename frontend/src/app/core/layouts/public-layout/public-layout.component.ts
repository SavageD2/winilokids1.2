import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { filter } from 'rxjs';
import { ChatbotWidgetComponent } from '../../components/chatbot-widget/chatbot-widget.component';
import { LanguageSwitcherComponent } from '../../components/language-switcher/language-switcher.component';
import { ThemeSwitcherComponent } from '../../components/theme-switcher/theme-switcher.component';
import { ParentAuthService } from '../../services/parent-auth.service';

@Component({
  selector: 'app-public-layout',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    TranslatePipe,
    ChatbotWidgetComponent,
    LanguageSwitcherComponent,
    ThemeSwitcherComponent,
  ],
  templateUrl: './public-layout.component.html',
  styleUrl: './public-layout.component.scss',
})
export class PublicLayoutComponent {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly parentAuthService = inject(ParentAuthService);

  protected readonly menuPanelId = 'public-site-menu';
  protected readonly isMenuOpen = signal(false);
  protected readonly isParentAuthenticated = computed(() => this.parentAuthService.isAuthenticated());

  constructor() {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.closeMenu();
      });
  }

  protected toggleMenu() {
    this.isMenuOpen.update((value) => !value);
  }

  protected closeMenu() {
    this.isMenuOpen.set(false);
  }
}
