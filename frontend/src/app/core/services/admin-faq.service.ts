import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import {
  CreateFaqEntryPayload,
  FaqEntry,
  UpdateFaqEntryPayload,
} from '../../shared/models/faq.model';

@Injectable({
  providedIn: 'root',
})
export class AdminFaqService {
  private readonly http = inject(HttpClient);

  getAll(): Observable<FaqEntry[]> {
    return this.http.get<FaqEntry[]>(`${API_BASE_URL}/admin/faq`);
  }

  create(payload: CreateFaqEntryPayload): Observable<FaqEntry> {
    return this.http.post<FaqEntry>(`${API_BASE_URL}/admin/faq`, payload);
  }

  update(id: number, payload: UpdateFaqEntryPayload): Observable<FaqEntry> {
    return this.http.patch<FaqEntry>(`${API_BASE_URL}/admin/faq/${id}`, payload);
  }

  remove(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${API_BASE_URL}/admin/faq/${id}`);
  }
}
