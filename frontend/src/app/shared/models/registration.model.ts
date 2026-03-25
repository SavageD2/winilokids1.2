export type RegistrationStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'ATTENDED';

export interface CreateRegistrationPayload {
  childFirstName: string;
  childAge: number;
  workshopId: number;
  message?: string | null;
}

export interface RegistrationRecord extends CreateRegistrationPayload {
  id: number;
  parentName: string;
  parentEmail: string;
  parentPhone?: string | null;
  status: RegistrationStatus;
  createdAt: string;
  updatedAt: string;
  workshop: {
    id: number;
    title: string;
    slug: string;
    startAt: string;
    location: string;
  };
  parentAccount?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
  } | null;
}

export interface UpdateRegistrationStatusPayload {
  status: RegistrationStatus;
}

export interface AdminRegistrationsQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: RegistrationStatus;
  workshopId?: number;
}
