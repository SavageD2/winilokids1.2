export type ChatbotSourceType = 'faq' | 'workshop' | 'guidance' | 'fallback';

export interface ChatbotSuggestion {
  label: string;
  route: string;
}

export interface ChatbotMessageRequest {
  message: string;
  context?: {
    currentRoute?: string;
    workshopSlug?: string | null;
  };
}

export interface ChatbotMessageResponse {
  reply: string;
  sourceType: ChatbotSourceType;
  suggestions: ChatbotSuggestion[];
  matchedFaqIds: number[];
  matchedWorkshopIds: number[];
  fallbackToContact: boolean;
}

export type AdminChatbotSourceType = 'FAQ' | 'WORKSHOP' | 'GUIDANCE' | 'FALLBACK';

export interface ChatbotLogRecord {
  id: number;
  message: string;
  normalizedMessage: string;
  currentRoute: string | null;
  sourceType: AdminChatbotSourceType;
  fallbackToContact: boolean;
  matchedFaqIds: number[];
  matchedWorkshopIds: number[];
  reply: string;
  createdAt: string;
}

export interface AdminChatbotLogsQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  sourceType?: AdminChatbotSourceType;
  fallbackToContact?: boolean;
}

export interface AdminChatbotSummary {
  totalMessages: number;
  fallbackMessages: number;
  faqMessages: number;
  workshopMessages: number;
  guidanceMessages: number;
  recentMessages: ChatbotLogRecord[];
}
