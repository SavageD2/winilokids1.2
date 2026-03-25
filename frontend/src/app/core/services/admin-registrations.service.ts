import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import {
  AdminRegistrationsQuery,
  RegistrationRecord,
  RegistrationStatus,
  UpdateRegistrationStatusPayload,
} from '../../shared/models/registration.model';
import { PaginatedResponse } from '../../shared/models/pagination.model';

@Injectable({
  providedIn: 'root',
})
export class AdminRegistrationsService {
  private readonly http = inject(HttpClient);

  getAll(query: AdminRegistrationsQuery = {}): Observable<PaginatedResponse<RegistrationRecord>> {
    let params = new HttpParams();

    if (query.page) {
      params = params.set('page', query.page);
    }

    if (query.pageSize) {
      params = params.set('pageSize', query.pageSize);
    }

    if (query.search) {
      params = params.set('search', query.search);
    }

    if (query.status) {
      params = params.set('status', query.status);
    }

    if (query.workshopId) {
      params = params.set('workshopId', query.workshopId);
    }

    return this.http.get<PaginatedResponse<RegistrationRecord>>(`${API_BASE_URL}/admin/registrations`, {
      params,
    });
  }

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
