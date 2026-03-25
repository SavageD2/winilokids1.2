import { Routes } from '@angular/router';
import { ContactPageComponent } from './features/public/contact/contact-page.component';
import { HomePageComponent } from './features/public/home/home-page.component';
import { RegistrationPageComponent } from './features/public/registration/registration-page.component';
import { WorkshopDetailPageComponent } from './features/public/workshops/workshop-detail-page.component';
import { WorkshopsPageComponent } from './features/public/workshops/workshops-page.component';

export const routes: Routes = [
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
    component: RegistrationPageComponent,
    title: 'Winilo Kids | Inscription',
  },
  {
    path: 'contact',
    component: ContactPageComponent,
    title: 'Winilo Kids | Contact',
  },
  {
    path: '**',
    redirectTo: '',
  },
];
