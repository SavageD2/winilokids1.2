import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import {
  RegistrationRecord,
  RegistrationStatus,
  UpdateRegistrationStatusPayload,
} from '../../shared/models/registration.model';

@Injectable({
  providedIn: 'root',
})
export class AdminRegistrationsService {
  private readonly http = inject(HttpClient);

  getByWorkshop(workshopId: number): Observable<RegistrationRecord[]> {
    return this.http.get<RegistrationRecord[]>(`${API_BASE_URL}/admin/workshops/${workshopId}/registrations`);
  }

  updateStatus(id: number, payload: UpdateRegistrationStatusPayload): Observable<RegistrationRecord> {
    return this.http.patch<RegistrationRecord>(
      `${API_BASE_URL}/admin/registrations/${id}/status`,
      payload,
    );
  }

  getStatuses(): RegistrationStatus[] {
    return ['PENDING', 'CONFIRMED', 'CANCELLED', 'ATTENDED'];
  }
}
