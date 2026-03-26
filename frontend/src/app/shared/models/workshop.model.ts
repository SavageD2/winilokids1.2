export type WorkshopCalendarSyncStatus = 'INACTIVE' | 'DISABLED' | 'PENDING' | 'SYNCED' | 'FAILED';

export interface Workshop {
  id: number;
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  startAt: string;
  endAt: string | null;
  location: string;
  recommendedAgeMin: number | null;
  recommendedAgeMax: number | null;
  capacity: number | null;
  isPublished: boolean;
  registrationsCount: number;
  availablePlaces: number | null;
  googleCalendarEventUrl?: string | null;
  googleCalendarSyncedAt?: string | null;
  googleCalendarSyncError?: string | null;
  googleCalendarSyncStatus?: WorkshopCalendarSyncStatus;
}

export interface CreateWorkshopPayload {
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  startAt: string;
  endAt?: string | null;
  location: string;
  recommendedAgeMin?: number | null;
  recommendedAgeMax?: number | null;
  capacity?: number | null;
  isPublished?: boolean;
}

export interface UpdateWorkshopPayload extends Partial<CreateWorkshopPayload> {}
