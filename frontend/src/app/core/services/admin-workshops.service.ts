import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import {
  CreateWorkshopPayload,
  UpdateWorkshopPayload,
  Workshop,
} from '../../shared/models/workshop.model';

@Injectable({
  providedIn: 'root',
})
export class AdminWorkshopsService {
  private readonly http = inject(HttpClient);

  getAll(): Observable<Workshop[]> {
    return this.http.get<Workshop[]>(`${API_BASE_URL}/admin/workshops`);
  }

  getOne(id: number): Observable<Workshop> {
    return this.http.get<Workshop>(`${API_BASE_URL}/admin/workshops/${id}`);
  }

  create(payload: CreateWorkshopPayload): Observable<Workshop> {
    return this.http.post<Workshop>(`${API_BASE_URL}/admin/workshops`, payload);
  }

  update(id: number, payload: UpdateWorkshopPayload): Observable<Workshop> {
    return this.http.patch<Workshop>(`${API_BASE_URL}/admin/workshops/${id}`, payload);
  }

  remove(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${API_BASE_URL}/admin/workshops/${id}`);
  }
}
