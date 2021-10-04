import { NgModule }                                                                     from '@angular/core';
import { ReactiveFormsModule }                                                          from '@angular/forms';
import { NgSelectModule }                                                               from '@ng-select/ng-select';
import { EffectsModule }                                                                from '@ngrx/effects';
import { StoreModule }                                                                  from '@ngrx/store';
import { AngularSplitModule }                                                           from 'angular-split';
import { AccordionModule, ButtonsModule, ModalModule, TimepickerModule, TooltipModule } from 'ngx-bootstrap';
import { ContextMenuModule }                                                            from 'ngx-contextmenu';
import {
  PERFECT_SCROLLBAR_CONFIG,
  PerfectScrollbarConfigInterface,
  PerfectScrollbarModule,
}                                                                                       from 'ngx-perfect-scrollbar';
import { AutocompleteModule }                                                           from 'src/app/libs/deltix-ng-autocomplete/src/ts/autocomplete.module';
import { BtnDatePickerModule }                                                          from '../../shared/components/btn-date-picker/btn-date-picker.module';
import { DateRangePickerModule }                                                        from '../../shared/components/date-range-picker/date-range-picker.module';
import { FileBtnModule }                                                                from '../../shared/components/file-btn/file-btn.module';
import { ConfirmModalModule }                                                           from '../../shared/components/modals/modal-on-close-alert/confirm-modal.module';
import { MultiSelectAutocompleteModule }                                                from '../../shared/components/multi-select-autocomplete/multi-select-autocomplete.module';
import { SelectModule }                                                                 from '../../shared/components/select/select.module';
import { SplitterSizesModule }                                                          from '../../shared/components/splitter-sizes/splitter-sizes.module';
import { TreeCheckboxesModule }                                                         from '../../shared/components/tree-checkboxes/tree-checkboxes.module';
import { ClickOutsideModule }                                                           from '../../shared/directives/click-outside/click-outside.module';
import { DragProgressModule }                                                           from '../../shared/directives/drag-progress/drag-progress.module';
import { SafeDatePickerModule }                                                         from '../../shared/directives/safe-date-picker/safe-date-picker.module';
import { LogoModule }                                                                   from '../../shared/logo/logo.module';
import { SimpleModalModule }                                                            from '../../shared/modal/simple-modal.module';
import { TabStorageService }                                                            from '../../shared/services/tab-storage.service';
import { QueryModule }                                                                  from '../query/query.module';
import { ModalDescribeComponent }                                                       from './components/modals/modal-describe/modal-describe.component';
import { ModalExportFileComponent }                                                     from './components/modals/modal-export-file/modal-export-file.component';
import { ModalFilterComponent }                                                         from './components/modals/modal-filter/modal-filter.component';
import { ModalImportFileComponent }                                                     from './components/modals/modal-import-file/modal-import-file.component';
import { ModalPurgeComponent }                                                          from './components/modals/modal-purge/modal-purge.component';
import { ModalRenameComponent }                                                         from './components/modals/modal-rename/modal-rename.component';
import { FormControlComponent }                                                         from './components/modals/modal-send-message/form-controls/form-control.component';
import { FormGroupComponent }                                                           from './components/modals/modal-send-message/form-controls/form-group.component';
import { ModalSendMessageComponent }                                                    from './components/modals/modal-send-message/modal-send-message.component';
import { ModalSettingsComponent }                                                       from './components/modals/modal-settings/modal-settings.component';
import { ModalTruncateComponent }                                                       from './components/modals/modal-truncate/modal-truncate.component';
import { StreamRightToolbarModule }                                                     from './components/show-stream-details-btn/stream-right-toolbar.module';
import { StreamDetailsComponent }                                                       from './components/stream-details/stream-details.component';
import { StreamViewReverseComponent }                                                   from './components/stream-view-reverse/stream-view-reverse.component';
import { StreamsGridLiveComponent }                                                     from './components/streams-grid-live/streams-grid-live.component';
import { StreamsLayoutComponent }                                                       from './components/streams-layout/streams-layout.component';
import { StreamsListComponent }                                                         from './components/streams-list/streams-list.component';
import { StreamsTabsComponent }                                                         from './components/streams-tabs/streams-tabs.component';
import { TimelineBarComponent }                                                         from './components/timeline-bar/timeline-bar.component';
import { StreamsSharedModule }                                                          from './modules/streams-shared/streams-shared.module';
import { ChartDataService }                                                             from './services/chart-data.service';
import { SchemaDataService }                                                            from './services/schema-data.service';
import { SendMessagePopupService }                                                      from './services/send-message-popup.service';
import { StreamDataService }                                                            from './services/stream-data.service';
import { reducers }                                                                     from './store';
import { FilterEffects }                                                                from './store/filter/filter.effects';
import { SelectedMessageEffects }                                                       from './store/seletcted-message/selected-message.effects';
import * as fromSelectedMessage
                                                                                        from './store/seletcted-message/selected-message.reducer';
import { StreamDetailsEffects }                                                         from './store/stream-details/stream-details.effects';
import * as fromStreamDetails
                                                                                        from './store/stream-details/stream-details.reducer';
import { StreamPropsEffects }                                                           from './store/stream-props/stream-props.effects';
import * as fromStreamProps
                                                                                        from './store/stream-props/stream-props.reducer';
import { StreamQueryEffects }                                                           from './store/stream-query/stream-query.effects';
import * as fromStreamQuery
                                                                                        from './store/stream-query/stream-query.reducer';
import { StreamsEffects }                                                               from './store/streams-list/streams.effects';
import * as fromStreams
                                                                                        from './store/streams-list/streams.reducer';
import { StreamsTabsEffects }                                                           from './store/streams-tabs/streams-tabs.effects';
import { TimelineBarEffects }                                                           from './store/timeline-bar/timeline-bar.effects';
import { StreamsNavigationModule }                                                      from './streams-navigation/streams-navigation.module';
import { StreamsRoutingModule }                                                         from './streams-routing.module';


const DEFAULT_PERFECT_SCROLLBAR_CONFIG: PerfectScrollbarConfigInterface = {
  suppressScrollX: false,
  suppressScrollY: false,
};

@NgModule({
  declarations: [
    StreamsLayoutComponent,
    StreamsListComponent,
    StreamDetailsComponent,
    StreamsTabsComponent,
    ModalFilterComponent,
    ModalSettingsComponent,
    TimelineBarComponent,
    StreamsGridLiveComponent,
    StreamViewReverseComponent,
    ModalTruncateComponent,
    ModalPurgeComponent,
    ModalRenameComponent,
    ModalSendMessageComponent,
    ModalDescribeComponent,
    FormGroupComponent,
    FormControlComponent,
    ModalExportFileComponent,
    ModalImportFileComponent,
  ],
  imports: [
    StreamsSharedModule,
    AutocompleteModule,
    ReactiveFormsModule,
    StreamsRoutingModule,
    StoreModule.forFeature('streams-store', reducers),
    StoreModule.forFeature('streams', fromStreams.reducer),
    StoreModule.forFeature('streamDetails', fromStreamDetails.reducer),
    StoreModule.forFeature('streamProps', fromStreamProps.reducer),
    StoreModule.forFeature('streamQuery', fromStreamQuery.reducer),
    EffectsModule.forFeature([StreamsEffects, StreamDetailsEffects, StreamPropsEffects, TimelineBarEffects, FilterEffects, StreamsTabsEffects, StreamQueryEffects, SelectedMessageEffects]),
    PerfectScrollbarModule,
    AngularSplitModule,
    TimepickerModule.forRoot(),
    ModalModule.forRoot(),
    TooltipModule,
    ContextMenuModule,
    StoreModule.forFeature(fromSelectedMessage.selectedMessageFeatureKey, fromSelectedMessage.reducer),
    ConfirmModalModule,
    SelectModule,
    StreamsNavigationModule,
    SimpleModalModule,
    QueryModule,
    SafeDatePickerModule,
    AccordionModule,
    TreeCheckboxesModule,
    ButtonsModule,
    BtnDatePickerModule,
    NgSelectModule,
    MultiSelectAutocompleteModule,
    ClickOutsideModule,
    DateRangePickerModule,
    FileBtnModule,
    DragProgressModule,
    LogoModule,
    StreamRightToolbarModule,
    SplitterSizesModule,
  ],
  entryComponents: [
    ModalFilterComponent,
    ModalSettingsComponent,
    ModalTruncateComponent,
    ModalPurgeComponent,
    ModalRenameComponent,
    ModalSendMessageComponent,
    ModalDescribeComponent,
  ],
  providers: [
    StreamDataService,
    ChartDataService,
    SchemaDataService,
    {
      provide: PERFECT_SCROLLBAR_CONFIG,
      useValue: DEFAULT_PERFECT_SCROLLBAR_CONFIG,
    },
    SendMessagePopupService,
    TabStorageService,
  ],
})

export class StreamsModule {
}
