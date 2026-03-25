import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AdminAuthService } from '../../services/admin-auth.service';
import { ParentAuthService } from '../../services/parent-auth.service';

@Component({
  selector: 'app-public-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './public-layout.component.html',
  styleUrl: './public-layout.component.scss',
})
export class PublicLayoutComponent {
  private readonly adminAuthService = inject(AdminAuthService);
  private readonly parentAuthService = inject(ParentAuthService);

  protected readonly isAdminAuthenticated = computed(() => this.adminAuthService.isAuthenticated());
  protected readonly isParentAuthenticated = computed(() => this.parentAuthService.isAuthenticated());
}
