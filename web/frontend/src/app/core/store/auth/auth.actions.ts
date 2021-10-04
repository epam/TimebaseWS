import { Action }                                           from '@ngrx/store';
import { AuthProviderModel }                                from '../../../models/auth-provider.model';
import { CustomTokenResponseModel }                         from '../../../models/customToken-response.model';
import { AuthorizationServiceConfiguration, TokenResponse } from '@openid/appauth';

export enum AuthActionTypes {
  GET_AUTH_PROVIDER_INFO = '[Auth] Get Auth Provider Info',
  SET_AUTH_PROVIDER_SETTINGS = '[Auth] Set Auth Provider Settings',

  START_AUTH_PROCESS = '[Auth] Start Auth Process',

  SILENT_UPDATE_TOKEN = '[Auth] Silent Token Update',
  SILENT_UPDATE_SSO_TOKEN = '[Auth:SSO] Silent SSO Token Update',
  SILENT_UPDATE_CUSTOM_TOKEN = '[Auth] Silent Custom Token Update',

  SAVE_SSO_CONFIG = '[Auth:SSO] Save config',
  LOAD_SSO_CONFIGURATION = '[Auth:SSO] Load configuration for SSO-provider',
  REDIRECT_TO_AUTH_PROVIDER = '[Auth:SSO] Redirect to Authorisation Provider',
  PROCESS_SIGN_IN_REDIRECT = '[Auth:SSO] Process sign-in redirection',

  INIT_TOKEN = '[Auth] Initialise Token',
  // SET_ACCESS_TOKEN = '[Auth] Set Access token into state',

  TRY_LOGIN = '[Auth] Try login',
  LOGIN = '[Auth] Login',
  LOGOUT = '[Auth] Logout',
}

export class GetAuthProviderInfo implements Action {
  readonly type = AuthActionTypes.GET_AUTH_PROVIDER_INFO;
}

export class SetAuthProviderSettings implements Action {
  readonly type = AuthActionTypes.SET_AUTH_PROVIDER_SETTINGS;

  constructor(public payload: {
    settings: AuthProviderModel,
  }) {}
}

export class StartAuthProcess implements Action {
  readonly type = AuthActionTypes.START_AUTH_PROCESS;
}


export abstract class SsoConfigDependentAction implements Action {
  public readonly type: string;
  // public payload: { provider: string };
}

export class SilentUpdateToken implements Action {
  readonly type = AuthActionTypes.SILENT_UPDATE_TOKEN;
}

export class LoadSSOConfiguration extends SsoConfigDependentAction {
  readonly type = AuthActionTypes.LOAD_SSO_CONFIGURATION;

  constructor(public payload: {
    provider: string,
  }) {
    super();
  }
}

export class SaveSSOConfig implements Action {
  readonly type = AuthActionTypes.SAVE_SSO_CONFIG;

  constructor(public payload: {
    configuration: AuthorizationServiceConfiguration,
  }) {
  }
}

export class SilentUpdateSSOToken extends SsoConfigDependentAction {
  readonly type = AuthActionTypes.SILENT_UPDATE_SSO_TOKEN;

  constructor() {
    super();
  }
}

export class RedirectToAuthProvider extends SsoConfigDependentAction/* implements Action*/ {
  readonly type = AuthActionTypes.REDIRECT_TO_AUTH_PROVIDER;

  constructor() {
    super();
  }
}

export class ProcessSingInRedirect extends SsoConfigDependentAction {
  readonly type = AuthActionTypes.PROCESS_SIGN_IN_REDIRECT;

  constructor() {
    super();
  }
}

export class SilentUpdateCustomToken implements Action {
  readonly type = AuthActionTypes.SILENT_UPDATE_CUSTOM_TOKEN;
}

export class InitialiseToken implements Action {
  readonly type = AuthActionTypes.INIT_TOKEN;
}

// export class SetAccessToken implements Action {
//   readonly type = AuthActionTypes.SET_ACCESS_TOKEN;
//
//   constructor(public payload: {
//     token: string,
//   }) {}
// }

export class TryLogIn implements Action {
  readonly type = AuthActionTypes.TRY_LOGIN;

  constructor(public payload: {
    password: string,
    username: string,
  }) {}
}

export class LogIn implements Action {
  readonly type = AuthActionTypes.LOGIN;

  constructor(public payload: {
    tokenResponse: TokenResponse | CustomTokenResponseModel,
  }) {}
}

export class LogOut implements Action {
  readonly type = AuthActionTypes.LOGOUT;
}

export type AuthActions =
  GetAuthProviderInfo |
  SetAuthProviderSettings |
  StartAuthProcess |
  SilentUpdateToken |
  SilentUpdateSSOToken |
  SilentUpdateCustomToken |
  InitialiseToken |
  // SetAccessToken |
  LoadSSOConfiguration |
  SaveSSOConfig |
  RedirectToAuthProvider |
  ProcessSingInRedirect |
  TryLogIn |
  LogIn |
  LogOut
  ;
