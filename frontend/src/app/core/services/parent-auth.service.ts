import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import {
  LoginParentPayload,
  ParentProfile,
  ParentSession,
  RegisterParentPayload,
} from '../../shared/models/parent-auth.model';
import { ParentSessionService } from './parent-session.service';

@Injectable({
  providedIn: 'root',
})
export class ParentAuthService {
  private readonly http = inject(HttpClient);
  private readonly session = inject(ParentSessionService);

  readonly token = this.session.token;
  readonly parent = this.session.parent;
  readonly isAuthenticated = this.session.isAuthenticated;

  register(payload: RegisterParentPayload): Observable<ParentSession> {
    return this.http
      .post<ParentSession>(`${API_BASE_URL}/parent/auth/register`, payload)
      .pipe(tap((session) => this.session.storeSession(session)));
  }

  login(payload: LoginParentPayload): Observable<ParentSession> {
    return this.http
      .post<ParentSession>(`${API_BASE_URL}/parent/auth/login`, payload)
      .pipe(tap((session) => this.session.storeSession(session)));
  }

  getProfile(): Observable<ParentProfile> {
    return this.http.get<ParentProfile>(`${API_BASE_URL}/parent/auth/me`).pipe(
      tap((parent) => {
        this.session.updateParent(parent);
      }),
    );
  }

  logout() {
    this.session.clearSession();
  }
}
