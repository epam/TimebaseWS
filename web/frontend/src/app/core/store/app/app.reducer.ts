import {AppInfoModel} from '../../../shared/models/app.info.model';
import {AppSettingsModel} from '../../../shared/models/app.settings.model';
import {AppActions, AppActionTypes} from './app.actions';

export interface State {
  app_init: boolean;
  app_is_visible: boolean;
  apiPrefix: string;
  wsPrefix: string;
  stompPrefix: string;
  authPrefix: string;
  appTitle: string;
  appVer: string;
  settings: AppSettingsModel;
  currencies: string[];
  preventRequests: boolean;
  appInfo: AppInfoModel;
}

export const initialState: State = {
  app_init: true,
  app_is_visible: true,
  apiPrefix: '/api/v0',
  wsPrefix: '/ws/v0/',
  stompPrefix: '/stomp/v0',
  authPrefix: '',
  appTitle: '',
  appVer: '',
  settings: null,
  currencies: null,
  preventRequests: false,
  appInfo: {
    name: null,
    version: null,
    timestamp: null,
    timebase: null,
    authentication: null,
  },
};

export function reducer(state = initialState, action: AppActions): State {
  switch (action.type) {
    case AppActionTypes.INIT_APP:
      return {
        ...state,
        app_init: true,
      };

    case AppActionTypes.SET_TITLE:
      return {
        ...state,
        appTitle: action.payload,
      };

    case AppActionTypes.SET_APP_INFO:
      return {
        ...state,
        appInfo: action.payload.info,
      };

    case AppActionTypes.SET_APP_SETTINGS:
      return {
        ...state,
        settings: {
          ...action.payload.settings,
          // chartMaxVisiblePoints: 5000,.
          // chartMaxPoints: 15000,
        },
      };

    case AppActionTypes.SET_CURRENCIES:
      return {
        ...state,
        currencies: action.payload.currencies,
      };

    case AppActionTypes.CHANGE_DOC_VISIBILITY:
      return {
        ...state,
        app_is_visible: action.payload.visible,
      };

    case AppActionTypes.PREVENT_HTTP_REQUESTS:
      return {
        ...state,
        preventRequests: true,
      };

    case AppActionTypes.ALLOW_HTTP_REQUESTS:
      return {
        ...state,
        preventRequests: false,
      };

    default:
      return state;
  }
}
