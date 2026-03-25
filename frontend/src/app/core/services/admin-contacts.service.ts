import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { ContactRecord } from '../../shared/models/contact.model';

@Injectable({
  providedIn: 'root',
})
export class AdminContactsService {
  private readonly http = inject(HttpClient);

  getAll(): Observable<ContactRecord[]> {
    return this.http.get<ContactRecord[]>(`${API_BASE_URL}/admin/contacts`);
  }
}
