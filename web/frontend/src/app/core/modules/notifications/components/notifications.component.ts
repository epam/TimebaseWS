import {ChangeDetectorRef, Component, OnDestroy, OnInit} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {Observable, ReplaySubject} from 'rxjs';
import {delay, takeUntil} from 'rxjs/operators';
import {NotificationModel} from '../models/notification.model';
import * as NotificationsActions from '../store/notifications.actions';
import * as fromNotifications from '../store/notifications.reducer';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss'],
})
export class NotificationsComponent implements OnDestroy, OnInit {
  public notificationsState: Observable<fromNotifications.State>;
  private destroy$ = new ReplaySubject(1);

  constructor(
    private notificationsStore: Store<fromNotifications.FeatureState>,
    private cdRef: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.notificationsState = this.notificationsStore.pipe(select('notifications'));
    this.notificationsState
      .pipe(takeUntil(this.destroy$), delay(0))
      .subscribe(() => this.cdRef.detectChanges());
  }

  onClosed(notification: NotificationModel, index: number) {
    let actionName = '';
    switch (notification.type) {
      case 'danger':
        actionName = 'RemoveAlert';
        break;
      case 'warning':
        actionName = 'RemoveWarn';
        break;
      default:
        actionName = 'RemoveNotification';
        break;
    }
    if (notification.closeAction) {
      notification.closeAction();
    } else if (
      notification.requestDialogParams &&
      notification.requestDialogParams.closeActions &&
      notification.requestDialogParams.closeActions.onCancel
    ) {
    }
    this.notificationsStore.dispatch(new NotificationsActions[actionName](index));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
