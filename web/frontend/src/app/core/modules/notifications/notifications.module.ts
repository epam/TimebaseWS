import { NgModule }               from '@angular/core';
import { StoreModule }            from '@ngrx/store';
import { AlertModule }            from 'ngx-bootstrap';
import { NotificationsComponent } from './components/notifications.component';
import * as fromNotifications     from './store/notifications.reducer';
import { SharedModule }           from '../../../shared/shared.module';

@NgModule({
  imports: [
    SharedModule,
    AlertModule.forRoot(),
    StoreModule.forFeature('notifications', fromNotifications.reducer),
  ],
  declarations: [NotificationsComponent],
  exports: [NotificationsComponent],
})
export class NotificationsModule {
}
