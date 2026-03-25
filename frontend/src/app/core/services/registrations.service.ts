import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import {
  CreateRegistrationPayload,
  RegistrationRecord,
} from '../../shared/models/registration.model';

@Injectable({
  providedIn: 'root',
})
export class RegistrationsService {
  private readonly http = inject(HttpClient);

  create(payload: CreateRegistrationPayload): Observable<RegistrationRecord> {
    return this.http.post<RegistrationRecord>(`${API_BASE_URL}/registrations`, payload);
  }
}
