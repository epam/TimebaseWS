import {Component, OnInit} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {TranslateService} from '@ngx-translate/core';
import {RxStompConfig} from '@stomp/rx-stomp';
import {Versions} from '@stomp/stompjs/esm5/versions';
import {filter, switchMap, take, withLatestFrom} from 'rxjs/operators';
import {ConnectionStatus} from '../../../shared/models/connection-status';
import {CheckConnectionService} from '../../../shared/services/check-connection.service';
import * as NotificationsActions from '../../modules/notifications/store/notifications.actions';
import {WSService} from '../../services/ws.service';
import {AppState} from '../../store';
import * as AppActions from '../../store/app/app.actions';
import {getAppState} from '../../store/app/app.selectors';
import * as AuthActions from '../../store/auth/auth.actions';
import {getAccessToken, getIsLoggedIn} from '../../store/auth/auth.selectors';

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
    private checkConnectionService: CheckConnectionService,
  ) {
    translate.setDefaultLang('en');
    translate.use('en');
  }

  ngOnInit(): void {
    this.appStore.dispatch(new AuthActions.GetAuthProviderInfo());

    this.appStore
      .select('appSelf')
      .pipe(
        filter((appState) => !!appState.currencies),
        take(1),
      )
      .subscribe((appState) => {
        localStorage.setItem('currencies', JSON.stringify(appState.currencies));
      });

    this.appStore
      .select(getIsLoggedIn)
      .pipe(
        filter((isLoggedIn) => isLoggedIn),
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
          brokerURL: `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${
            window.location.host
          }${appState.stompPrefix}`,
          connectHeaders: {},
          reconnectDelay: 5000,
          heartbeatIncoming: 10000,
          heartbeatOutgoing: 10000,
          stompVersions: new Versions(['1.0', '1.1']),
          // debug: (debug_message) => console.log('WS_debug_message:', debug_message),
        };

        _StompRServiceConfig.connectHeaders = {
          authorization: accessToken,
        };

        this.wsService.configure(_StompRServiceConfig);
        this.wsService.activate();

        this.appStore.pipe(select(getAccessToken)).subscribe((newAccessToken) => {
          _StompRServiceConfig.connectHeaders = {
            authorization: newAccessToken,
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

    this.checkConnectionService.connectionStatus().subscribe((status) => {
      if (status === ConnectionStatus.ok) {
        this.appStore.dispatch(new NotificationsActions.RemoveAlertByAlias('connectionError'));
      } else {
        const messages = {
          [ConnectionStatus.offline]:
            'Network connection lost. Please check your internet connection.',
          [ConnectionStatus.serverNotResponding]: 'Server is not responding',
          [ConnectionStatus.timebaseNotResponding]: 'TimeBase Server is not operational',
        };
        this.appStore.dispatch(
          new NotificationsActions.AddAlert({
            message: messages[status],
            dismissible: false,
            alias: 'connectionError',
          }),
        );
      }
    });
  }
}
