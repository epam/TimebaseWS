import {ChangeDetectionStrategy, Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {UntypedFormGroup} from '@angular/forms';
import {ActivatedRoute, Data} from '@angular/router';
import {select, Store} from '@ngrx/store';
import {IOutputData} from 'angular-split/lib/interface';
import {BsModalRef, BsModalService} from 'ngx-bootstrap/modal';
import {Observable, ReplaySubject, Subject} from 'rxjs';
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
} from 'rxjs/operators';
import { SchemaService } from 'src/app/shared/services/schema.service';
import { StreamsService } from 'src/app/shared/services/streams.service';
import {AppState} from '../../../../../../core/store';
import {
  DefaultTypeModel,
  SchemaClassTypeModel,
} from '../../../../../../shared/models/schema.class.type.model';
import {PermissionsService} from '../../../../../../shared/services/permissions.service';
import {StorageService} from '../../../../../../shared/services/storage.service';
import {TabStorageService} from '../../../../../../shared/services/tab-storage.service';
import {FilterModel} from '../../../../models/filter.model';
import {TabModel} from '../../../../models/tab.model';
import {TabSettingsModel} from '../../../../models/tab.settings.model';
import {OnCloseTabAlertService} from '../../../../services/on-close-tab-alert.service';
import * as StreamDetailsActions from '../../../../store/stream-details/stream-details.actions';
import * as fromStreamDetails from '../../../../store/stream-details/stream-details.reducer';
import {streamsDetailsStateSelector} from '../../../../store/stream-details/stream-details.selectors';
import * as fromStreams from '../../../../store/streams-list/streams.reducer';
import {getOpenNewTabState} from '../../../../store/streams-list/streams.selectors';

import {SetTabSettings} from '../../../../store/streams-tabs/streams-tabs.actions';
import {
  getActiveOrFirstTab,
  getActiveTab,
  getActiveTabFilters,
  getActiveTabSettings,
} from '../../../../store/streams-tabs/streams-tabs.selectors';
import {SeSettings} from '../../models/se-settings';
import {StreamMetaDataChangeModel} from '../../models/stream.meta.data.change.model';
import { SchemaEditorService } from '../../services/add-class.service';
import {SeDataService} from '../../services/se-data.service';
import {SeFieldFormsService} from '../../services/se-field-forms.service';
import {SeSelectionService} from '../../services/se-selection.service';
import {
  CreateStream,
  EditSchemaResetState,
  GetDefaultTypes,
  GetSchema,
  GetSchemaDiff,
  RemoveSchemaDiff,
  SaveSchemaChanges,
  SetStreamId,
} from '../../store/schema-editor.actions';
import {
  getAllSchemaItems,
  getDefaultsTypes,
  getSchemaDiff,
  getSelectedSchemaItem,
} from '../../store/schema-editor.selectors';
import { ClControlPanelComponent } from '../cl-control-panel/cl-control-panel.component';
import { FlControlPanelComponent } from '../fl-control-panel/fl-control-panel.component';

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
  @ViewChild(ClControlPanelComponent) classControlPanel: ClControlPanelComponent;
  @ViewChild(FlControlPanelComponent) fieldControlPanel: FlControlPanelComponent;

  streamDetails: Observable<fromStreamDetails.State>;
  selectedSchemaItem$: Observable<SchemaClassTypeModel>;
  activeTab: Observable<TabModel>;
  isSchemaEdited$: Observable<boolean>;
  hasSchemaError$: Observable<boolean>;
  getSchemaDiff$: Observable<StreamMetaDataChangeModel>;
  defaultDataTypes$: Observable<DefaultTypeModel[]>;

  currentTab: TabModel;
  tabName: string;
  streamName: string;
  createStreamBtnClass$: Observable<string>;
  showClassListGrid$: Observable<boolean>;
  newItemModalRef: BsModalRef;
  saveChangesModalRef: BsModalRef;
  keyForm: UntypedFormGroup;
  isWriter$: Observable<boolean>;

  private isOpenInNewTab: boolean;
  private destroy$ = new Subject();

  private tabFilter;
  private saveChangesDisabledButtons = false;
  private onSchemaResetState$ = new ReplaySubject<boolean>(1);
  private lastFocusedElement: HTMLElement;

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
    private permissionsService: PermissionsService,
    private schemaEditorService: SchemaEditorService,
    private streamsService: StreamsService,
    private schemaService: SchemaService
  ) {}

  ngOnInit() {
    this.streamDetails = this.streamDetailsStore.pipe(select(streamsDetailsStateSelector));
    this.activeTab = this.appStore.pipe(select(getActiveOrFirstTab));
    this.getSchemaDiff$ = this.appStore.pipe(select(getSchemaDiff));
    this.defaultDataTypes$ = this.appStore.pipe(select(getDefaultsTypes));
    this.showClassListGrid$ = this.seDataService.showClassListGrid();
    this.isWriter$ = this.permissionsService.isWriter();

    const schemaItemsChanged$ = this.appStore.pipe(
      select(getAllSchemaItems),
      map((data) => this.schemaToString(data)),
      distinctUntilChanged(),
      skipWhile((schema) => !schema),
    );

    this.appStore
      .pipe(
        select(getActiveTab),
        filter((tab: TabModel) => !this.route.snapshot.data.streamCreate && !!tab?.stream),
        switchMap((tab: TabModel) => this.schemaService.getSchema(tab?.stream)))
      .subscribe();

    this.isSchemaEdited$ = this.onSchemaResetState$.pipe(
      switchMap((isCreate) => {
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
      switchMap((types) => {
        return this.seFieldFormsService.hasAnyError().pipe(
          map((hasError) => {
            const objectTypeFields = types.reduce((acc, type) => [...acc, ...type.fields], []).filter(field => field.type.elementType);
            return hasError || !types.filter((type) => type._props._isUsed).length || 
              objectTypeFields.some(field => !field.type.elementType.types.length);
          }),
        )
      })
    )

    types$.pipe(takeUntil(this.destroy$)).subscribe((types) => {
      this.seFieldFormsService.typesChanged(types);
    });

    this.createStreamBtnClass$ = this.hasSchemaError$.pipe(
      map((hasError) => (hasError ? 'btn-danger' : 'btn-success')),
    );

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

    this.appStore
      .pipe(select(getOpenNewTabState))
      .subscribe((_openNewTab) => (this.isOpenInNewTab = _openNewTab));
    this.appStore.dispatch(GetDefaultTypes());

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
        filter((params: {stream: string; id: string; symbol?: string}) => !!params?.stream),
        tap(() => this.appStore.dispatch(EditSchemaResetState())),
        withLatestFrom(this.route.data),
        takeUntil(this.destroy$),
        switchMap(([params, data]: [{stream: string; id: string; symbol?: string}, Data]) => {
          return this.appStore.pipe(
            select(getActiveTab),
            filter((tabModel: TabModel) => !!tabModel),
            take(1),
            map((tabModel: TabModel) => {
              this.onSchemaResetState$.next(tabModel.streamCreate);
              this.seFieldFormsService.streamChanged();
              return [tabModel, data];
            }),
          );
        }),
        takeUntil(this.destroy$),
      )
      .subscribe(([tabModel, data]: [TabModel, Data]) => {
        if (!tabModel.streamCreate)
          this.streamDetailsStore.dispatch(
            new StreamDetailsActions.GetSymbols({streamId: tabModel.stream}),
          );
        this.streamName = tabModel.stream;
        if (!tabModel.stream) return;
        const tab: TabModel = new TabModel({
          ...tabModel,
          ...data,
          active: true,
        });
        this.currentTab = Object.assign({}, tab);

        this.tabName = tabModel.stream;
        if (tabModel.symbol) {
          this.tabName += tabModel.symbol;
        }

        this.appStore.dispatch(SetStreamId({streamId: tab.stream}));
        if (!tabModel.streamCreate) {
          this.appStore.dispatch(GetSchema());
        }
      });

    this.modalService.onHide
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.lastFocusedElement?.focus())
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
    this.schemaEditorService.clearEditedItems();
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
    this.appStore.dispatch(
      SaveSchemaChanges({background, successAction: () => this.saveChangesModalRef.hide()}),
    );
    if (!background) this.saveChangesDisabledButtons = true;
  }

  public ifSaveChangesDisabledButtons() {
    return this.saveChangesDisabledButtons;
  }

  onAreaSizeChange(sizeData: IOutputData) {
    this.tabStorageDataService.updateDataSync((data) => ({
      ...data,
      classListAreaSize: Number(sizeData.sizes[0]),
    }));
  }

  private schemaToString(schema: SchemaClassTypeModel[]): string {
    if (!schema?.length) {
      return '';
    }

    return JSON.stringify(
      schema.map((type) => ({
        ...type,
        _props: {
          _isUsed: type._props._isUsed,
        },
        fields: type.fields.map((field) => ({
          ...field,
          type: {...field.type, encoding: field.type.encoding || ''},
          _props: null,
        })),
      })),
    );
  }

  public addNewItemToClassList(target: HTMLElement) {
    this.lastFocusedElement = target;
    const insertionType = target.parentElement.classList.contains('classItem') ? 'class' : 'enum';
    this.classControlPanel.onAskToAdd(insertionType === 'enum');
  }

  public addNewItemToFieldsList([target, isStatic]) {
    this.lastFocusedElement = target;
    this.fieldControlPanel.onAskToAdd(isStatic);
  }
}
