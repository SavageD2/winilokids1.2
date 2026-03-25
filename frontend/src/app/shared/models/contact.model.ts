export interface ContactMessage {
  name: string;
  email: string;
  phone?: string | null;
  message: string;
}

export interface ContactRecord extends ContactMessage {
  id: number;
  createdAt: string;
}

export interface AdminContactsQuery {
  page?: number;
  pageSize?: number;
  search?: string;
}
