import {Action} from '@ngrx/store';
import {NotificationModel} from '../models/notification.model';

export enum NotificationsActionTypes {
  ADD_ALERT = '[Notifications] Add Alert',
  REMOVE_ALERT = '[Notifications] Remove Alert',
  REMOVE_ALERT_BY_ALIAS = '[Notifications] Remove Alert By ALias',

  ADD_WARN = '[Notifications] Add Warn',
  REMOVE_WARN = '[Notifications] Remove Warn',

  ADD_NOTIFICATION = '[Notifications] Add Notification',
  REMOVE_NOTIFICATION = '[Notifications] Remove Notification',
  REMOVE_WEBSOCKET_NOTIFICATIONS = '[Notifications] Remove WebSocket Notification'
}

export class AddAlert implements Action {
  readonly type = NotificationsActionTypes.ADD_ALERT;

  constructor(public payload: NotificationModel) {}
}

export class RemoveAlertByAlias implements Action {
  readonly type = NotificationsActionTypes.REMOVE_ALERT_BY_ALIAS;

  constructor(public payload: string) {}
}

export class RemoveAlert implements Action {
  readonly type = NotificationsActionTypes.REMOVE_ALERT;

  constructor(public payload: number) {}
}

export class AddWarn implements Action {
  readonly type = NotificationsActionTypes.ADD_WARN;

  constructor(public payload: NotificationModel) {}
}

export class RemoveWarn implements Action {
  readonly type = NotificationsActionTypes.REMOVE_WARN;

  constructor(public payload: number) {}
}

export class AddNotification implements Action {
  readonly type = NotificationsActionTypes.ADD_NOTIFICATION;

  constructor(public payload: NotificationModel) {}
}

export class RemoveNotification implements Action {
  readonly type = NotificationsActionTypes.REMOVE_NOTIFICATION;

  constructor(public payload: number) {}
}

export class RemoveWebSocketNotifications implements Action {
  readonly type = NotificationsActionTypes.REMOVE_WEBSOCKET_NOTIFICATIONS;

  constructor() {}
}

export type NotificationsActions =
  | AddAlert
  | RemoveAlert
  | RemoveAlertByAlias
  | AddWarn
  | RemoveWarn
  | AddNotification
  | RemoveNotification
  | RemoveWebSocketNotifications;
