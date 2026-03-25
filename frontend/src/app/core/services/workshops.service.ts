import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { Workshop } from '../../shared/models/workshop.model';

@Injectable({
  providedIn: 'root',
})
export class WorkshopsService {
  private readonly http = inject(HttpClient);

  getPublished(): Observable<Workshop[]> {
    return this.http.get<Workshop[]>(`${API_BASE_URL}/workshops`);
  }

  getBySlug(slug: string): Observable<Workshop> {
    return this.http.get<Workshop>(`${API_BASE_URL}/workshops/${slug}`);
  }
}
