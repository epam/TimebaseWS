import { AuthProviderModel }                                from '../../../models/auth-provider.model';
import { AuthorizationServiceConfiguration, TokenResponse } from '@openid/appauth';
import { AuthActions, AuthActionTypes }                     from './auth.actions';
import { CustomTokenResponseModel }                         from '../../../models/customToken-response.model';


export const authFeatureKey = 'auth';

export interface State {
  tokenIsInitialized: boolean;
  providerSettings: AuthProviderModel;
  SSOConfiguration: AuthorizationServiceConfiguration;
  SSOTokenResponse: TokenResponse;
  customTokenResponse: CustomTokenResponseModel;
}

export const initialState: State = {
  tokenIsInitialized: false,
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
      };

    case AuthActionTypes.SILENT_UPDATE_TOKEN:
      const clearedToken = state.providerSettings.custom_provider ? {
        customTokenResponse: null,
      } : {
        SSOTokenResponse: null,
      };
      return {
        ...state,
        ...clearedToken,
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
      const tokenResp = state.providerSettings.custom_provider ? {
        customTokenResponse: action.payload.tokenResponse as CustomTokenResponseModel,
      } : {
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
