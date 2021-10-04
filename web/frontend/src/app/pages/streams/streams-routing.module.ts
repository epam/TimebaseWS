import { NgModule }                                   from '@angular/core';
import { RouterModule, Routes }                       from '@angular/router';
import { TabsRouterProxyComponent }                   from '../../shared/components/tabs-router-proxy/tabs-router-proxy.component';
import { appRoute, streamRouteName, symbolRouteName } from '../../shared/utils/routes.names';
import { ActiveTabGuard }                             from '../guards/active-tab.guard';
import { QueryComponent }                             from '../query/query.component';
import { StreamDetailsComponent }                     from './components/stream-details/stream-details.component';
import { StreamsLayoutComponent }                     from './components/streams-layout/streams-layout.component';
import { CheckShowingOnCloseAlertGuard }              from './services/guards/check.showing.onclose.alert.guard';


const routes: Routes = [
  {
    path: '',
    component: StreamsLayoutComponent,
    children: [
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
            path: 'chart/:stream',
            component: TabsRouterProxyComponent,
            data: {
              chart: true,
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
          },
          {
            path: 'monitor/:stream/:id',
            loadChildren: () => import('./modules/monitor-log/monitor-log.module').then(m => m.MonitorLogModule),
          },
          {
            path: 'stream-create/:stream/:id',
            loadChildren: () => import('./modules/schema-editor/schema-editor.module').then(m => m.SchemaEditorModule),
          },
          {
            path: 'schema-edit/:stream/:id',
            loadChildren: () => import('./modules/schema-editor/schema-editor.module').then(m => m.SchemaEditorModule),
          },
          {
            path: 'reverse/:stream/:id',
            component: StreamDetailsComponent,
            data: {
              reverse: true,
            },
          },
          {
            path: 'view/:stream/:id',
            component: StreamDetailsComponent,
            data: {
              view: true,
            },
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
          },
          {
            path: 'monitor/:stream/:symbol/:id',
            loadChildren: () => import('./modules/monitor-log/monitor-log.module').then(m => m.MonitorLogModule),
          },
          {
            path: 'reverse/:stream/:symbol/:id',
            component: StreamDetailsComponent,
            data: {
              reverse: true,
            },
          },
          {
            path: 'schema/:stream/:symbol/:id',
            component: StreamDetailsComponent,
            data: {
              schema: true,
            },
          },
          {
            path: 'view/:stream/:symbol/:id',
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
export class StreamsRoutingModule {
}
