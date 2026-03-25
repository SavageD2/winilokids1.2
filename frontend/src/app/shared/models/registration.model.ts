export interface CreateRegistrationPayload {
  parentName: string;
  parentEmail: string;
  parentPhone?: string | null;
  childFirstName: string;
  childAge: number;
  workshopId: number;
  message?: string | null;
}

export interface RegistrationRecord extends CreateRegistrationPayload {
  id: number;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'ATTENDED';
  createdAt: string;
  updatedAt: string;
  workshop: {
    id: number;
    title: string;
    slug: string;
    startAt: string;
    location: string;
  };
}
