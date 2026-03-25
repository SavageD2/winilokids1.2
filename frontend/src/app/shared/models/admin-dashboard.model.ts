export interface AdminDashboardUpcomingWorkshop {
  id: number;
  title: string;
  slug: string;
  startAt: string;
  location: string;
  registrationsCount: number;
  capacity: number | null;
  availablePlaces: number | null;
}

export interface AdminDashboardSummary {
  workshopsCount: number;
  publishedWorkshopsCount: number;
  draftWorkshopsCount: number;
  registrationsCount: number;
  pendingRegistrationsCount: number;
  confirmedRegistrationsCount: number;
  cancelledRegistrationsCount: number;
  attendedRegistrationsCount: number;
  contactsCount: number;
  chatbotMessagesCount: number;
  chatbotFallbackCount: number;
  chatbotFaqMessagesCount: number;
  chatbotWorkshopMessagesCount: number;
  upcomingWorkshops: AdminDashboardUpcomingWorkshop[];
}
