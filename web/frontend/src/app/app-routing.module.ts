import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {AppInitGuard} from './core/services/guards/app-init.guard';
import {AuthGuard} from './core/services/guards/auth.guard';
import {AppViewGuard} from './shared/components/top-global-menu/app-view.guard';
import {appRoute, auth, dashboard, login} from './shared/utils/routes.names';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: appRoute,
      },
      {
        path: appRoute,
        loadChildren: () => import('./pages/streams/streams.module').then((m) => m.StreamsModule),
        canActivate: [AuthGuard, AppViewGuard],
        canActivateChild: [AuthGuard],
      },
    ],
    canActivateChild: [AppInitGuard],
  },
  {
    path: auth,
    loadChildren: () =>
      import('./pages/auth-pages/auth-pages.module').then((m) => m.AuthPagesModule),
  },
  {
    path: dashboard,
    canActivate: [AppViewGuard],
    loadChildren: () => import('./pages/dashboard/dashboard.module').then((m) => m.DashboardModule),
  },
  {
    path: login,
    redirectTo: auth,
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {relativeLinkResolution: 'legacy'})],
  exports: [RouterModule],
})
export class AppRoutingModule {}
