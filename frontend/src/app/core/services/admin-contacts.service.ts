import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { AdminContactsQuery, ContactRecord } from '../../shared/models/contact.model';
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

    return this.http.get<PaginatedResponse<ContactRecord>>(`${API_BASE_URL}/admin/contacts`, {
      params,
    });
  }
}
