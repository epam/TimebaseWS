import { NgModule }                  from '@angular/core';
import { RouterModule }              from '@angular/router';
import { EffectsModule }             from '@ngrx/effects';
import { StoreModule }               from '@ngrx/store';
import { AngularSplitModule }        from 'angular-split';
import { StreamsSharedModule }       from '../streams-shared/streams-shared.module';
import { MonitorLogGridComponent }   from './components/monitor-log-grid/monitor-log-grid.component';
import { MonitorLogLayoutComponent } from './components/monitor-log-layout/monitor-log-layout.component';
import { MonitorLogGridDataService } from './services/monitor-log-grid-data.service';
import { MonitorLogEffects }         from './store/monitor-log.effects';
import * as fromMonitorLog           from './store/monitor-log.reducer';
import {StreamRightToolbarModule} from "../../components/show-stream-details-btn/stream-right-toolbar.module";


@NgModule({
  declarations: [
    MonitorLogLayoutComponent,
    MonitorLogGridComponent,
  ],
    imports: [
        StreamsSharedModule,
        StoreModule.forFeature(fromMonitorLog.monitorLogFeatureKey, fromMonitorLog.reducer),
        EffectsModule.forFeature([MonitorLogEffects]),
        RouterModule.forChild([{
            path: '',
            component: MonitorLogLayoutComponent,
            data: {
                monitor: true,
            },
        }]),
        AngularSplitModule,
        StreamRightToolbarModule,
    ],
  providers: [MonitorLogGridDataService],
})
export class MonitorLogModule {
}
