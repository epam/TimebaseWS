import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormGroup }                                                        from '@angular/forms';
import {
  ActivatedRoute,
  Data,
}                                                                           from '@angular/router';
import { select, Store }                                                    from '@ngrx/store';
import { BsModalRef, BsModalService }                                       from 'ngx-bootstrap';
import { Observable, ReplaySubject, Subject }                               from 'rxjs';
import {
  distinctUntilChanged,
  filter,
  map,
  mapTo,
  shareReplay,
  skip,
  skipWhile,
  startWith,
  switchMap,
  take,
  takeUntil,
  tap,
  withLatestFrom,
}                                                                           from 'rxjs/operators';
import { AppState }                                                         from '../../../../../../core/store';
import {
  DefaultTypeModel,
  SchemaClassTypeModel,
}                                                                           from '../../../../../../shared/models/schema.class.type.model';
import { StorageService }                                                   from '../../../../../../shared/services/storage.service';
import { FilterModel }                                                      from '../../../../models/filter.model';
import { TabModel }                                                         from '../../../../models/tab.model';
import { TabSettingsModel }                                                 from '../../../../models/tab.settings.model';
import { OnCloseTabAlertService }                                           from '../../../../services/on-close-tab-alert.service';
import * as StreamDetailsActions
                                                                            from '../../../../store/stream-details/stream-details.actions';
import * as fromStreamDetails
                                                                            from '../../../../store/stream-details/stream-details.reducer';
import {
  getStreamOrSymbolByID,
  streamsDetailsStateSelector,
}                                                                           from '../../../../store/stream-details/stream-details.selectors';
import * as fromStreams
                                                                            from '../../../../store/streams-list/streams.reducer';
import { State as ListState }                                               from '../../../../store/streams-list/streams.reducer';
import {
  getOpenNewTabState,
  getStreamsList,
  streamsListStateSelector,
}                                                                           from '../../../../store/streams-list/streams.selectors';
import * as StreamsTabsActions
                                                                            from '../../../../store/streams-tabs/streams-tabs.actions';
import { SetTabSettings }                                                   from '../../../../store/streams-tabs/streams-tabs.actions';
import {
  getActiveOrFirstTab,
  getActiveTab,
  getActiveTabFilters,
  getActiveTabSettings,
  getTabs,
}                                                                           from '../../../../store/streams-tabs/streams-tabs.selectors';
import { StreamMetaDataChangeModel }                                        from '../../models/stream.meta.data.change.model';
import { SeSelectionService }                                               from '../../services/se-selection.service';
import {
  CreateStream,
  EditSchemaResetState,
  GetDefaultTypes,
  GetSchema,
  GetSchemaDiff,
  RemoveSchemaDiff,
  SaveSchemaChanges,
  SetStreamId,
}                                                                           from '../../store/schema-editor.actions';
import {
  getAllSchemaItems,
  getDefaultsTypes,
  getSchemaDiff,
  getSelectedSchemaItem,
}                                                                           from '../../store/schema-editor.selectors';
import { SeFieldFormsService }                                              from '../../services/se-field-forms.service';
import { SeDataService }                                                    from '../../services/se-data.service';
import { TabStorageService }                                                from '../../../../../../shared/services/tab-storage.service';
import { SeSettings }                                                       from '../../models/se-settings';
import { IOutputData }                                                      from 'angular-split/lib/interface';

@Component({
  selector: 'app-se-layout',
  templateUrl: './se-layout.component.html',
  styleUrls: ['./se-layout.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [SeFieldFormsService, SeDataService, TabStorageService, SeSelectionService],
})
export class SeLayoutComponent implements OnInit, OnDestroy {
  @ViewChild('modalTemplate', {static: true}) modalTemplate;
  @ViewChild('saveSchemaChangesModalTemplate', {static: true}) saveSchemaChangesModalTemplate;
  
  public streamDetails: Observable<fromStreamDetails.State>;
  public selectedSchemaItem$: Observable<SchemaClassTypeModel>;
  public activeTab: Observable<TabModel>;
  public isSchemaEdited$: Observable<boolean>;
  public hasSchemaError$: Observable<boolean>;
  public getSchemaDiff$: Observable<StreamMetaDataChangeModel>;
  public defaultDataTypes$: Observable<DefaultTypeModel[]>;
  private isOpenInNewTab: boolean;
  private destroy$ = new Subject();
  
  private currentPosition;
  private tabFilter;
  public currentTab: TabModel;
  public tabName: string;
  public streamName: string;
  createStreamBtnClass$: Observable<string>;
  showClassListGrid$: Observable<boolean>;
  public newItemModalRef: BsModalRef;
  public saveChangesModalRef: BsModalRef;
  public keyForm: FormGroup;
  private saveChangesDisabledButtons = false;
  private onSchemaResetState$ = new ReplaySubject<boolean>(1);
  
  constructor(
    private appStore: Store<AppState>,
    private route: ActivatedRoute,
    private streamsStore: Store<fromStreams.FeatureState>,
    private streamDetailsStore: Store<fromStreamDetails.FeatureState>,
    private modalService: BsModalService,
    private storageService: StorageService,
    private seFieldFormsService: SeFieldFormsService,
    private seDataService: SeDataService,
    private tabStorageDataService: TabStorageService<SeSettings>,
    private onCloseTabAlertService: OnCloseTabAlertService,
  ) {
  }
  
  ngOnInit() {
    this.streamDetails = this.streamDetailsStore.pipe(select(streamsDetailsStateSelector));
    this.activeTab = this.appStore.pipe(select(getActiveOrFirstTab));
    this.getSchemaDiff$ = this.appStore.pipe(select(getSchemaDiff));
    this.defaultDataTypes$ = this.appStore.pipe(select(getDefaultsTypes));
    this.showClassListGrid$ = this.seDataService.showClassListGrid();
    
    const schemaItemsChanged$ = this.appStore.pipe(
      select(getAllSchemaItems),
      map(data => this.schemaToString(data)),
      distinctUntilChanged(),
      skipWhile(schema => !schema),
    );
    
    this.isSchemaEdited$ = this.onSchemaResetState$.pipe(
      switchMap(isCreate => {
        if (isCreate) {
          return schemaItemsChanged$.pipe(mapTo(true), startWith(false));
        }
        // Wait while first schema come from BE, skip it - and monitor changes removing and updating
        return schemaItemsChanged$.pipe(skip(1), mapTo(true), startWith(false));
      }),
      shareReplay(1),
    );
    
    const types$ = this.appStore.pipe(select(getAllSchemaItems));
    
    this.hasSchemaError$ = types$.pipe(
      switchMap(types => this.seFieldFormsService.hasAnyError().pipe(map(hasError => {
        return hasError || !types.filter(type => type._props._isUsed).length;
      }))),
    );
    
    types$.pipe(takeUntil(this.destroy$)).subscribe(types => {
      this.seFieldFormsService.typesChanged(types);
    });
    
    this.createStreamBtnClass$ = this.hasSchemaError$.pipe(map(hasError => hasError ? 'btn-danger' : 'btn-success'));
    
    this.isSchemaEdited$
      .pipe(
        withLatestFrom(this.appStore.pipe(select(getActiveTabSettings))),
        takeUntil(this.destroy$),
      )
      .subscribe(([isSchemaEdited, activeTabSettings]: [boolean, TabSettingsModel]) => {
        const tabSettings = {...activeTabSettings};
        if (isSchemaEdited) {
          tabSettings._showOnCloseAlerts = isSchemaEdited;
        } else {
          delete tabSettings._showOnCloseAlerts;
        }
        this.appStore.dispatch(new SetTabSettings({tabSettings}));
      });
    
    this.appStore.pipe(select(getOpenNewTabState)).subscribe(_openNewTab => this.isOpenInNewTab = _openNewTab);
    this.appStore.dispatch(GetDefaultTypes());
    
    this.appStore
      .pipe(
        select(streamsListStateSelector),
        filter(() => !!this.currentTab),
        takeUntil(this.destroy$),
      )
      .subscribe((listState: ListState) => {
        if (listState.dbState) {
          
          if (listState.dbState.renamed && listState.dbState.renamed.length) {
            const eqItem = listState.dbState.renamed.find(item => item.oldName === this.tabName);
            if (eqItem) {
              const tab = new TabModel({...{}, ...this.currentTab});
              tab.stream = eqItem.newName;
              this.streamsStore.dispatch(new StreamsTabsActions.AddTab({
                tab: tab,
                position: this.currentPosition,
              }));
              this.streamsStore.dispatch(new StreamsTabsActions.RemoveTab({
                tab: this.currentTab,
              }));
              
            }
          }
          
          if (listState.dbState.added.find(item => item === this.tabName) ||
            listState.dbState.changed.find(item => item === this.tabName)) {
            this.appStore.dispatch(new StreamsTabsActions.SetFilters({filter: this.tabFilter}));
          }
          
          if (listState.dbState.deleted.find(item => item === this.tabName)) {
            this.streamsStore.dispatch(new StreamsTabsActions.RemoveTab({
              tab: this.currentTab,
            }));
          }
          
        }
      });
    
    this.appStore
      .pipe(
        select(getActiveTabFilters),
        filter((filter) => !!filter),
        takeUntil(this.destroy$),
      )
      .subscribe((filter: FilterModel) => {
        this.tabFilter = {...filter};
      });
    
    this.selectedSchemaItem$ = this.appStore.pipe(select(getSelectedSchemaItem));
    
    this.route.params
      .pipe(
        filter((params: { stream: string, id: string, symbol?: string }) => !!params?.stream),
        tap(() => this.appStore.dispatch(EditSchemaResetState())),
        withLatestFrom(this.route.data),
        takeUntil(this.destroy$),
        switchMap((([params, data]: [{ stream: string, id: string, symbol?: string }, Data]) => {
          return this.appStore
            .pipe(
              select(getStreamsList),
              filter(streams => !!streams),
              switchMap(() => this.appStore.pipe(
                select(getStreamOrSymbolByID, {streamID: params.stream, symbol: params.symbol, uid: params.id}),
                filter((tabModel: TabModel) => !!tabModel),
              )),
              switchMap((tabModel: TabModel) => {
                this.onSchemaResetState$.next(tabModel.streamCreate);
                this.seFieldFormsService.streamChanged();
                
                return this.appStore.pipe(
                  select(getTabs),
                  filter((tabs) => !!tabs || (tabModel && tabModel.streamCreate)),
                  withLatestFrom(this.appStore
                    .pipe(
                      select(getActiveTab),
                      map(activeTab => activeTab ? activeTab.id : ''),
                    )),
                  map(([tabs, activeTabId]: [TabModel[], string]) => {
                    return [
                      tabModel,
                      data,
                      tabs,
                      activeTabId,
                    ];
                  }),
                );
              }),
              take(1),
            );
        })),
        takeUntil(this.destroy$),
      ).subscribe(([tabModel, data, tabs, activeTabId]: [TabModel, Data, TabModel[], string]) => {
      if (!tabModel.streamCreate) this.streamDetailsStore.dispatch(new StreamDetailsActions.GetSymbols({streamId: tabModel.stream}));
      //  this.reverse = data.hasOwnProperty('reverse');
      this.streamName = tabModel.stream;
      if (!tabModel.stream) return;
      const tab: TabModel = new TabModel({
        ...tabModel,
        ...data,
        active: true,
      });
      
      this.tabName = tabModel.stream;
      if (tabModel.symbol) {
        this.tabName += tabModel.symbol;
      }
      //   this.streamDetailsStore.dispatch(new StreamDetailsActions.SetFilterState(this.tabName));
      const tabsItemEquilPrev = tabs.find(item => item.id === tab.id);
      let position = -1;
      if (!this.isOpenInNewTab && activeTabId) {
        position = tabs.map(e => e.id).indexOf(activeTabId);
      }
      this.currentPosition = position;
      this.streamsStore.dispatch(new StreamsTabsActions.AddTab({
        tab: tab,
        position: position,
      }));
      
      this.currentTab = Object.assign({}, tab);
      
      const prevActTab = tabs.find(tab => tab.id === activeTabId); // Don't remember why is it
      if (!tabsItemEquilPrev && prevActTab && activeTabId !== tab.id && !this.isOpenInNewTab &&
        tab.type !== 'query' && prevActTab.type !== 'query' &&
        tab.type !== 'flow' && prevActTab.type !== 'flow') {
        prevActTab['live'] = false;
        this.streamsStore.dispatch(new StreamsTabsActions.RemoveTab({
          tab: prevActTab,
        }));
      }
      
      this.storageService.setPreviousActiveTab(tab);
      
      this.appStore.dispatch(SetStreamId({streamId: tab.stream}));
      if (!tabModel.streamCreate) this.appStore.dispatch(GetSchema());
    });
  }
  
  public onHideErrorMessage() {
    this.appStore.dispatch(new StreamDetailsActions.RemoveErrorMessage());
  }
  
  public onCreateStream() {
    this.newItemModalRef.hide();
    this.appStore.dispatch(CreateStream({key: this.streamName}));
  }
  
  ngOnDestroy(): void {
    this.appStore.dispatch(EditSchemaResetState());
    this.destroy$.next(true);
    this.destroy$.complete();
    this.streamsStore.dispatch(new StreamDetailsActions.StopSubscriptions());
    this.onCloseTabAlertService.resetNeedShowAlert();
  }
  
  public onAskToCreateStream() {
    this.newItemModalRef = this.modalService.show(this.modalTemplate, {
      class: 'modal-small',
      ignoreBackdropClick: true,
    });
  }
  
  public onAskChanges() {
    this.appStore.dispatch(GetSchemaDiff());
  }
  
  public onBackToEditor() {
    this.appStore.dispatch(RemoveSchemaDiff());
  }
  
  public onAskSaveChanges() {
    this.saveChangesDisabledButtons = false;
    this.saveChangesModalRef = this.modalService.show(this.saveSchemaChangesModalTemplate, {
      class: 'modal-small',
      ignoreBackdropClick: true,
    });
  }
  
  public onSaveChanges(background = false) {
    this.appStore.dispatch(SaveSchemaChanges({background, successAction: () => this.saveChangesModalRef.hide()}));
    if (!background) this.saveChangesDisabledButtons = true;
  }
  
  public ifSaveChangesDisabledButtons() {
    return this.saveChangesDisabledButtons;
  }
  
  onAreaSizeChange(sizeData: IOutputData) {
    this.tabStorageDataService.updateDataSync(data => ({...data, classListAreaSize: Number(sizeData.sizes[0])}));
  }
  
  private schemaToString(schema: SchemaClassTypeModel[]): string {
    if (!schema?.length) {
      return '';
    }
    
    return JSON.stringify(schema.map(type => ({
      ...type,
      _props: {
        _isUsed: type._props._isUsed,
      },
      fields: type.fields.map(field => ({
        ...field,
        type: {...field.type, encoding: field.type.encoding || ''},
        _props: null,
      })),
    })));
  }
}
