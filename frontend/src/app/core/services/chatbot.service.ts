import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { ChatbotMessageRequest, ChatbotMessageResponse } from '../../shared/models/chatbot.model';

@Injectable({
  providedIn: 'root',
})
export class ChatbotService {
  private readonly http = inject(HttpClient);

  sendMessage(payload: ChatbotMessageRequest): Observable<ChatbotMessageResponse> {
    return this.http.post<ChatbotMessageResponse>(`${API_BASE_URL}/chatbot/messages`, payload);
  }
}
