export interface AdminDashboardUpcomingWorkshop {
  id: number;
  title: string;
  slug: string;
  startAt: string;
  location: string;
  registrationsCount: number;
  capacity: number | null;
}

export interface AdminDashboardSummary {
  workshopsCount: number;
  registrationsCount: number;
  contactsCount: number;
  upcomingWorkshops: AdminDashboardUpcomingWorkshop[];
}
