import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { LanguageSwitcherComponent } from '../../components/language-switcher/language-switcher.component';
import { ThemeSwitcherComponent } from '../../components/theme-switcher/theme-switcher.component';
import { AdminAuthService } from '../../services/admin-auth.service';

@Component({
  selector: 'app-admin-layout',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    TranslatePipe,
    LanguageSwitcherComponent,
    ThemeSwitcherComponent,
  ],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.scss',
})
export class AdminLayoutComponent {
  private readonly authService = inject(AdminAuthService);
  private readonly router = inject(Router);

  protected readonly admin = computed(() => this.authService.admin());

  protected logout() {
    this.authService.logout();
    void this.router.navigate(['/admin/login']);
  }
}
