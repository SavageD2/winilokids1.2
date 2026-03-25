import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './core/layouts/admin-layout/admin-layout.component';
import { PublicLayoutComponent } from './core/layouts/public-layout/public-layout.component';
import { adminAuthGuard } from './core/guards/admin-auth.guard';
import { adminLoginGuard } from './core/guards/admin-login.guard';
import { AdminLoginPageComponent } from './features/admin/auth/admin-login-page.component';
import { AdminDashboardPageComponent } from './features/admin/dashboard/admin-dashboard-page.component';
import { AdminContactsPageComponent } from './features/admin/contacts/admin-contacts-page.component';
import { AdminRegistrationsPageComponent } from './features/admin/registrations/admin-registrations-page.component';
import { AdminWorkshopsPageComponent } from './features/admin/workshops/admin-workshops-page.component';
import { parentAuthGuard } from './core/guards/parent-auth.guard';
import { AccountPageComponent } from './features/public/account/account-page.component';
import { ContactPageComponent } from './features/public/contact/contact-page.component';
import { HomePageComponent } from './features/public/home/home-page.component';
import { RegistrationPageComponent } from './features/public/registration/registration-page.component';
import { WorkshopDetailPageComponent } from './features/public/workshops/workshop-detail-page.component';
import { WorkshopsPageComponent } from './features/public/workshops/workshops-page.component';

export const routes: Routes = [
  {
    path: '',
    component: PublicLayoutComponent,
    children: [
      {
        path: '',
        component: HomePageComponent,
        title: 'Winilo Kids | Accueil',
      },
      {
        path: 'ateliers',
        component: WorkshopsPageComponent,
        title: 'Winilo Kids | Ateliers',
      },
      {
        path: 'ateliers/:slug',
        component: WorkshopDetailPageComponent,
        title: 'Winilo Kids | Detail atelier',
      },
      {
        path: 'inscription',
        component: AccountPageComponent,
        title: 'Winilo Kids | Inscription et connexion',
      },
      {
        path: 'reservation',
        canActivate: [parentAuthGuard],
        component: RegistrationPageComponent,
        title: 'Winilo Kids | Reservation atelier',
      },
      {
        path: 'contact',
        component: ContactPageComponent,
        title: 'Winilo Kids | Contact',
      },
    ],
  },
  {
    path: 'admin/login',
    canActivate: [adminLoginGuard],
    component: AdminLoginPageComponent,
    title: 'Winilo Kids | Admin Login',
  },
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivateChild: [adminAuthGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard',
      },
      {
        path: 'dashboard',
        component: AdminDashboardPageComponent,
        title: 'Winilo Kids | Dashboard admin',
      },
      {
        path: 'ateliers',
        component: AdminWorkshopsPageComponent,
        title: 'Winilo Kids | Gestion ateliers',
      },
      {
        path: 'inscriptions',
        component: AdminRegistrationsPageComponent,
        title: 'Winilo Kids | Gestion inscriptions',
      },
      {
        path: 'contacts',
        component: AdminContactsPageComponent,
        title: 'Winilo Kids | Messages contact',
      },
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
