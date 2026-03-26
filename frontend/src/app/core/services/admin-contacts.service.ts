import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import {
  AdminContactsQuery,
  ContactRecord,
  ContactStatus,
  UpdateContactPayload,
} from '../../shared/models/contact.model';
import { PaginatedResponse } from '../../shared/models/pagination.model';

@Injectable({
  providedIn: 'root',
})
export class AdminContactsService {
  private readonly http = inject(HttpClient);

  getAll(query: AdminContactsQuery = {}): Observable<PaginatedResponse<ContactRecord>> {
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

    return this.http.get<PaginatedResponse<ContactRecord>>(`${API_BASE_URL}/admin/contacts`, {
      params,
    });
  }

  update(id: number, payload: UpdateContactPayload): Observable<ContactRecord> {
    return this.http.patch<ContactRecord>(`${API_BASE_URL}/admin/contacts/${id}`, payload);
  }

  getStatuses(): ContactStatus[] {
    return ['NEW', 'IN_PROGRESS', 'RESOLVED', 'ARCHIVED'];
  }
}
