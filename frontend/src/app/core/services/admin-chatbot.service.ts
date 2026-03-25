import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import {
  AdminChatbotLogsQuery,
  AdminChatbotSummary,
  ChatbotLogRecord,
} from '../../shared/models/chatbot.model';
import { PaginatedResponse } from '../../shared/models/pagination.model';

@Injectable({
  providedIn: 'root',
})
export class AdminChatbotService {
  private readonly http = inject(HttpClient);

  getSummary(): Observable<AdminChatbotSummary> {
    return this.http.get<AdminChatbotSummary>(`${API_BASE_URL}/admin/chatbot/summary`);
  }

  getLogs(query: AdminChatbotLogsQuery = {}): Observable<PaginatedResponse<ChatbotLogRecord>> {
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

    if (query.sourceType) {
      params = params.set('sourceType', query.sourceType);
    }

    if (query.fallbackToContact !== undefined) {
      params = params.set('fallbackToContact', String(query.fallbackToContact));
    }

    return this.http.get<PaginatedResponse<ChatbotLogRecord>>(`${API_BASE_URL}/admin/chatbot/logs`, {
      params,
    });
  }
}
