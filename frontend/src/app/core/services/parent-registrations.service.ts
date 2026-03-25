import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { RegistrationRecord } from '../../shared/models/registration.model';

@Injectable({
  providedIn: 'root',
})
export class ParentRegistrationsService {
  private readonly http = inject(HttpClient);

  getMine(): Observable<RegistrationRecord[]> {
    return this.http.get<RegistrationRecord[]>(`${API_BASE_URL}/parent/registrations`);
  }

  cancel(id: number): Observable<RegistrationRecord> {
    return this.http.patch<RegistrationRecord>(`${API_BASE_URL}/parent/registrations/${id}/cancel`, {});
  }
}
