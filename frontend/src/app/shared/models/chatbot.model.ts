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
  sourceType: 'faq' | 'workshop' | 'guidance' | 'fallback';
  suggestions: ChatbotSuggestion[];
  matchedFaqIds: number[];
  matchedWorkshopIds: number[];
  fallbackToContact: boolean;
}
