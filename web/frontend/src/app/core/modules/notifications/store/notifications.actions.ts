import { Action } from '@ngrx/store';

export enum NotificationsActionTypes {
  ADD_ALERT = '[Notifications] Add Alert',
  REMOVE_ALERT = '[Notifications] Remove Alert',
  
  ADD_WARN = '[Notifications] Add Warn',
  REMOVE_WARN = '[Notifications] Remove Warn',
  
  ADD_NOTIFICATION = '[Notifications] Add Notification',
  REMOVE_NOTIFICATION = '[Notifications] Remove Notification',
}

export class AddAlert implements Action {
  readonly type = NotificationsActionTypes.ADD_ALERT;
  
  constructor(public payload: {}) {}
}

export class RemoveAlert implements Action {
  readonly type = NotificationsActionTypes.REMOVE_ALERT;
  
  constructor(public payload: number) {}
}

export class AddWarn implements Action {
  readonly type = NotificationsActionTypes.ADD_WARN;
  
  constructor(public payload: {}) {}
}

export class RemoveWarn implements Action {
  readonly type = NotificationsActionTypes.REMOVE_WARN;
  
  constructor(public payload: number) {}
}

export class AddNotification implements Action {
  readonly type = NotificationsActionTypes.ADD_NOTIFICATION;
  
  constructor(public payload: {}) {}
}

export class RemoveNotification implements Action {
  readonly type = NotificationsActionTypes.REMOVE_NOTIFICATION;
  
  constructor(public payload: number) {}
}

export type NotificationsActions = AddAlert |
  RemoveAlert |
  AddWarn |
  RemoveWarn |
  AddNotification |
  RemoveNotification;
