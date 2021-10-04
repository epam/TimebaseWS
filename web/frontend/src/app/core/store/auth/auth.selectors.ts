import { createFeatureSelector, createSelector } from '@ngrx/store';
import * as fromAuth                             from './auth.reducer';

export const getAuthState = createFeatureSelector<fromAuth.State>('auth');

export const getAccessToken = createSelector(
  getAuthState,
  (state: fromAuth.State) => !(state.providerSettings && (state.customTokenResponse || state.SSOTokenResponse)) ?
    null :
    state.providerSettings.custom_provider ?
      state.customTokenResponse.access_token :
      state.SSOTokenResponse.accessToken,
);


export const getAccessTokenType = createSelector(
  getAuthState,
  (state: fromAuth.State) => !(state.providerSettings && (state.customTokenResponse || state.SSOTokenResponse)) ?
    null :
    state.providerSettings.custom_provider ?
      state.customTokenResponse.token_type :
      state.SSOTokenResponse.tokenType,
);


export const getAccessRequestData = createSelector(
  getAccessToken,
  getAccessTokenType,
  (token: string, tokenType: string) => { return {token: token, tokenType: tokenType}; },
);

export const getIsTokenInitialized = createSelector(
  getAuthState,
  (state: fromAuth.State) => state.tokenIsInitialized,
);

export const getIsLoggedIn = createSelector(
  getAccessToken,
  getIsTokenInitialized,
  (token: string, tokenIsInitialized: boolean) => tokenIsInitialized && token != null,
);

export const getAuthProvider = createSelector(
  getAuthState,
  (state: fromAuth.State) => state.providerSettings ? state.providerSettings : null,
);

export const getTokenResponse = createSelector(
  getAuthState,
  (state: fromAuth.State) => !state.providerSettings ?
    null :
    state.providerSettings.custom_provider ?
      state.customTokenResponse :
      state.SSOTokenResponse,
);

export const getSSOConfiguration = createSelector(
  getAuthState,
  (state: fromAuth.State) => state.SSOConfiguration,
);


export const getSSOProviderConfigUrl = createSelector(
  getAuthProvider,
  (providerSettings) => providerSettings.config_url,
);

