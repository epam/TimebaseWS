import { ChangeDetectionStrategy, Component, Input, OnDestroy, OnInit, Output, ViewChild, EventEmitter } from '@angular/core';
import {UntypedFormGroup} from '@angular/forms';
import {ActivatedRoute, Data} from '@angular/router';
import {select, Store} from '@ngrx/store';
import {IOutputData} from 'angular-split/lib/interface';
import {BsModalRef, BsModalService} from 'ngx-bootstrap/modal';
import {Observable, ReplaySubject, Subject, combineLatest, of} from 'rxjs';
import {
  debounceTime,
  delay,
  distinctUntilChanged,
  filter,
  map,
  mapTo,
  pluck,
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
import {AppState} from '../../../../../../core/store';
import {
  DefaultTypeModel,
  SchemaClassTypeModel,
} from '../../../../../../shared/models/schema.class.type.model';
import {PermissionsService} from '../../../../../../shared/services/permissions.service';
import {TabStorageService} from '../../../../../../shared/services/tab-storage.service';
import {TabModel} from '../../../../models/tab.model';
import {TabSettingsModel} from '../../../../models/tab.settings.model';
import {OnCloseTabAlertService} from '../../../../services/on-close-tab-alert.service';
import * as StreamDetailsActions from '../../../../store/stream-details/stream-details.actions';
import * as fromStreamDetails from '../../../../store/stream-details/stream-details.reducer';
import {streamsDetailsStateSelector} from '../../../../store/stream-details/stream-details.selectors';
import * as fromStreams from '../../../../store/streams-list/streams.reducer';
import {SetTabSettings} from '../../../../store/streams-tabs/streams-tabs.actions';
import {
  getActiveOrFirstTab,
  getActiveTab,
  getActiveTabSettings,
} from '../../../../store/streams-tabs/streams-tabs.selectors';
import {SeSettings} from '../../models/se-settings';
import {StreamMetaDataChangeModel} from '../../models/stream.meta.data.change.model';
import { SchemaEditorService } from '../../services/schema-editor.service';
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
  SetSchema,
  SetStreamId,
} from '../../store/schema-editor.actions';
import {
  getAllSchemaItems,
  getDefaultsTypes,
  getEditSchemaState,
  getSchemaDiff,
  getSelectedSchemaItem,
} from '../../store/schema-editor.selectors';
import { ClControlPanelComponent } from '../cl-control-panel/cl-control-panel.component';
import { FlControlPanelComponent } from '../fl-control-panel/fl-control-panel.component';
import { ClassEnumListItem } from '../../models/class-enum-list-item.model';
import { TopicService } from '../../services/topic.service';
import { StreamsService } from 'src/app/shared/services/streams.service';
import { SchemaValidityService } from '../../services/schema-validity.service';

@Component({
  selector: 'app-se-layout',
  templateUrl: './se-layout.component.html',
  styleUrls: ['./se-layout.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [SeFieldFormsService, SeDataService, TabStorageService, SeSelectionService],
})
export class SeLayoutComponent implements OnInit, OnDestroy {
  @Input() stream: string;
  @Input() schema: { types: SchemaClassTypeModel[]; all: SchemaClassTypeModel[] };
  @Input() extendable = true;
  @Input() insideModal = false;

  @Output() streamCreated = new EventEmitter<void>();
  
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
  classEnumList: ClassEnumListItem[];
  fieldList: string[];
  schemaChanged$: Observable<boolean>;
  showChanges: boolean = false;
  newStream: boolean;
  newTopic: boolean;
  topicStreamKey: string;
  readonly: boolean;
  public standaloneEnums: string[] = [];

  private destroy$ = new Subject();

  private saveChangesDisabledButtons = false;
  private onSchemaResetState$ = new ReplaySubject<boolean>(1);
  private lastFocusedElement: HTMLElement;

  constructor(
    private appStore: Store<AppState>,
    private route: ActivatedRoute,
    private streamsStore: Store<fromStreams.FeatureState>,
    private streamDetailsStore: Store<fromStreamDetails.FeatureState>,
    private modalService: BsModalService,
    private seFieldFormsService: SeFieldFormsService,
    private seDataService: SeDataService,
    private tabStorageDataService: TabStorageService<SeSettings>,
    private onCloseTabAlertService: OnCloseTabAlertService,
    private permissionsService: PermissionsService,
    private schemaEditorService: SchemaEditorService,
    private topicService: TopicService,
    private streamsService: StreamsService,
    private schemaValidityService: SchemaValidityService
  ) {}

  ngOnInit() {
    this.streamDetails = this.streamDetailsStore.pipe(select(streamsDetailsStateSelector));
    this.activeTab = this.appStore.pipe(select(getActiveOrFirstTab));
    this.getSchemaDiff$ = this.appStore.pipe(select(getSchemaDiff));
    this.defaultDataTypes$ = this.appStore.pipe(select(getDefaultsTypes));
    this.showClassListGrid$ = this.seDataService.showClassListGrid();
    this.isWriter$ = this.permissionsService.isWriter();
    this.schemaChanged$ = this.getSchemaDiff$.pipe(
      pluck('changes'),
      map(changes => !!changes?.length)
    )
    
    if (this.schema) {
      this.appStore.dispatch(SetSchema({ schema: this.schema }));
    }

    this.newStream = this.route.snapshot.data.streamCreate;
    this.newTopic = this.route.snapshot.data.topicCreate;
    this.readonly = this.route.snapshot.data.schemaView;

    this.topicStreamKey = this.topicService.dataForCopyToStream?.streamKey;

    const schemaItemsChanged$ = this.appStore.pipe(
      select(getAllSchemaItems),
      map((data) => this.schemaToString(data)),
      distinctUntilChanged(),
      skipWhile((schema) => !schema),
    );

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

    this.schemaEditorService.streamCreated$
      .pipe(filter(() => this.insideModal), takeUntil(this.destroy$))
      .subscribe(() => this.streamCreated.emit());

    combineLatest([ 
      this.appStore.pipe(select(getActiveTab)),
      this.isSchemaEdited$.pipe(filter(Boolean))
    ]).pipe(
        delay(500),
        filter(([tab]) => !!tab && !tab?.streamCreate && !tab?.topicCreate && !tab?.isTopic),
        debounceTime(500),
        takeUntil(this.destroy$))
      .subscribe(() => this.appStore.dispatch(GetSchemaDiff()));

    const types$ = this.appStore.pipe(select(getAllSchemaItems));

    this.hasSchemaError$ = types$.pipe(
      switchMap((types) => {
        return this.seFieldFormsService.hasAnyError().pipe(
          map((hasError) => {
            const fieldList = types.reduce((acc, type) => [...acc, ...type.fields], []);
            const isObjectType = (typeName: string) => typeName === 'OBJECT';

            const objectTypeFields = fieldList.filter(field => isObjectType(field.type.name));
            const arrayOfObjectsTypeFields = fieldList
              .filter(field => field.type.name === 'ARRAY' && isObjectType(field.type.elementType?.name));

            return hasError || !types.filter((type) => type._props._isUsed).length
              || objectTypeFields.some(field => !field.type.types?.length) 
              || arrayOfObjectsTypeFields.some(field => !field.type.elementType.types?.length)
              || this.schemaValidityService.hasAnyError(this.insideModal)
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
        if (isSchemaEdited || this.newStream) {
          tabSettings._showOnCloseAlerts = isSchemaEdited || this.newStream;
        } else {
          delete tabSettings._showOnCloseAlerts;
        }
        this.appStore.dispatch(new SetTabSettings({tabSettings}));
      });

    this.appStore.dispatch(GetDefaultTypes());

    this.selectedSchemaItem$ = this.appStore.pipe(select(getSelectedSchemaItem));

    this.route.params
      .pipe(
        filter((params: {stream: string; id: string; symbol?: string}) => !!params?.stream),
        tap(() => this.appStore.dispatch(EditSchemaResetState())),
        withLatestFrom(this.route.data),
        takeUntil(this.destroy$),
        switchMap(([, data]: [{stream: string; id: string; symbol?: string}, Data]) => {
          return this.appStore.pipe(
            select(getActiveTab),
            filter((tabModel: TabModel) => !!tabModel),
            take(1),
            map((tabModel: TabModel) => {
              this.onSchemaResetState$.next(tabModel.streamCreate || tabModel.topicCreate);
              this.seFieldFormsService.streamChanged();
              return [tabModel, data];
            }),
          );
        }),
        takeUntil(this.destroy$),
      )
      .subscribe(([tabModel, data]: [TabModel, Data]) => {
        if (!tabModel.streamCreate && !tabModel)
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
        if (!tabModel.streamCreate && !tabModel.topicCreate) {
          this.appStore.dispatch(GetSchema({ topic: tabModel.schemaView }));
        } else if (this.topicService.dataForCopyToStream?.copyToExistingStream) {
          this.appStore.dispatch(GetSchema({ topic: tabModel.schemaView, streamKey: this.topicStreamKey }));     
        }
      });

    this.modalService.onHide
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.lastFocusedElement?.focus())
  }

  public onHideErrorMessage() {
    this.appStore.dispatch(new StreamDetailsActions.RemoveErrorMessage());
  }

  public onCreateStream(newTopic = false) {
    this.newItemModalRef?.hide();
    const streamKey = this.insideModal ? this.stream : this.streamName;
    this.appStore.dispatch(CreateStream({
      key: streamKey, 
      topic: newTopic, 
      version: newTopic ? this.topicService.dataForCopyToStream?.storageVersion : this.streamsService.streamCreationData.storageVersion,
      distributionFactor: newTopic ? this.topicService.dataForCopyToStream?.distributionFactor : this.streamsService.streamCreationData.distributionFactor,
      copyToStream: this.topicStreamKey, 
      noNotification: this.insideModal }));
    this.topicService.dataForCopyToStream = null;
  }

  ngOnDestroy(): void {
    this.appStore.dispatch(EditSchemaResetState());
    this.destroy$.next(true);
    this.destroy$.complete();
    this.streamsStore.dispatch(new StreamDetailsActions.StopSubscriptions());
    this.onCloseTabAlertService.resetNeedShowAlert();
    this.schemaEditorService.clearEditedItems();
    this.schemaValidityService.clearAllErrors(this.insideModal);
  }

  public onAskToCreateStream() {
    this.getStandaloneEnums()
      .pipe(take(1))
      .subscribe(() => {
        this.newItemModalRef = this.modalService.show(this.modalTemplate, {
          class: 'modal-small',
          ignoreBackdropClick: true,
        });
      });
  }

  public onAskChanges() {
    if (this.newStream) {
      this.appStore.dispatch(GetSchemaDiff());
    }
    this.showChanges = true;
  }

  public onBackToEditor() {
    if (this.newStream) {
      this.appStore.dispatch(RemoveSchemaDiff());
    }
    this.showChanges = false;
  }

  public onAskSaveChanges() {
    this.saveChangesDisabledButtons = false;
    this.getStandaloneEnums()
      .pipe(take(1))
      .subscribe(() => {
        this.saveChangesModalRef = this.modalService.show(this.saveSchemaChangesModalTemplate, {
          class: 'modal-small',
          ignoreBackdropClick: true,
        });
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

  setClassEnumList(itemList: ClassEnumListItem[]) {
    this.classEnumList = itemList;
  }

  setFieldList(itemList: string[]) {
    this.fieldList = itemList;
  }

  private getStandaloneEnums() {
    return this.appStore.pipe(select(getEditSchemaState))
      .pipe(
        take(1), takeUntil(this.destroy$),
        switchMap(({ classes, enums }) => {
          const standaloneEnums = new Set(enums.map(e => e.name));
          classes.forEach(classItem => {
            classItem.fields.forEach(field => {
            if (standaloneEnums.has(field.type.name)) {
              standaloneEnums.delete(field.type.name);
            }
            if (standaloneEnums.has(field.type.elementType?.name)) {
              standaloneEnums.delete(field.type.elementType?.name);
            }
          })
        });
        this.standaloneEnums = Array.from(standaloneEnums);
        return of(null);
      })
    )
  }
}
