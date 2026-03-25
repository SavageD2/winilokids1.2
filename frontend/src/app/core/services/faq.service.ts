import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { FaqEntry } from '../../shared/models/faq.model';

@Injectable({
  providedIn: 'root',
})
export class FaqService {
  private readonly http = inject(HttpClient);

  getPublished(): Observable<FaqEntry[]> {
    return this.http.get<FaqEntry[]>(`${API_BASE_URL}/faq`);
  }
}
