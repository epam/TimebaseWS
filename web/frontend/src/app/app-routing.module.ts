import { NgModule }              from '@angular/core';
import { RouterModule, Routes }  from '@angular/router';
import { AppInitGuard }          from './core/services/guards/app-init.guard';
import { AuthGuard }             from './core/services/guards/auth.guard';
import { appRoute, auth, login } from './shared/utils/routes.names';

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
        loadChildren: () => import('./pages/streams/streams.module').then(m => m.StreamsModule),
        canActivate: [AuthGuard],
        canActivateChild: [AuthGuard],
      },
    ],
    canActivateChild: [AppInitGuard],
  },
  {
    path: auth,
    loadChildren: () => import('./pages/auth-pages/auth-pages.module').then(m => m.AuthPagesModule),
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
export class AppRoutingModule {
}
