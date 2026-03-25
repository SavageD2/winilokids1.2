export interface FaqEntry {
  id: number;
  question: string;
  answer: string;
  category: string | null;
  displayOrder: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFaqEntryPayload {
  question: string;
  answer: string;
  category?: string | null;
  displayOrder?: number;
  isPublished?: boolean;
}

export interface UpdateFaqEntryPayload extends Partial<CreateFaqEntryPayload> {}
