import {AppState} from '../../../store';
import {NotificationModel} from '../models/notification.model';
import {NotificationsActions, NotificationsActionTypes} from './notifications.actions';

export interface FeatureState extends AppState {
  notifications: State;
}

export interface State {
  alerts: NotificationModel[];
  warns: NotificationModel[];
  notifications: NotificationModel[];
}

export const initialState: State = {
  alerts: [],
  warns: [],
  notifications: [],
};

export function reducer(state = initialState, action: NotificationsActions): State {
  switch (action.type) {
    case NotificationsActionTypes.ADD_ALERT:
      return {
        ...state,
        alerts: [
          new NotificationModel({
            type: 'danger',
            ...action.payload,
          }),
          ...state.alerts.filter(alert => alert.message !== action.payload.message),
        ],
      };
    case NotificationsActionTypes.ADD_WARN:
      return {
        ...state,
        warns: [
          new NotificationModel({
            type: 'warning',
            ...action.payload,
          }),
          ...state.warns.filter(warning => warning.message !== action.payload.message),
        ],
      };
    case NotificationsActionTypes.ADD_NOTIFICATION:
      if (action.payload.type === 'success') {
        return {
          ...state,
          notifications: [
            new NotificationModel(action.payload),
            ...state.notifications.filter(notification => notification.type === 'success'),
          ]
        }
      }
      return {
        ...state,
        notifications: [
          new NotificationModel(action.payload), 
          ...state.notifications.filter(notification => notification.message !== action.payload.message)],
      };
    case NotificationsActionTypes.REMOVE_ALERT:
      state.alerts.splice(action.payload, 1);
      return {
        ...state,
        alerts: [...state.alerts],
      };
    case NotificationsActionTypes.REMOVE_ALERT_BY_ALIAS:
      return {
        ...state,
        alerts: state.alerts.filter(alert => alert.alias !== action.payload),
      };
    case NotificationsActionTypes.REMOVE_WARN:
      state.warns.splice(action.payload, 1);
      return {
        ...state,
        warns: [...state.warns],
      };
    case NotificationsActionTypes.REMOVE_WARN_BY_ALIAS:
      return {
        ...state,
        warns: state.warns.filter(warn => warn.alias !== action.payload),
      };
    case NotificationsActionTypes.REMOVE_NOTIFICATION:
      state.notifications.splice(action.payload, 1);
      return {
        ...state,
        notifications: [...state.notifications],
      };
    default:
      return state;
  }
}
