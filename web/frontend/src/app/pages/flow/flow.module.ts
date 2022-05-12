import { DragDropModule }                                     from '@angular/cdk/drag-drop';
import { CUSTOM_ELEMENTS_SCHEMA, NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { RouterModule }                                       from '@angular/router';
import { VizceralModule }                                     from '@deltix/ngx-vizceral';
import { EffectsModule }                                      from '@ngrx/effects';
import { StoreModule }                                        from '@ngrx/store';
import { ButtonsModule }                                      from 'ngx-bootstrap/buttons';
import { NgModelSuggestionsModule }                           from '../../shared/directives/ng-model-suggestions/ng-model-suggestions.module';
import { SharedModule }                                       from '../../shared/shared.module';
import { BreadcrumbsComponent }                               from './components/breadcrumbs/breadcrumbs.component';
import { ConnectionDetailsComponent }                         from './components/connection-details/connection-details.component';
import { DetailsModalSettingsComponent }                      from './components/details-modal-settings/details-modal-settings.component';
import { FlowFilterComponent }                                from './components/flow-filter/flow-filter.component';
import { FlowLocatorComponent }                               from './components/flow-locator/flow-locator.component';
import { FlowComponent }                                      from './components/flow/flow.component';
import { NodeDetailsComponent }                               from './components/node-details/node-details.component';
import { SourceTargetComponent }                              from './components/source-target/source-target.component';
import { FlowDataService }                                    from './services/flow-data.service';
import { FlowEffects }                                        from './store/flow.effects';
import * as fromFlow                                          from './store/flow.reducer';

@NgModule({
  declarations: [
    FlowComponent,
    BreadcrumbsComponent,
    ConnectionDetailsComponent,
    NodeDetailsComponent,
    SourceTargetComponent,
    DetailsModalSettingsComponent,
    FlowFilterComponent,
    FlowLocatorComponent,
  ],
  imports: [
    SharedModule,
    VizceralModule,
    RouterModule.forChild([
      {
        path: '',
        component: VizceralModule,
        data: {
          flow: true,
        },
      },
    ]),
    StoreModule.forFeature(fromFlow.flowFeatureKey, fromFlow.reducer),
    EffectsModule.forFeature([FlowEffects]),
    DragDropModule,
    NgModelSuggestionsModule,
    ButtonsModule,
  ],
  providers: [FlowDataService],
  schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
})
export class FlowModule {}
