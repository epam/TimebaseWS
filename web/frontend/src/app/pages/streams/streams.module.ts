import {DragDropModule} from '@angular/cdk/drag-drop';
import {ScrollingModule} from '@angular/cdk/scrolling';
import {NgModule} from '@angular/core';
import {ReactiveFormsModule} from '@angular/forms';
import {NgSelectModule} from '@ng-select/ng-select';
import {EffectsModule} from '@ngrx/effects';
import {StoreModule} from '@ngrx/store';
import {AngularSplitModule} from 'angular-split';
import {AccordionModule} from 'ngx-bootstrap/accordion';
import {ButtonsModule} from 'ngx-bootstrap/buttons';
import {ModalModule} from 'ngx-bootstrap/modal';
import {TimepickerModule} from 'ngx-bootstrap/timepicker';
import {TooltipModule} from 'ngx-bootstrap/tooltip';
import {ContextMenuModule} from '@perfectmemory/ngx-contextmenu';
import {MonacoEditorModule} from 'ngx-monaco-editor';
import {
  PERFECT_SCROLLBAR_CONFIG,
  PerfectScrollbarConfigInterface,
  PerfectScrollbarModule,
} from 'ngx-perfect-scrollbar';
import {AutocompleteModule} from 'src/app/libs/deltix-ng-autocomplete/src/ts/autocomplete.module';
import {SharedModule} from 'src/app/shared/shared.module';
import {DateRangePickerModule} from '../../shared/components/date-range-picker/date-range-picker.module';
import {FileBtnModule} from '../../shared/components/file-btn/file-btn.module';
import {ConfirmModalModule} from '../../shared/components/modals/modal-on-close-alert/confirm-modal.module';
import {MultiSelectAutocompleteModule} from '../../shared/components/multi-select-autocomplete/multi-select-autocomplete.module';
import {MultiSelectModule} from '../../shared/components/multi-select/multi-select.module';
import {SelectModule} from '../../shared/components/select/select.module';
import {SplitterSizesModule} from '../../shared/components/splitter-sizes/splitter-sizes.module';
import {TopGlobalMenuModule} from '../../shared/components/top-global-menu/top-global-menu.module';
import {TreeCheckboxesModule} from '../../shared/components/tree-checkboxes/tree-checkboxes.module';
import {ClickOutsideModule} from '../../shared/directives/click-outside/click-outside.module';
import {SafeDatePickerModule} from '../../shared/directives/safe-date-picker/safe-date-picker.module';
import {MultiselectNormalizeModule} from '../../shared/directives/single-dropdown/multiselect-normalize.module';
import {LiveGridModule} from '../../shared/live-grid/live-grid.module';
import {LogoModule} from '../../shared/logo/logo.module';
import {SimpleModalModule} from '../../shared/modal/simple-modal.module';
import {RightPaneModule} from '../../shared/right-pane/right-pane.module';
import {TabStorageService} from '../../shared/services/tab-storage.service';
import {OrderBookModule} from '../order-book/order-book.module';
import {QueryModule} from '../query/query.module';
import {BarsPeriodFilterComponent} from './components/deltix-charts/charts-filter/bars-period-filter/bars-period-filter.component';
import {ChartsFilterComponent} from './components/deltix-charts/charts-filter/charts-filter.component';
import {ChartsLayoutComponent} from './components/deltix-charts/charts-layout/charts-layout.component';
import {DeltixChartsComponent} from './components/deltix-charts/charts/deltix-charts.component';
import {CreateStreamModalComponent} from './components/modals/create-stream-modal/create-stream-modal.component';
import {ModalDescribeComponent} from './components/modals/modal-describe/modal-describe.component';
import {ModalExportFileComponent} from './components/modals/modal-export-file/modal-export-file.component';
import {ModalFilterComponent} from './components/modals/modal-filter/modal-filter.component';
import {ModalImportQSMSGFileComponent} from './components/modals/modal-import-QSMSG-file/modal-import-QSMSG-file.component';
import {ModalPurgeComponent} from './components/modals/modal-purge/modal-purge.component';
import {ModalRenameComponent} from './components/modals/modal-rename/modal-rename.component';
import {ModalSendMessageComponent} from './components/modals/modal-send-message/modal-send-message.component';
import {ModalSettingsComponent} from './components/modals/modal-settings/modal-settings.component';
import {ModalTruncateComponent} from './components/modals/modal-truncate/modal-truncate.component';
import {QueryBtnModule} from './components/query-btn/query-btn.module';
import {StreamDetailsComponent} from './components/stream-details/stream-details.component';
import {StreamViewReverseComponent} from './components/stream-view-reverse/stream-view-reverse.component';
import {StreamsGridLiveComponent} from './components/streams-grid-live/streams-grid-live.component';
import {StreamsLayoutComponent} from './components/streams-layout/streams-layout.component';
import {StreamsListComponent} from './components/streams-list/streams-list.component';
import {StreamsTabsComponent} from './components/streams-tabs/streams-tabs.component';
import {TimelineBarComponent} from './components/timeline-bar/timeline-bar.component';
import {SchemaDataService} from './services/schema-data.service';
import {SendMessagePopupService} from './services/send-message-popup.service';
import {SidebarContextMenuModule} from './sidebar-context-menu/sidebar-context-menu.module';
import {reducers} from './store';
import {FilterEffects} from './store/filter/filter.effects';
import {SelectedMessageEffects} from './store/seletcted-message/selected-message.effects';
import * as fromSelectedMessage from './store/seletcted-message/selected-message.reducer';
import {StreamDetailsEffects} from './store/stream-details/stream-details.effects';
import * as fromStreamDetails from './store/stream-details/stream-details.reducer';
import {StreamPropsEffects} from './store/stream-props/stream-props.effects';
import * as fromStreamProps from './store/stream-props/stream-props.reducer';
import {StreamQueryEffects} from './store/stream-query/stream-query.effects';
import * as fromStreamQuery from './store/stream-query/stream-query.reducer';
import {StreamsEffects} from './store/streams-list/streams.effects';
import * as fromStreams from './store/streams-list/streams.reducer';
import {StreamsTabsEffects} from './store/streams-tabs/streams-tabs.effects';
import {TimelineBarEffects} from './store/timeline-bar/timeline-bar.effects';
import {StreamsNavigationModule} from './streams-navigation/streams-navigation.module';
import {StreamsRoutingModule} from './streams-routing.module';
import {FiltersPanelModule} from './components/filters-panel/filters-panel.module';
import {DynamicFormBuilderModule} from '../../shared/utils/dynamic-form-builder/dynamic-form-builder.module';
import {ErrorModule} from '../../shared/error/error.module';
import { LeftSidebarComponent } from './components/left-sidebar/left-sidebar.component';
import { CreateViewModalComponent } from './components/modals/create-view/create-view-modal.component';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { QqlEditorModule } from '../../shared/qql-editor/qql-editor.module';
import { AutofocusModule } from '../../shared/directives/autofocus/autofocus.module';
import { StreamsListSearchComponent } from './components/streams-list/streams-list-search/streams-list-search.component';
import { PageLoadingModule } from '../../shared/page-loading/page-loading.module';
import { WriteModesModule } from '../../shared/components/write-modes-control/write-modes.module';
import {
    StreamDescribeContentModule
} from '../../shared/components/stream-describe-content/stream-describe-content.module';
import { GridTotalComponent } from '../../shared/components/grid-total/grid-total.component';
import { ModalImportCSVFileComponent } from './components/modals/modal-import-csv-file/modal-import-csv-file.component';
import { UploadFileComponent } from './components/csv-import/upload-file/upload-file.component';
import { SetUpParametersComponent } from './components/csv-import/set-up-parameters/set-up-parameters.component';
import { TimeParametersComponent } from './components/csv-import/time-parameters/time-parameters.component';
import { GeneralParametersComponent } from './components/csv-import/general-parameters/general-parameters.component';
import { GroupedParametersComponent } from './components/csv-import/grouped-parameters/grouped-parameters.component';
import { DelimitersAndSortingParametersComponent } from './components/csv-import/delimiters-and-sorting-parameters/delimiters-and-sorting-parameters.component';
import { TypesSettingComponent } from './components/csv-import/types-setting/types-setting.component';
import { SymbolSettingComponent } from './components/csv-import/symbol-setting/symbol-setting.component';
import { PreviewComponent } from './components/csv-import/preview/preview.component';
import { WriteModeAndTimeRangeComponent } from './components/csv-import/write-mode-and-time-range/write-mode-and-time-range.component';
import { ResizableModule } from 'src/app/shared/components/resizable/resizable.module';
import { ConfirmationModalComponent } from './components/modals/confirmation-modal/confirmation-modal.component';

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
        ModalExportFileComponent,
        ModalImportQSMSGFileComponent,
        DeltixChartsComponent,
        ChartsLayoutComponent,
        CreateStreamModalComponent,
        ChartsFilterComponent,
        BarsPeriodFilterComponent,
        LeftSidebarComponent,
        CreateViewModalComponent,
        StreamsListSearchComponent,
        ModalImportCSVFileComponent,
        UploadFileComponent,
        SetUpParametersComponent,
        TimeParametersComponent,
        GeneralParametersComponent,
        GroupedParametersComponent,
        DelimitersAndSortingParametersComponent,
        TypesSettingComponent,
        SymbolSettingComponent,
        PreviewComponent,
        WriteModeAndTimeRangeComponent,
        ConfirmationModalComponent,
    ],
    imports: [
        AutocompleteModule,
        ReactiveFormsModule,
        StreamsRoutingModule,
        StoreModule.forFeature('streams-store', reducers),
        StoreModule.forFeature('streams', fromStreams.reducer),
        StoreModule.forFeature('streamDetails', fromStreamDetails.reducer),
        StoreModule.forFeature('streamProps', fromStreamProps.reducer),
        StoreModule.forFeature('streamQuery', fromStreamQuery.reducer),
        EffectsModule.forFeature([
            StreamsEffects,
            StreamDetailsEffects,
            StreamPropsEffects,
            TimelineBarEffects,
            FilterEffects,
            StreamsTabsEffects,
            StreamQueryEffects,
            SelectedMessageEffects,
        ]),
        PerfectScrollbarModule,
        AngularSplitModule,
        TimepickerModule.forRoot(),
        ModalModule,
        TooltipModule,
        ContextMenuModule,
        StoreModule.forFeature(fromSelectedMessage.selectedMessageFeatureKey, fromSelectedMessage.reducer),
        ConfirmModalModule,
        SelectModule,
        StreamsNavigationModule,
        SimpleModalModule,
        QueryModule,
        OrderBookModule,
        SafeDatePickerModule,
        AccordionModule,
        TreeCheckboxesModule,
        ButtonsModule,
        // BtnDatePickerModule,
        NgSelectModule,
        MultiSelectAutocompleteModule,
        ClickOutsideModule,
        DateRangePickerModule,
        FileBtnModule,
        LogoModule,
        RightPaneModule,
        SplitterSizesModule,
        SidebarContextMenuModule,
        QueryBtnModule,
        DragDropModule,
        LiveGridModule,
        MultiselectNormalizeModule,
        ScrollingModule,
        MultiSelectModule,
        TopGlobalMenuModule,
        SharedModule,
        MonacoEditorModule,
        FiltersPanelModule,
        DynamicFormBuilderModule,
        ErrorModule,
        BsDropdownModule,
        QqlEditorModule,
        AutofocusModule,
        PageLoadingModule,
        WriteModesModule,
        StreamDescribeContentModule,
        GridTotalComponent,
        ResizableModule
    ],
    providers: [
        SchemaDataService,
        {
            provide: PERFECT_SCROLLBAR_CONFIG,
            useValue: DEFAULT_PERFECT_SCROLLBAR_CONFIG,
        },
        SendMessagePopupService,
        TabStorageService,
    ]
})
export class StreamsModule {}
