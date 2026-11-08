import { Routes } from '@angular/router';

import { LayoutComponent } from '../../libs/layout/layout-component/layout.component';
import { authGuard } from '../../libs/data/auth-data/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('../../libs/auth/login/login.component').then(
        (m) => m.LoginComponent,
      ),
  },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'schedule',
        pathMatch: 'full',
      },
      {
        path: 'schedule',
        loadComponent: () =>
          import('../../libs/schedule/schedule-page/schedule.component').then(
            (m) => m.ScheduleComponent,
          ),
      },
      {
        path: 'statistics',
        loadComponent: () =>
          import('../../libs/statistics/statistics-page/statistics.component').then(
            (m) => m.StatisticsComponent,
          ),
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'schedule',
  },
];
