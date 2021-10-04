import { Component, OnInit }                       from '@angular/core';
import { TranslateService }                        from '@ngx-translate/core';
import { select, Store }                           from '@ngrx/store';
import { AppState }                                from '../../store';
import * as AppActions                             from '../../store/app/app.actions';
import { filter, switchMap, take, withLatestFrom } from 'rxjs/operators';
import * as AuthActions                            from '../../store/auth/auth.actions';
import { RxStompConfig }                           from '@stomp/rx-stomp';
import { WSService }                               from '../../services/ws.service';
import { getAccessToken, getIsLoggedIn }           from '../../store/auth/auth.selectors';
import { getAppState }                             from '../../store/app/app.selectors';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {

  constructor(
    private translate: TranslateService,
    private appStore: Store<AppState>,
    private wsService: WSService,
  ) {
    translate.setDefaultLang('en');
    translate.use('en');
  }

  ngOnInit(): void {
    this.appStore.dispatch(new AuthActions.GetAuthProviderInfo());

    this.appStore.select('appSelf')
      .pipe(
        filter(appState => !!appState.currencies),
        take(1),
      )
      .subscribe((appState) => {
          localStorage.setItem('currencies', JSON.stringify(appState.currencies));
        },
      );

    this.appStore.select(getIsLoggedIn)
      .pipe(
        filter(isLoggedIn => isLoggedIn),
        take(1),
        switchMap(() => this.appStore.select(getAppState)),
        take(1),
        withLatestFrom(this.appStore.pipe(select(getAccessToken))),
      )
      .subscribe(([appState, accessToken]) => {
        this.appStore.dispatch(new AppActions.StartListeningVisibilityChange());
        this.appStore.dispatch(new AppActions.GetCurrencies());
        this.appStore.dispatch(new AppActions.GetAppSettings());
        this.appStore.dispatch(new AppActions.GetAppInfo());

        const _StompRServiceConfig: RxStompConfig = {
          brokerURL: `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}${appState.stompPrefix}`,
          connectHeaders: {},
          reconnectDelay: 5000,
          heartbeatIncoming: 10000,
          heartbeatOutgoing: 10000,
          // debug: (debug_message) => console.log('WS_debug_message:', debug_message),
        };

        _StompRServiceConfig.connectHeaders = {
          'authorization': accessToken,
        };

        this.wsService.configure(_StompRServiceConfig);
        this.wsService.activate();

        this.appStore
          .pipe(select(getAccessToken))
          .subscribe(newAccessToken => {
            _StompRServiceConfig.connectHeaders = {
              'authorization': newAccessToken,
            };
            this.wsService.configure(_StompRServiceConfig);
          });

        this.wsService.stompErrors$.subscribe((e) => {
          if (e.headers.status === '500') {
            // this.authStore.dispatch(new AuthActions.LogOut());
            console.warn('WS Error', e); // TODO: Replace to Universal logger or delete this before commit
          }
        });
      });
  }
}
