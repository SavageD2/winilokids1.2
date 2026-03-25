import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { AdminProfile, AdminSession, LoginPayload } from '../../shared/models/admin-auth.model';
import { AdminSessionService } from './admin-session.service';

@Injectable({
  providedIn: 'root',
})
export class AdminAuthService {
  private readonly http = inject(HttpClient);
  private readonly session = inject(AdminSessionService);

  readonly token = this.session.token;
  readonly admin = this.session.admin;
  readonly isAuthenticated = this.session.isAuthenticated;

  login(payload: LoginPayload): Observable<AdminSession> {
    return this.http
      .post<AdminSession>(`${API_BASE_URL}/admin/auth/login`, payload)
      .pipe(tap((session) => this.session.storeSession(session)));
  }

  getProfile(): Observable<AdminProfile> {
    return this.http.get<AdminProfile>(`${API_BASE_URL}/admin/auth/me`).pipe(
      tap((admin) => {
        this.session.updateAdmin(admin);
      }),
    );
  }

  logout() {
    this.session.clearSession();
  }

  clearSession() {
    this.session.clearSession();
  }
}
