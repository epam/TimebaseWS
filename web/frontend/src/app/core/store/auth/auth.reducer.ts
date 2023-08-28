import {AuthorizationServiceConfiguration, TokenResponse} from '@openid/appauth';
import {AuthProviderModel} from '../../../models/auth-provider.model';
import {CustomTokenResponseModel} from '../../../models/customToken-response.model';
import {AuthActions, AuthActionTypes} from './auth.actions';

export const authFeatureKey = 'auth';

export interface State {
  tokenIsInitialized: boolean;
  tokenRefreshTime: number,
  providerSettings: AuthProviderModel;
  SSOConfiguration: AuthorizationServiceConfiguration;
  SSOTokenResponse: TokenResponse;
  customTokenResponse: CustomTokenResponseModel;
}

export const initialState: State = {
  tokenIsInitialized: false,
  tokenRefreshTime: null,
  providerSettings: null,
  SSOConfiguration: null,
  SSOTokenResponse: null,
  customTokenResponse: null,
};

export function reducer(state = initialState, action: AuthActions): State {
  switch (action.type) {
    case AuthActionTypes.SET_AUTH_PROVIDER_SETTINGS:
      return {
        ...state,
        providerSettings: new AuthProviderModel({
          ...action.payload.settings,
          audience: action.payload.settings.audience || '',
        }),
      };

    case AuthActionTypes.INIT_TOKEN:
      return {
        ...state,
        tokenIsInitialized: true,
        tokenRefreshTime: Date.now()
      };

    case AuthActionTypes.TOKEN_UPDATED:
      return state;

    case AuthActionTypes.SILENT_UPDATE_TOKEN:
      const clearedToken = state.providerSettings.custom_provider
        ? {
            // После очистки токена при вызове AuthGuard выкидывает на логин, тк запрос за новым токеном еще не прошел
            // customTokenResponse: null,
          }
        : {
            SSOTokenResponse: null,
          };
      return {
        ...state,
        ...clearedToken,
        tokenRefreshTime: Date.now()
      };

    // case AuthActionTypes.SET_ACCESS_TOKEN:
    //   return {
    //     ...state,
    //     token: action.payload.token,
    //   };

    case AuthActionTypes.SAVE_SSO_CONFIG:
      return {
        ...state,
        SSOConfiguration: action.payload.configuration,
      };

    case AuthActionTypes.LOGIN:
      const tokenResp = state.providerSettings.custom_provider
        ? {
            customTokenResponse: action.payload.tokenResponse as CustomTokenResponseModel,
          }
        : {
            SSOTokenResponse: action.payload.tokenResponse as TokenResponse,
          };
      return {
        ...state,
        ...tokenResp,
      };

    default:
      return state;
  }
}
