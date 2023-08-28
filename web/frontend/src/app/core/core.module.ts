import {NgModule} from '@angular/core';
import {EffectsModule} from '@ngrx/effects';
import {FullRouterStateSerializer, StoreRouterConnectingModule} from '@ngrx/router-store';
import {StoreModule} from '@ngrx/store';
import {StoreDevtoolsModule} from '@ngrx/store-devtools';
import {environment} from '../../environments/environment';
import {SharedModule} from '../shared/shared.module';
import {NotificationsModule} from './modules/notifications/notifications.module';
import {AppInitGuard} from './services/guards/app-init.guard';
import {AuthGuard} from './services/guards/auth.guard';
import {LoginGuard} from './services/guards/login.guard';
import {InterceptorsModule} from './services/interceptors/interceptors.module';
import {WebsocketService} from './services/websocket.service';
import {WSService} from './services/ws.service';
import {metaReducers, reducers} from './store';
import {AppEffects} from './store/app/app.effects';
import {AuthEffects} from './store/auth/auth.effects';

@NgModule({
  declarations: [],
  imports: [
    SharedModule,
    NotificationsModule,
    InterceptorsModule,

    StoreModule.forRoot(reducers, {
      metaReducers,
      runtimeChecks: {
        strictStateImmutability: false,
        strictActionImmutability: false,
      },
    }),
    EffectsModule.forRoot([AppEffects]),
    EffectsModule.forFeature([AuthEffects]),
    StoreRouterConnectingModule.forRoot({serializer: FullRouterStateSerializer}),

    !environment.production ? StoreDevtoolsModule.instrument() : [],
  ],
  providers: [WSService, WebsocketService, AppInitGuard, LoginGuard, AuthGuard],
  exports: [NotificationsModule, StoreModule, StoreRouterConnectingModule, InterceptorsModule],
})
export class CoreModule {}
