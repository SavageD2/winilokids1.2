import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { ContactMessage, ContactRecord } from '../../shared/models/contact.model';

@Injectable({
  providedIn: 'root',
})
export class ContactsService {
  private readonly http = inject(HttpClient);

  create(payload: ContactMessage): Observable<ContactRecord> {
    return this.http.post<ContactRecord>(`${API_BASE_URL}/contacts`, payload);
  }
}
