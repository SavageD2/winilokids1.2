export interface ContactMessage {
  name: string;
  email: string;
  phone?: string | null;
  message: string;
}

export type ContactStatus = 'NEW' | 'IN_PROGRESS' | 'RESOLVED' | 'ARCHIVED';

export interface ContactRecord extends ContactMessage {
  id: number;
  status: ContactStatus;
  adminNotes?: string | null;
  handledAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminContactsQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: ContactStatus;
}

export interface UpdateContactPayload {
  status?: ContactStatus;
  adminNotes?: string | null;
}
