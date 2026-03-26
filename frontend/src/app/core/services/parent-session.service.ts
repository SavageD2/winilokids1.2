import { computed, Injectable, signal } from '@angular/core';
import { ParentProfile, ParentSession } from '../../shared/models/parent-auth.model';

export const PARENT_SESSION_STORAGE_KEY = 'winilo-kids-parent-session';

@Injectable({
  providedIn: 'root',
})
export class ParentSessionService {
  readonly token = signal<string | null>(null);
  readonly parent = signal<ParentProfile | null>(null);
  readonly isAuthenticated = computed(() => !!this.token());

  constructor() {
    this.restoreSession();
  }

  storeSession(session: ParentSession) {
    this.token.set(session.accessToken);
    this.parent.set(this.normalizeParent(session.parent));
    this.persistSession();
  }

  updateParent(parent: ParentProfile) {
    this.parent.set(this.normalizeParent(parent));
    this.persistSession();
  }

  clearSession() {
    this.token.set(null);
    this.parent.set(null);
    localStorage.removeItem(PARENT_SESSION_STORAGE_KEY);
  }

  private restoreSession() {
    const rawSession = localStorage.getItem(PARENT_SESSION_STORAGE_KEY);

    if (!rawSession) {
      return;
    }

    try {
      const session = JSON.parse(rawSession) as ParentSession;
      this.token.set(session.accessToken);
      this.parent.set(this.normalizeParent(session.parent));
    } catch {
      this.clearSession();
    }
  }

  private persistSession() {
    const token = this.token();
    const parent = this.parent();

    if (!token || !parent) {
      localStorage.removeItem(PARENT_SESSION_STORAGE_KEY);
      return;
    }

    localStorage.setItem(
      PARENT_SESSION_STORAGE_KEY,
      JSON.stringify({
        accessToken: token,
        parent,
      }),
    );
  }

  private normalizeParent(parent: ParentProfile): ParentProfile {
    return {
      ...parent,
      hasPassword: parent.hasPassword ?? true,
      hasGoogleAccount: parent.hasGoogleAccount ?? false,
    };
  }
}
