import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {TabsRouterProxyComponent} from '../../shared/components/tabs-router-proxy/tabs-router-proxy.component';
import {appRoute, streamRouteName, symbolRouteName} from '../../shared/utils/routes.names';
import {FlowComponent} from '../flow/components/flow/flow.component';
import {ActiveTabGuard} from '../guards/active-tab.guard';
import {ShareTabCreateGuard} from '../guards/share-tab-create.guard';
import {OrderBookPageComponent} from '../order-book/order-book-page/order-book-page.component';
import {QueryComponent} from '../query/query.component';
import {ChartsLayoutComponent} from './components/deltix-charts/charts-layout/charts-layout.component';
import {StreamDetailsComponent} from './components/stream-details/stream-details.component';
import {StreamsLayoutComponent} from './components/streams-layout/streams-layout.component';
import {CheckShowingOnCloseAlertGuard} from './services/guards/check.showing.onclose.alert.guard';

const routes: Routes = [
  {
    path: '',
    component: StreamsLayoutComponent,
    canActivate: [ShareTabCreateGuard],
    children: [
      {
        path: 'order-book',
        component: TabsRouterProxyComponent,
        data: {
          orderBook: true,
        },
      },
      {
        path: 'order-book/:id',
        component: OrderBookPageComponent,
        data: {
          orderBook: true,
        },
        canActivate: [ActiveTabGuard],
      },
      {
        path: 'query',
        component: TabsRouterProxyComponent,
        data: {
          query: true,
        },
      },
      {
        path: 'query/:id',
        component: QueryComponent,
        data: {
          query: true,
        },
        canActivate: [ActiveTabGuard],
      },
      {
        path: 'flow',
        component: TabsRouterProxyComponent,
        data: {
          flow: true,
        },
      },
      {
        path: 'flow/:id',
        loadChildren: () => import('../flow/flow.module').then((m) => m.FlowModule),
        component: FlowComponent,
        data: {
          flow: true,
        },
        canActivate: [ActiveTabGuard],
      },
      {
        path: streamRouteName,
        children: [
          {
            path: '',
            pathMatch: 'full',
            redirectTo: appRoute,
          },
          /* proxy */
          {
            path: 'live/:stream',
            component: TabsRouterProxyComponent,
            data: {
              live: true,
            },
          },
          {
            path: 'monitor/:stream',
            component: TabsRouterProxyComponent,
            data: {
              monitor: true,
            },
          },
          {
            path: 'reverse/:stream',
            component: TabsRouterProxyComponent,
            data: {
              reverse: true,
            },
          },
          {
            path: 'view/:stream',
            component: TabsRouterProxyComponent,
            data: {
              view: true,
            },
          },
          {
            path: 'flow/:stream',
            component: TabsRouterProxyComponent,
            data: {
              flow: true,
            },
          },
          {
            path: 'chart/:stream',
            component: TabsRouterProxyComponent,
            data: {
              chart: true,
            },
          },
          {
            path: 'schema-edit/:stream',
            component: TabsRouterProxyComponent,
            data: {
              schemaEdit: true,
            },
          },
          {
            path: 'stream-create/:stream',
            component: TabsRouterProxyComponent,
            data: {
              schemaEdit: true,
              streamCreate: true,
            },
          },

          /* components */
          {
            path: 'live/:stream/:id',
            component: StreamDetailsComponent,
            data: {
              live: true,
            },
            canActivate: [ActiveTabGuard],
          },
          {
            path: 'monitor/:stream/:id',
            canActivate: [ActiveTabGuard],
            data: {
              monitor: true,
            },
            loadChildren: () =>
              import('./modules/monitor-log/monitor-log.module').then((m) => m.MonitorLogModule),
          },
          {
            path: 'stream-create/:stream/:id',
            canActivate: [ActiveTabGuard],
            data: {
              streamCreate: true,
            },
            loadChildren: () =>
              import('./modules/schema-editor/schema-editor.module').then(
                (m) => m.SchemaEditorModule,
              ),
          },
          {
            path: 'schema-edit/:stream/:id',
            canActivate: [ActiveTabGuard],
            data: {
              schemaEdit: true,
            },
            loadChildren: () =>
              import('./modules/schema-editor/schema-editor.module').then(
                (m) => m.SchemaEditorModule,
              ),
          },
          {
            path: 'reverse/:stream/:id',
            component: StreamDetailsComponent,
            data: {
              reverse: true,
            },
            canActivate: [ActiveTabGuard],
          },
          {
            path: 'chart/:stream/:id',
            component: ChartsLayoutComponent,
            canActivate: [ActiveTabGuard],
            data: {
              chart: true,
            },
          },
          {
            path: 'view/:stream/:id',
            component: StreamDetailsComponent,
            data: {
              view: true,
            },
            canActivate: [ActiveTabGuard],
          },

          /* common */
          {
            path: ':stream',
            pathMatch: 'full',
            component: TabsRouterProxyComponent,
          },
          {
            path: ':stream/:id',
            component: StreamDetailsComponent,
            canActivate: [ActiveTabGuard],
          },
        ],
      },
      {
        path: symbolRouteName,
        children: [
          {
            path: '',
            pathMatch: 'full',
            redirectTo: appRoute,
          },

          /* proxy */
          {
            path: 'live/:stream/:symbol',
            component: TabsRouterProxyComponent,
            data: {
              live: true,
            },
          },
          {
            path: 'monitor/:stream/:symbol',
            component: TabsRouterProxyComponent,
            data: {
              monitor: true,
            },
          },
          {
            path: 'reverse/:stream/:symbol',
            component: TabsRouterProxyComponent,
            data: {
              reverse: true,
            },
          },
          {
            path: 'chart/:stream/:symbol',
            component: TabsRouterProxyComponent,
            data: {
              chart: true,
            },
          },
          {
            path: 'view/:stream/:symbol',
            component: TabsRouterProxyComponent,
            data: {
              view: true,
            },
          },

          /* components */
          {
            path: 'live/:stream/:symbol/:id',
            component: StreamDetailsComponent,
            data: {
              live: true,
            },
            canActivate: [ActiveTabGuard],
          },
          {
            path: 'monitor/:stream/:symbol/:id',
            canActivate: [ActiveTabGuard],
            data: {
              monitor: true,
            },
            loadChildren: () =>
              import('./modules/monitor-log/monitor-log.module').then((m) => m.MonitorLogModule),
          },
          {
            path: 'reverse/:stream/:symbol/:id',
            component: StreamDetailsComponent,
            canActivate: [ActiveTabGuard],
            data: {
              reverse: true,
            },
          },
          {
            path: 'schema/:stream/:symbol/:id',
            canActivate: [ActiveTabGuard],
            component: StreamDetailsComponent,
            data: {
              schema: true,
            },
          },
          {
            path: 'chart/:stream/:symbol/:id',
            component: ChartsLayoutComponent,
            canActivate: [ActiveTabGuard],
            data: {
              chart: true,
            },
          },
          {
            path: 'view/:stream/:symbol/:id',
            canActivate: [ActiveTabGuard],
            component: StreamDetailsComponent,
            data: {
              view: true,
            },
          },

          /* common */
          {
            path: ':stream/:symbol',
            pathMatch: 'full',
            component: TabsRouterProxyComponent,
          },
          {
            path: ':stream/:symbol/:id',
            canActivate: [ActiveTabGuard],
            component: StreamDetailsComponent,
          },
        ],
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  providers: [CheckShowingOnCloseAlertGuard],
  exports: [RouterModule],
})
export class StreamsRoutingModule {}
