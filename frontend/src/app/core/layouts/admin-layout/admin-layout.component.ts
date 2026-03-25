import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AdminAuthService } from '../../services/admin-auth.service';

@Component({
  selector: 'app-admin-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
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
