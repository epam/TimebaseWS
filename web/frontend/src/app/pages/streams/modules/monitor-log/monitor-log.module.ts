import {NgModule} from '@angular/core';
import {RouterModule} from '@angular/router';
import {EffectsModule} from '@ngrx/effects';
import {StoreModule} from '@ngrx/store';
import {AgGridModule} from 'ag-grid-angular';
import {AngularSplitModule} from 'angular-split';
import {SplitterSizesModule} from '../../../../shared/components/splitter-sizes/splitter-sizes.module';
import {RightPaneModule} from '../../../../shared/right-pane/right-pane.module';
import {SharedModule} from '../../../../shared/shared.module';
import {FiltersPanelModule} from '../../components/filters-panel/filters-panel.module';
import {MonitorLogGridComponent} from './components/monitor-log-grid/monitor-log-grid.component';
import {MonitorLogLayoutComponent} from './components/monitor-log-layout/monitor-log-layout.component';
import {MonitorLogGridDataService} from './services/monitor-log-grid-data.service';
import {MonitorLogEffects} from './store/monitor-log.effects';
import * as fromMonitorLog from './store/monitor-log.reducer';

@NgModule({
  declarations: [MonitorLogLayoutComponent, MonitorLogGridComponent],
  imports: [
    StoreModule.forFeature(fromMonitorLog.monitorLogFeatureKey, fromMonitorLog.reducer),
    EffectsModule.forFeature([MonitorLogEffects]),
    RouterModule.forChild([
      {
        path: '',
        component: MonitorLogLayoutComponent,
        data: {
          monitor: true,
        },
      },
    ]),
    AngularSplitModule,
    RightPaneModule,
    SplitterSizesModule,
    SharedModule,
    AgGridModule,
    FiltersPanelModule,
  ],
  providers: [MonitorLogGridDataService],
})
export class MonitorLogModule {}
