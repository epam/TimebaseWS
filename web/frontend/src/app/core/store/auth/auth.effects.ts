import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable }              from '@angular/core';
import { Router }                  from '@angular/router';

import { AuthFlow, SilentAuthProvider } from '@assets/sso-auth/sso-auth';
import { Actions, Effect, ofType }      from '@ngrx/effects';
import { select, Store }                from '@ngrx/store';
import { LocalStorage }                 from '@ngx-pwa/local-storage';

import {
  AuthorizationNotifier,
  AuthorizationRequest,
  AuthorizationServiceConfiguration,
  AuthorizationServiceConfigurationJson,
  BaseTokenRequestHandler,
  FetchRequestor,
  GRANT_TYPE_AUTHORIZATION_CODE,
  RedirectRequestHandler,
  StringMap,
  TokenRequest,
  TokenResponse,
}                                                                                  from '@openid/appauth';
import { Observable, of, Subject, throwError }                                     from 'rxjs';
import { catchError, filter, map, mergeMap, switchMap, take, tap, withLatestFrom } from 'rxjs/operators';
import { AuthProviderModel }                                                       from '../../../models/auth-provider.model';
import { CustomTokenResponseModel }                                                from '../../../models/customToken-response.model';
import * as NotificationsActions
                                                                                   from '../../modules/notifications/store/notifications.actions';
import * as AppActions                                                             from '../app/app.actions';
import { getAppState, getCurrentUrl }                                              from '../app/app.selectors';
import { AppState }                                                                from '../index';

import * as AuthActions from './auth.actions';
import {
  AuthActionTypes,
  SsoConfigDependentAction,
}                       from './auth.actions';
import {
  getAuthProvider,
  getIsTokenInitialized,
  getSSOConfiguration,
  getSSOProviderConfigUrl,
  getTokenResponse,
}                       from './auth.selectors';

const login_redirect_url = `${window.location.origin}/assets/sign-in.html`;
const silent_auth_redirect_url = `${window.location.origin}/assets/silent-auth.html`;
const AUTH_KEY_IN_LS = 'art';

@Injectable()
export class AuthEffects {
  
  
  constructor(
    private actions$: Actions,
    private httpClient: HttpClient,
    private localStorage: LocalStorage,
    private appStore: Store<AppState>,
    private router: Router,
  ) {
    this.authorizationHandler = new RedirectRequestHandler();
  }

  private readonly authorizationHandler: RedirectRequestHandler;

  private replayDelay;
  private refreshTokenSubj = new Subject<any>();

  @Effect({dispatch: false}) getAuthProviderInfo = this.actions$
    .pipe(
      ofType<AuthActions.GetAuthProviderInfo>(AuthActionTypes.GET_AUTH_PROVIDER_INFO),
      switchMap(() => this.httpClient
        .get<AuthProviderModel>('/authInfo', {
          headers: {
            'ignoreToken': 'true',
          },
        }),
      ),
      tap(resp => {
        this.appStore.dispatch(new AuthActions.SetAuthProviderSettings({
          settings: new AuthProviderModel(resp),
        }));
        this.appStore.dispatch(new AuthActions.StartAuthProcess());
      }),
    );

  @Effect() startAuthProcess = this.actions$
    .pipe(
      ofType<AuthActions.StartAuthProcess>(AuthActionTypes.START_AUTH_PROCESS),
      switchMap(() => {
        return this.appStore.pipe(
          select(getAuthProvider),
          filter(auth_provider => !!auth_provider),
          take(1),
        );
      }),
      switchMap(() => this.localStorage.getItem(AUTH_KEY_IN_LS)),
      switchMap((authItem): Observable<AuthActions.SilentUpdateToken | AuthActions.InitialiseToken> => {
        if (!!authItem) {
          return of<AuthActions.SilentUpdateToken>(new AuthActions.SilentUpdateToken());
        } else {
          return this.appStore
            .pipe(
              select(getCurrentUrl),
              filter(url => url != null),
              take(1),
              map((url: string) => {
                const isLoginPage = url != null && typeof url === 'string' ? url.startsWith('/auth') : false;
                if (!isLoginPage) {
                  this.router.navigate(['auth', 'login']);
                }
                return new AuthActions.InitialiseToken();
              }),
            );
        }
      }),
    );


  @Effect({dispatch: false}) loadSSOConfig = this.actions$
    .pipe(
      ofType<SsoConfigDependentAction>(
        AuthActionTypes.REDIRECT_TO_AUTH_PROVIDER,
        AuthActionTypes.PROCESS_SIGN_IN_REDIRECT,
        AuthActionTypes.LOAD_SSO_CONFIGURATION,
        AuthActionTypes.SILENT_UPDATE_SSO_TOKEN,
      ),
      switchMap((/*action*/) => {
        return this.appStore.pipe(
          select(getSSOConfiguration),
          take(1),
        );
      }),
      switchMap((config) => {
        if (config != null) {
          return of({type: 'none'});
        }
        return this.appStore.pipe(
          select(getSSOProviderConfigUrl),
          switchMap((url: string) => {
            if (url == null) {
              return of({type: 'none'});
            }
            return this.httpClient
              .get<AuthorizationServiceConfigurationJson>(url,
                {
                  headers: {
                    'ignoreApiPrefix': 'true',
                    'ignoreToken': 'true',
                  },
                })
              .pipe(
                tap((providerConfigJSON) => {
                  this.appStore.dispatch(new AuthActions.SaveSSOConfig({configuration: new AuthorizationServiceConfiguration(providerConfigJSON)}));
                }),
              );
          }),
        );
      }),
    );

  @Effect({dispatch: false}) redirectToAuth = this.actions$
    .pipe(
      ofType<AuthActions.RedirectToAuthProvider>(AuthActionTypes.REDIRECT_TO_AUTH_PROVIDER),
      switchMap(() => {
        return this.appStore
          .pipe(
            select(getAuthProvider),
            filter(provider => !!provider),
            take(1),
          );
      }),
      switchMap((provider: AuthProviderModel) => this.appStore
        .pipe(
          select(getSSOConfiguration),
          filter(SSOConfig => SSOConfig != null),
          take(1),
          map(SSOConfig => [SSOConfig, provider]),
        ),
      ),
      tap(([config, provider]: [AuthorizationServiceConfiguration, AuthProviderModel]) => {
        const request = new AuthorizationRequest({
          redirect_uri: login_redirect_url,
          response_type: AuthorizationRequest.RESPONSE_TYPE_CODE,
          client_id: provider.client_id,
          scope: 'openid profile' /*appProviderConfig.scope*/,
          extras: {
            audience: provider.audience,
          },
        });
        this.authorizationHandler.performAuthorizationRequest(config, request);
      }),
    );

  @Effect({dispatch: false}) processSignInRedirect = this.actions$
    .pipe(
      ofType<AuthActions.ProcessSingInRedirect>(AuthActionTypes.PROCESS_SIGN_IN_REDIRECT),
      mergeMap((action) => {
        return this.appStore.pipe(
          select(getSSOConfiguration),
          filter(config => config != null),
          take(1),
          map(config => {
            return {config, action};
          }),
        );
      }),
      tap(({config, action}) => {
        const authorizationNotifier = new AuthorizationNotifier();
        this.authorizationHandler.setAuthorizationNotifier(authorizationNotifier);
        authorizationNotifier.setAuthorizationListener((request, response/*, error*/) => {
          let extras: StringMap | undefined;
          if (request && request.internal) {
            extras = {};
            extras['code_verifier'] = request.internal['code_verifier'];
          }
          const tokenRequest = new TokenRequest({
            client_id: request.clientId,
            redirect_uri: login_redirect_url,
            grant_type: GRANT_TYPE_AUTHORIZATION_CODE,
            code: response.code,
            refresh_token: undefined,
            extras: extras,
          });
          const tokenHandler = new BaseTokenRequestHandler(new FetchRequestor());
          tokenHandler.performTokenRequest(config, tokenRequest)
            .then((tokenResponse: TokenResponse) => {
              this.appStore.dispatch(new AuthActions.LogIn({tokenResponse: tokenResponse}));
            })
            .catch((/*tokenRequestError*/) => {
              this.setNotLoggedIn()
                .subscribe(() => {
                  this.appStore.dispatch(new AuthActions.RedirectToAuthProvider());
                });
            });
        });

        this.authorizationHandler.completeAuthorizationRequestIfPossible();
      }),
    );


  @Effect(/*{dispatch: false}*/) silentUpdateToken = this.actions$
    .pipe(
      ofType<AuthActions.SilentUpdateToken>(AuthActionTypes.SILENT_UPDATE_TOKEN),
      switchMap(() => this.appStore
        .pipe(
          select(getAppState),
          take(1),
          withLatestFrom(this.appStore.pipe(select(getAuthProvider))),
        )),
      map(([appState, provider]) => {
        if (appState.preventRequests || this.replayDelay) return {type: 'none'};
        this.appStore.dispatch(new AppActions.PreventHTTPRequests());
        this.replayDelay = setTimeout(() => {
          clearTimeout(this.replayDelay);
          delete this.replayDelay;
        }, 5000);

        if (provider.custom_provider) {
          return new AuthActions.SilentUpdateCustomToken();
        } else {
          return new AuthActions.SilentUpdateSSOToken();
        }
      }),
    );

  @Effect() silentUpdateCustomToken = this.actions$
    .pipe(
      ofType<AuthActions.SilentUpdateCustomToken>(AuthActionTypes.SILENT_UPDATE_CUSTOM_TOKEN),
      switchMap(() => this.localStorage.getItem(AUTH_KEY_IN_LS)),
      withLatestFrom(this.appStore.pipe(select(getAuthProvider))),
      switchMap(([token, authProvider]: [string | null, AuthProviderModel]) => {
        if (!token) {
          return of(new AuthActions.InitialiseToken());
        }
        const body_data = new URLSearchParams('');
        body_data.append('grant_type', 'refresh_token');
        body_data.append('refresh_token', token || '');

        return this.httpClient
          .post(authProvider.token_endpoint, body_data.toString(), {
            headers: new HttpHeaders({
              _authrequest: 'true',
              ignoreToken: 'true',
              customError: 'true',
              ignoreApiPrefix: 'true',
              'Content-Type': 'application/x-www-form-urlencoded',
            }),
          })
          .pipe(
            catchError((error) => {
              this.appStore.dispatch(new AppActions.AllowHTTPRequests());
              this.appStore.dispatch(new AuthActions.InitialiseToken());
              this.appStore.dispatch(new AuthActions.LogOut());
              return throwError(error);
            }),
            mergeMap((resp: CustomTokenResponseModel) => {
              return [
                new AppActions.AllowHTTPRequests(),
                new AuthActions.LogIn({tokenResponse: resp}),
                new AuthActions.InitialiseToken(),
              ];
            }),
          );
      }),
    );

  @Effect({dispatch: false}) silentUpdateSSOToken = this.actions$
    .pipe(
      ofType<AuthActions.SilentUpdateSSOToken>(AuthActionTypes.SILENT_UPDATE_SSO_TOKEN),
      switchMap(() => {
        return this.appStore
          .pipe(
            select(getAuthProvider),
            filter(provider => !!provider),
            take(1),
          );
      }),
      switchMap((provider: AuthProviderModel) => this.appStore
        .pipe(
          select(getSSOConfiguration),
          filter(SSOConfig => SSOConfig != null),
          take(1),
          map(SSOConfig => [SSOConfig, provider]),
          withLatestFrom(this.appStore.pipe(select(getIsTokenInitialized))),
        ),
      ),
      tap(([[config, appProviderConfig], isTokenInitialized]: [[AuthorizationServiceConfiguration, AuthProviderModel], boolean]) => {
        const authObj = new SilentAuthProvider({
          flow: AuthFlow.CODE,
          clientId: appProviderConfig.client_id,
          scope: 'openid profile',
          extraAuthParams: {
            audience: appProviderConfig.audience,
          },
          prompt: config.tokenEndpoint.startsWith(location.protocol)
            ? void 0
            : 'consent',
          authorizationServiceConfig: config,
          redirectUrl: silent_auth_redirect_url,
          failureCallback: (/*err: SilentAuthErrorJson*/) => {
            if (!isTokenInitialized) {
              this.appStore.dispatch(new AppActions.PreventHTTPRequests());
              this.appStore.dispatch(new AuthActions.LogOut());
            } else {
              this.appStore.dispatch(new AppActions.ShowLoginAlert());
            }
          },
          callback: (tokenResponse: TokenResponse) => {
            this.appStore.dispatch(new AppActions.AllowHTTPRequests());
            this.appStore.dispatch(new AuthActions.LogIn({
              tokenResponse: tokenResponse,
            }));
            this.appStore.dispatch(new AuthActions.InitialiseToken());
          },
          requestor: new FetchRequestor(),
        });

        authObj.getToken();
      }),
    );

  @Effect() tryLogin = this.actions$
    .pipe(
      ofType<AuthActions.TryLogIn>(AuthActionTypes.TRY_LOGIN),
      withLatestFrom(this.appStore.pipe(select(getAuthProvider))),
      switchMap(([action, authProvider]) => {
        const body_data = new URLSearchParams('');
        body_data.append('grant_type', 'password');
        body_data.append('scope', 'trust');
        for (const i in action.payload) {
          if (action.payload.hasOwnProperty(i)) {
            body_data.append(i, action.payload[i]);
          }
        }
        return this.httpClient
          .post(authProvider.token_endpoint, body_data.toString(), {
            headers: new HttpHeaders({
              _authrequest: 'true',
              ignoreToken: 'true',
              customError: 'true',
              ignoreApiPrefix: 'true',
              'Content-Type': 'application/x-www-form-urlencoded',
            }),
          })
          .pipe(
            map((resp: CustomTokenResponseModel) => {
              return new AuthActions.LogIn({tokenResponse: resp});
            }),
            catchError(error => {
              console.warn('Login error: ', error);
              this.appStore.dispatch(new NotificationsActions.AddAlert({
                message: `Authentication failed (${error && error.error && error.error.error_description ? error.error.error_description : ''})`,
                dismissible: true,
                closeInterval: 6000,
              }));
              return throwError(error);
            }),
          );
      }),
    );

  @Effect({dispatch: false}) refreshToken = this.actions$
    .pipe(
      ofType<AuthActions.LogIn>(AuthActionTypes.LOGIN),
      withLatestFrom(this.appStore.pipe(select(getAuthProvider))),
      tap(([action, authProvider]) => {
        this.localStorage.setItem(AUTH_KEY_IN_LS, authProvider.custom_provider ? (action.payload.tokenResponse as CustomTokenResponseModel).refresh_token : 'true').subscribe();
        setTimeout(() => {
          this.appStore.dispatch(new AuthActions.SilentUpdateToken());
        }, (authProvider.custom_provider ?
          (action.payload.tokenResponse as CustomTokenResponseModel).expires_in :
          (action.payload.tokenResponse as TokenResponse).expiresIn) * 900);
      }),
    );


  @Effect({dispatch: false}) logout = this.actions$
    .pipe(
      ofType<AuthActions.LogOut>(AuthActionTypes.LOGOUT),
      switchMap(() => this.setNotLoggedIn()),
      switchMap((/*action*/) => {
        return this.appStore
          .pipe(
            select(getAuthProvider),
            take(1),
          );
      }),
      tap((providerAppConfig) => {
        if (providerAppConfig.custom_provider) {
          this.refreshTokenSubj.next(true);
          this.refreshTokenSubj.complete();
          this.refreshTokenSubj = new Subject<any>();
          window.location.href = '/';
        } else {
          let url;
          if (providerAppConfig.name === 'auth0' && providerAppConfig.logout_url) {
            const logoutDescription = {
              url: providerAppConfig.logout_url,
              redirectProperty: 'returnTo',
              clientIdProperty: 'client_id',
            };
            const params = new URLSearchParams();
            params.append(logoutDescription.redirectProperty, login_redirect_url);
            if (logoutDescription.clientIdProperty != null) {
              params.append(logoutDescription.clientIdProperty, providerAppConfig.client_id);
            }
            url = `${logoutDescription.url}?${params.toString()}`;
            window.location.assign(url);
          } else {
            this.appStore.dispatch(new AuthActions.LoadSSOConfiguration({provider: providerAppConfig.name}));
            this.appStore
              .pipe(
                select(getSSOConfiguration),
                filter(config => config != null),
                take(1),
                withLatestFrom(this.appStore.pipe(select(getTokenResponse))),
              )
              .subscribe(([config, tokenResponse]) => {
                const params = new URLSearchParams();
                params.append('post_logout_redirect_uri', login_redirect_url);
                if (tokenResponse) params.append('id_token_hint', (tokenResponse as TokenResponse).idToken || '');
                url = `${config.endSessionEndpoint}?${params.toString()}`;
                window.location.assign(url);
              });
          }
        }
      }));

  private setNotLoggedIn(): Observable<boolean> {
    return this
      .localStorage
      .getItem(AUTH_KEY_IN_LS)
      .pipe(
        catchError(e => {
          console.error('There is issue with DB:', e);
          return window.location.href = '/';
        }),
        switchMap(resp => {
          return resp ? this.localStorage.removeItem(AUTH_KEY_IN_LS) : of(true);
        }),
      );
  }
}
