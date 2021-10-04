import { NgModule }              from '@angular/core';
import { RouterModule }          from '@angular/router';
import { LoginGuard }            from '../../core/services/guards/login.guard';
import { LogoModule }            from '../../shared/logo/logo.module';
import { SharedModule }          from '../../shared/shared.module';
import { AccessDeniedComponent } from './components/access-denied/access-denied.component';
import { LoginComponent }        from './components/login/login.component';

@NgModule({
  declarations: [LoginComponent, AccessDeniedComponent],
  imports: [
    SharedModule,
    LogoModule,
    RouterModule.forChild([
      {
        path: '',
        children: [
          {
            path: '',
            pathMatch: 'full',
            redirectTo: 'login',
          },
          {
            path: 'login',
            component: LoginComponent,
            canActivate: [LoginGuard],
          },
          {
            path: 'access-denied',
            component: AccessDeniedComponent,
          },
        ],
      },
    ]),
  ],
  exports: [
    RouterModule,
  ],
})
export class AuthPagesModule {
}
