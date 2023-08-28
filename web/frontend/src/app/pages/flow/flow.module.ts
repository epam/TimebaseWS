import { DragDropModule }                                     from '@angular/cdk/drag-drop';
import { CUSTOM_ELEMENTS_SCHEMA, NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { RouterModule }                                       from '@angular/router';
import { VizceralModule }                                     from '@deltix/ngx-vizceral';
import { EffectsModule }                                      from '@ngrx/effects';
import { StoreModule }                                        from '@ngrx/store';
import { ButtonsModule }                                      from 'ngx-bootstrap/buttons';
import { MultiSelectModule }                                  from '../../shared/components/multi-select/multi-select.module';
import { SelectModule }                                       from '../../shared/components/select/select.module';
import { SplitterSizesModule }                                from '../../shared/components/splitter-sizes/splitter-sizes.module';
import { TopFiltersPageLayoutComponent }                      from '../../shared/components/top-filters-page-layout/top-filters-page-layout.component';
import { NgModelSuggestionsModule }                           from '../../shared/directives/ng-model-suggestions/ng-model-suggestions.module';
import { RightPaneModule }                                    from '../../shared/right-pane/right-pane.module';
import { SharedModule }                                       from '../../shared/shared.module';
import { BreadcrumbsComponent }                               from './components/breadcrumbs/breadcrumbs.component';
import { ConnectionDetailsComponent }                         from './components/connection-details/connection-details.component';
import { FlowFilterComponent }                                from './components/flow-filter/flow-filter.component';
import { FlowLocatorComponent }                               from './components/flow-locator/flow-locator.component';
import { FlowComponent }                                      from './components/flow/flow.component';
import { NodeDetailsComponent }                               from './components/node-details/node-details.component';
import { SourceTargetComponent }                              from './components/source-target/source-target.component';
import { FlowDataService }                                    from './services/flow-data.service';
import { FlowEffects }                                        from './store/flow.effects';
import * as fromFlow                                          from './store/flow.reducer';
import { AutocompleteModule } from '../../libs/deltix-ng-autocomplete/src/ts/autocomplete.module';
import { AngularSplitModule } from 'angular-split';
import { ConnectionModalComponent } from './components/connection-modal/connection-modal.component';
import { SimpleModalModule } from '../../shared/modal/simple-modal.module';

@NgModule({
  declarations: [
    FlowComponent,
    BreadcrumbsComponent,
    ConnectionDetailsComponent,
    NodeDetailsComponent,
    SourceTargetComponent,
    FlowFilterComponent,
    FlowLocatorComponent,
    ConnectionModalComponent,
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
    AutocompleteModule,
    SelectModule,
    AngularSplitModule,
    SplitterSizesModule,
    RightPaneModule,
    SimpleModalModule,
    MultiSelectModule,
    TopFiltersPageLayoutComponent,
  ],
  providers: [FlowDataService],
  schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
})
export class FlowModule {}
