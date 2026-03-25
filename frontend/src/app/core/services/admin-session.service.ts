import { computed, Injectable, signal } from '@angular/core';
import { AdminProfile, AdminSession } from '../../shared/models/admin-auth.model';

export const ADMIN_SESSION_STORAGE_KEY = 'winilo-kids-admin-session';

@Injectable({
  providedIn: 'root',
})
export class AdminSessionService {
  readonly token = signal<string | null>(null);
  readonly admin = signal<AdminProfile | null>(null);
  readonly isAuthenticated = computed(() => !!this.token());

  constructor() {
    this.restoreSession();
  }

  storeSession(session: AdminSession) {
    this.token.set(session.accessToken);
    this.admin.set(session.admin);
    this.persistSession();
  }

  updateAdmin(admin: AdminProfile) {
    this.admin.set(admin);
    this.persistSession();
  }

  clearSession() {
    this.token.set(null);
    this.admin.set(null);
    localStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
  }

  private restoreSession() {
    const rawSession = localStorage.getItem(ADMIN_SESSION_STORAGE_KEY);

    if (!rawSession) {
      return;
    }

    try {
      const session = JSON.parse(rawSession) as AdminSession;
      this.token.set(session.accessToken);
      this.admin.set(session.admin);
    } catch {
      this.clearSession();
    }
  }

  private persistSession() {
    const token = this.token();
    const admin = this.admin();

    if (!token || !admin) {
      localStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
      return;
    }

    localStorage.setItem(
      ADMIN_SESSION_STORAGE_KEY,
      JSON.stringify({
        accessToken: token,
        admin,
      }),
    );
  }
}
