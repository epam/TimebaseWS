import { Action }           from '@ngrx/store';
import { AppInfoModel }     from '../../../shared/models/app.info.model';
import { AppSettingsModel } from '../../../shared/models/app.settings.model';

export enum AppActionTypes {
  INIT_APP = '[App] Init app',
  SET_TITLE = '[App] Set title',

  GET_APP_VER = '[App] Get app version',
  SET_APP_VER = '[App] Set app version',

  GET_APP_SETTINGS = '[App] Get app settings',
  SET_APP_SETTINGS = '[App] Set app settings',

  GET_APP_INFO = '[App] Get app info',
  SET_APP_INFO = '[App] Set app info',

  ADD_SYSTEM_SUBSCRIPTION = '[App] Add system subscription',
  STOP_SYSTEM_SUBSCRIPTION = '[App] Stop system subscription',

  SYSTEM_SUBSCRIPTION_IS_TRIGGERED = '[App] System subscription is triggered',

  GET_CURRENCIES = '[App] Get currencies',
  SET_CURRENCIES = '[App] Set currencies',

  START_LISTENING_VISIBILITY_CHANGE = '[App] Start Listening Visibility Change',
  CHANGE_DOC_VISIBILITY = '[App] Change Document Visibility',

  OFFER_TO_SAVE_FILE = '[App] Offer to save file',

  SHOW_LOGIN_ALERT = '[App] Show Login Alert',
  PREVENT_HTTP_REQUESTS = '[App] Prevent HTTP Requests',
  ALLOW_HTTP_REQUESTS = '[App] Allow HTTP Requests',
}

export class InitApp implements Action {
  readonly type = AppActionTypes.INIT_APP;
}

export class SetTitle implements Action {
  readonly type = AppActionTypes.SET_TITLE;

  constructor(public payload: string) {}
}

export class GetAppVer implements Action {
  readonly type = AppActionTypes.GET_APP_VER;
}

export class SetAppVer implements Action {
  readonly type = AppActionTypes.SET_APP_VER;

  constructor(public payload: string) {}
}

export class GetAppSettings implements Action {
  readonly type = AppActionTypes.GET_APP_SETTINGS;
}

export class SetAppSettings implements Action {
  readonly type = AppActionTypes.SET_APP_SETTINGS;

  constructor(public payload: {
    settings: AppSettingsModel,
  }) {}
}
export class GetAppInfo implements Action {
  readonly type = AppActionTypes.GET_APP_INFO;
}

export class SetAppInfo implements Action {
  readonly type = AppActionTypes.SET_APP_INFO;

  constructor(public payload: {
    info: AppInfoModel,
  }) {}
}

export class AddSystemSubscription implements Action {
  readonly type = AppActionTypes.ADD_SYSTEM_SUBSCRIPTION;
}

export class StopSystemSubscription implements Action {
  readonly type = AppActionTypes.STOP_SYSTEM_SUBSCRIPTION;
}

export class SystemSubscriptionIsTriggered implements Action {
  readonly type = AppActionTypes.SYSTEM_SUBSCRIPTION_IS_TRIGGERED;
}

export class GetCurrencies implements Action {
  readonly type = AppActionTypes.GET_CURRENCIES;
}

export class SetCurrencies implements Action {
  readonly type = AppActionTypes.SET_CURRENCIES;

  constructor(public payload: {
                currencies: string[];
              },
  ) { }
}

export class StartListeningVisibilityChange implements Action {
  readonly type = AppActionTypes.START_LISTENING_VISIBILITY_CHANGE;
}

export class ChangeDocVisibility implements Action {
  readonly type = AppActionTypes.CHANGE_DOC_VISIBILITY;

  constructor(
    public payload: {
      visible: boolean;
    },
  ) { }
}

export class ShowLoginAlert implements Action {
  readonly type = AppActionTypes.SHOW_LOGIN_ALERT;
}

export class PreventHTTPRequests implements Action {
  readonly type = AppActionTypes.PREVENT_HTTP_REQUESTS;
}

export class AllowHTTPRequests implements Action {
  readonly type = AppActionTypes.ALLOW_HTTP_REQUESTS;
}

export class OfferToSaveFile implements Action {
  readonly type = AppActionTypes.OFFER_TO_SAVE_FILE;

  constructor(public payload: {
    data: any,
    fileType: string,
    fileName?: string,
  }) {}
}

export type AppActions =
  InitApp |
  SetTitle |
  GetAppInfo |
  SetAppInfo |
  GetAppSettings |
  SetAppSettings |
  AddSystemSubscription |
  StopSystemSubscription |
  SystemSubscriptionIsTriggered |
  GetCurrencies |
  SetCurrencies |
  StartListeningVisibilityChange |
  ChangeDocVisibility |
  ShowLoginAlert |
  PreventHTTPRequests |
  AllowHTTPRequests |
  OfferToSaveFile
  ;
