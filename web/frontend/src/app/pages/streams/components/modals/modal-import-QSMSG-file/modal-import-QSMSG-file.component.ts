import { HttpErrorResponse }                                             from '@angular/common/http';
import { Component, OnDestroy, OnInit, TemplateRef, ViewChild }                       from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators }              from '@angular/forms';
import { select, Store }                                                 from '@ngrx/store';
import { TranslateService }                                              from '@ngx-translate/core';
import { BsModalRef, BsModalService }                                                    from 'ngx-bootstrap/modal';
import {
  BehaviorSubject,
  combineLatest,
  Observable,
  of,
  ReplaySubject,
  Subject,
  Subscription,
  throwError,
}                                                                        from 'rxjs';
import {
  catchError, debounceTime,
  distinctUntilChanged,
  filter,
  finalize,
  map,
  pairwise, publishReplay, refCount,
  startWith,
  switchMap,
  take,
  takeUntil, tap, first
} from 'rxjs/operators';
import { WriteMode }            from '../../../../../shared/components/write-modes-control/write-mode';
import { dateToTimezone }       from '../../../../../shared/locale.timezone';
import { GlobalFiltersService } from '../../../../../shared/services/global-filters.service';
import { ImportService }        from '../../../../../shared/services/import.service';
import { StreamsService }       from '../../../../../shared/services/streams.service';
import {
  dateToUTC,
  getTimeZones,
  getTimeZoneTitle,
  nullTimezone,
}                               from '../../../../../shared/utils/timezone.utils';
import {
  ImportProgress,
  ImportProgressType,
  ImportStateMessage,
}                               from '../../../models/import-progress';
import { PeriodicityType }                                               from '../../../models/periodicity-type';
import * as fromStreams
                                                                         from '../../../store/streams-list/streams.reducer';
import { streamsListStateSelector }                                      from '../../../store/streams-list/streams.selectors';
import { StreamModel } from '../../../models/stream.model';
import { SchemaClassTypeModel } from 'src/app/shared/models/schema.class.type.model';
import { SeLayoutComponent } from '../../../modules/schema-editor/components/se-layout/se-layout.component';
import { AppState } from 'src/app/core/store';
import { getActiveTab } from '../../../store/streams-tabs/streams-tabs.selectors';
import { getDefaultTimebase, getTimebases } from '../../../store/timebases/timebases.selectors';
import { TimebaseInstanceDef } from '../../../../../shared/models/timebase-instance-def.model';
import * as NotificationsActions from '../../../../../core/modules/notifications/store/notifications.actions';
import * as StreamsActions from '../../../store/streams-list/streams.actions';
import { KeyValue } from '@angular/common';

const minHeightValues = {
  fileInput: 570,
  schema: 665,
  uploading: 350
};

@Component({
  selector: 'app-modal-import-QSMSG-file',
  templateUrl: './modal-import-QSMSG-file.component.html',
  styleUrls: ['./modal-import-QSMSG-file.component.scss'],
})
export class ModalImportQSMSGFileComponent implements OnInit, OnDestroy {
  @ViewChild(SeLayoutComponent) schemaEditor!: SeLayoutComponent;
  @ViewChild('dataLossWarning') dataLossWarning: TemplateRef<HTMLElement>;

  tbId: string = null;
  timebases$: Observable<TimebaseInstanceDef[]>;
  form: UntypedFormGroup;
  autocomplete$: Observable<string[]>;
  
  uploading = false;
  uploadingFile = false;
  uploadingFileProgress = 0;
  importFinished = false;
  importError = false;
  progress$: Observable<number>;
  messages: ImportProgress[] = [];
  importProgressTypes = ImportProgressType;
  periodicityTypes$: Observable<{ id: string; name: string }[]>;
  timezones: { id: string; name: string }[];
  periodicityTypes = PeriodicityType;
  nullTimezone = nullTimezone;
  showFileBy$: Observable<boolean>;
  fileByConfig = ['space', 'symbol'];
  versionOptions = [ { id: '4', name: '4' }, { id: '5', name: '5' } ];
  stream: string;
  displayStreamName: string;
  existingStream$: Observable<string>;
  newStreamCreated: boolean = false;
  streamList: StreamModel[];
  importStep: 'fileInput' | 'schema' = 'fileInput';
  distributionFactorOptions = ['1', 'MAX'];
  fileUploadingSubscription: Subscription;
  schema: { types: SchemaClassTypeModel[]; all: SchemaClassTypeModel[] };
  nameOfCreatingStream: string;
  schemaButtonDisabled: boolean = false;
  importButtonDisabled: boolean = false;
  schemaEditingDisabled: boolean = false;
  minHeight: number = minHeightValues.fileInput;
  stremaKey: string;
  conformationModalOpen = false;
  schemaInvalid$: Observable<boolean>;
  showDistributionFactorInput$ = new BehaviorSubject(false);
  importToExistingStream: boolean;
  validationErrorMessages = {
    file: '',
    stream: '',
    distributionFactor: '',
    startTime: '',
    endTime: '',
    timeRange: ''
  };

  private confirmationModal: BsModalRef;
  private uploadProgress$ = new BehaviorSubject(0);
  private importProgress$ = new BehaviorSubject(0);
  private _tbId$ = new BehaviorSubject<string>(null);
  private uploadId: number;
  private cancel$ = new Subject();
  private destroy$ = new ReplaySubject(1);
  
  constructor(
    private fb: UntypedFormBuilder,
    private streamsStore: Store<fromStreams.FeatureState>,
    private importService: ImportService,
    private bsModalRef: BsModalRef,
    private modalService: BsModalService,
    private translateService: TranslateService,
    private globalFiltersService: GlobalFiltersService,
    private streamsService: StreamsService,
    private appStore: Store<AppState>,
  ) {}
  
  ngOnInit(): void {
    this.timebases$ = this.appStore.pipe(select(getTimebases));
    this.appStore.pipe(select(getDefaultTimebase), take(1)).subscribe(defaultTb => {
      if (!this.tbId && defaultTb?.id) {
        this.tbId = defaultTb.id;
      }
    });
    this._tbId$.next(this.tbId);

    this.progress$ = combineLatest([this.uploadProgress$, this.importProgress$]).pipe(
      map(([uploadProgress, importProgress]) => Math.floor((uploadProgress + importProgress) / 2)),
    );
    
    this.periodicityTypes$ = this.translateService.get('importFromFile.periodicityTypes').pipe(
      map((translations) => {
        return [
          {id: PeriodicityType.regular, name: translations.regular},
          {id: PeriodicityType.irregular, name: translations.irregular},
          {id: PeriodicityType.static, name: translations.static},
        ];
      }),
    );
    
    this.timezones = getTimeZones().map((timezone) => ({
      ...timezone,
      id: timezone.name,
      name: getTimeZoneTitle(timezone),
    }));

    const validateRange = (fg: UntypedFormGroup) => {
      if (!fg.get('setRange').value) {
        return null;
      }
      
      const rangeControl = fg.get('range');
      const range = rangeControl.value;
      
      if (rangeControl.touched) {
        this.validationErrorMessages.startTime = range.start && range.start === 'Invalid Date' ? 'Invalid start time' : '';
        this.validationErrorMessages.endTime = range.end && range.end === 'Invalid Date' ? 'Invalid end time' : '';
        this.validationErrorMessages.timeRange = !range.start && !range.end ? 'Invalid time range' : '';
      }
      
      return range.start !== 'Invalid Date' && range.end !== 'Invalid Date' && (range.start || range.end) ? 
        null : { needRange: true };
    };
    
    this.form = this.fb.group(
      {
        file: [null, Validators.required],
        fileBy: 'space',
        stream: ['', Validators.required],
        writeMode: WriteMode.rewrite,
        description: '',
        symbols: [[]],
        setRange: false,
        periodicity: this.fb.group(
          {
            type: PeriodicityType.irregular,
            value: null,
          },
          {
            validators: (group: UntypedFormGroup) => {
              if (group.value.type !== PeriodicityType.regular) {
                return null;
              }
              return group.value.value?.aggregation ? null : { required: true };
            },
          },
        ),
        version: '5',
        distributionFactor: 'MAX',
        timezone: null,
        range: {start: null, end: null},
      },
      {validators: [validateRange, this.validateDistributionFactor()]},
    );

    this.form.get('range').valueChanges
      .pipe(take(1), takeUntil(this.destroy$))
      .subscribe(() => this.form.get('range').markAsTouched());

    this.form.get('version').valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(version => this.showDistributionFactorInput$.next(version === '4'));

    this.form.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(formData => {
        this.validationErrorMessages.file = (!formData.file && !this.form.get('file').pristine) ? 
          'Importing file is required' : '';
        this.validationErrorMessages.stream = (!formData.stream && !this.form.get('stream').pristine) ? 
          'Stream is required' : '';
      });

    this.form.valueChanges
      .pipe(
        takeUntil(this.destroy$), 
        distinctUntilChanged(), 
        filter(() => this.importStep === 'fileInput' && !this.uploading))
      .subscribe(() => this.finishImportSession());
    
    this.showFileBy$ = this.form.get('file').valueChanges.pipe(
      startWith(this.form.get('file').value),
      map((files: FileList) =>
        [
          'application/zip',
          'application/octet-stream',
          'application/x-zip-compressed',
          'multipart/x-zip',
        ].includes(files?.[0].type),
      ),
    );
    
    this.globalFiltersService
      .getFilters()
      .pipe(take(1))
      .subscribe((filters) => this.form.get('timezone').patchValue(filters.timezone[0].name));
    
    this.autocomplete$ = this._tbId$.pipe(
      switchMap(tbId => this.streamsService.getList(false, null, null, tbId || null)),
      map((streams: StreamModel[]) => {
        if (this.stream) {
          this.displayStreamName = streams.find(s => s.key === this.stream)?.name;
          this.form.patchValue({ stream: this.displayStreamName ?? '' });
        }
        this.streamList = streams;
        return streams.map(s => s.name);
      }),
      publishReplay(1),
      refCount(),
    );
    
    this.form
      .get('timezone')
      .valueChanges.pipe(
        pairwise(),
        filter(([[timezoneOld], [timezoneNew]]) => timezoneOld && timezoneNew),
        takeUntil(this.destroy$),
      )
      .subscribe(([[timezoneOld], [timezoneNew]]) => {
        const update = this.form.get('range').value;
        if (update.start) {
          update.start = dateToTimezone(
            dateToUTC(update.start, timezoneOld.name),
            timezoneNew.name,
          );
        }
        
        if (update.end) {
          update.end = dateToTimezone(dateToUTC(update.end, timezoneOld.name), timezoneNew.name);
        }
        this.form.get('range').patchValue(update);
      });
    
    this.existingStream$ = combineLatest([
      this.autocomplete$,
      this.form.get('stream').valueChanges.pipe(startWith(this.stream), debounceTime(300)),
    ]).pipe(
      map(([streams, stream]) => {
        if (streams.includes(stream)) {
          const targetStream = this.streamList.find(s => s.name === stream);
          if (!targetStream || targetStream.name !== this.displayStreamName) {
            this.displayStreamName = null;
          }
          this.importToExistingStream = !!(targetStream?.key ?? null);
          return targetStream?.key ?? null;
        } else {
          this.displayStreamName = null;
          this.importToExistingStream = false;
          return null;
        }
      }),
      publishReplay(1),
      refCount(),
    );
    
    this.existingStream$.pipe(
      tap(existing => {
        if (existing) {
          this.form.get('description').disable();
        } else {
          this.form.get('description').enable();
        }
      }),
      switchMap(stream => stream ? this.streamsService.getProps(stream) : of(null)),
      map(props => ({ description: props?.props?.description, version: props?.props?.version })),
      distinctUntilChanged((props1, props2) => JSON.stringify(props1) === JSON.stringify(props2)),
      takeUntil(this.destroy$),
    ).subscribe(({ description, version }) => {
      this.form.get('version').patchValue(version ?? '5');
      this.form.get('description').patchValue(description);
    });

    combineLatest([
      this.appStore.pipe(select(getActiveTab)),
      this.existingStream$
    ])
      .pipe(filter(([tab, stream]) => (tab?.schemaEdit || tab?.schemaView) && !stream), takeUntil(this.destroy$))
      .subscribe(() => {
        this.schemaEditingDisabled = true;
        this.appStore.dispatch(
          new NotificationsActions.AddNotification({
            message: 'You may encounter synchronization issues when editing a schema. To make editing possible please close the tab with a schema',
            dismissible: true,
            closeInterval: 15000,
            type: 'warning',
          }),
        );
      })

    this.bsModalRef.onHide
      .pipe(first(), takeUntil(this.destroy$))
      .subscribe(() => this.cancelImport());
  }
  
  onTbChange(tbId: string) {
    this.tbId = tbId;
    this._tbId$.next(tbId);
  }

  onStreamChange(search: string) {
    this.form.get('stream').patchValue(search);
  }
  
  import() {
    if (!this.uploadId) {
      this.uploadingFile = true;
      this.importButtonDisabled = true;
      const formData = this.form.getRawValue();

      this.initImport(formData)
        .pipe(
          switchMap((uploadId: number) => {
            this.uploadId = uploadId;
            return this.importService.importChunks(uploadId, formData.file[0]);
          }),
          tap(uploadProgress => this.uploadingFileProgress = Math.ceil(uploadProgress * 100)),
          catchError((e: HttpErrorResponse) => this.catchResponceError(e)),
          takeUntil(this.cancel$),
          filter(progress => +progress === 1)
        ).subscribe({
          next: () => {
            this.importButtonDisabled = false;
            this.checkDataLosses();
          },
          error: () => {
            this.uploadingFile = false;
            this.importButtonDisabled = false;
          } 
        });
    } else {
      this.checkDataLosses();
    }
  }

  createStreamAndImport() {
    this.schemaEditor.onCreateStream();
  }
  
  cancelImport() {
    this.cancel$.next();
    this.minHeight = minHeightValues.fileInput;
    const cancel$ = this.uploadId ? this.importService.cancelImport(this.uploadId) : of(null);
    cancel$.pipe(finalize(() => this.return())).subscribe();
  }
  
  finish() {
    this.bsModalRef.hide();
  }
  
  return(removeUploadId = true) {
    this.importStep = 'fileInput';
    this.minHeight = minHeightValues.fileInput;
    
    if (this.newStreamCreated && (!this.importFinished || this.importError)) {
      this.newStreamCreated = false;
      this.appStore.dispatch(
        new StreamsActions.AskToDeleteStream({ streamKey: this.nameOfCreatingStream, noNotification: true }))
    }

    this.uploadProgress$.next(0);
    this.importProgress$.next(0);
    if (removeUploadId) {
      this.uploadId = null;
    }
    
    this.uploading = false;
    this.uploadingFile = false;
    this.uploadingFileProgress = 0;
    this.importFinished = false;
    this.importError = false;
    this.messages = [];
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  editSchema() {
    const storageVersion = this.form.get('version').value;
    const distributionFactor = this.form.get('distributionFactor').value;
    this.streamsService.streamCreationData = {
      storageVersion,
      distributionFactor: storageVersion !== '4' ? null : (distributionFactor === 'MAX' ? 0 : +distributionFactor)
    };

    const minHeight = window.innerHeight - 60 < minHeightValues.schema ? 
      window.innerHeight - 60 : minHeightValues.schema;
    if (!this.uploadId) {
      this.schemaButtonDisabled = true;
      const formData = this.form.getRawValue();
    
      this.initImport(formData)
        .pipe(
          switchMap(uploadId => {
            this.uploadId = uploadId;
            this.fileUploadingSubscription = this.importService.onFileUploadProgress(uploadId).subscribe();
            return this.importService.importChunks(uploadId, formData.file[0]);
          }),
          tap(uploadProgress => this.uploadingFileProgress = Math.ceil(uploadProgress * 100)),
          catchError((e: HttpErrorResponse) => this.catchResponceError(e)),
          takeUntil(this.cancel$),
          filter(progress => +progress === 1),
          switchMap(() => this.importService.getNewStreamSchema(this.uploadId)),
        ).subscribe({ 
          next: schema => {
            this.schema = schema;
            this.schemaButtonDisabled = false;
            this.openSchemaEditor(minHeight);
          },
          error: () => this.schemaButtonDisabled = false
        });
    } else {
      this.openSchemaEditor(minHeight);
    }
  }

  private openSchemaEditor(minHeight: number) {
    this.importStep = 'schema';
    this.minHeight = minHeight; 
    setTimeout(() => this.schemaInvalid$ = this.schemaEditor.hasSchemaError$);
  }

  private initImport(formData) {
    const periodicity = {
      type: formData.periodicity.type,
    };
    
    if (periodicity.type === PeriodicityType.regular) {
      periodicity['value'] = formData.periodicity.value.number;
      periodicity['unit'] = formData.periodicity.value.units;
    }

    const existingStreamKey = this.streamList.find(s => s.name === formData.stream)?.key;
    if (!existingStreamKey) {
      this.nameOfCreatingStream = formData.stream;
    };
    this.stremaKey = existingStreamKey ?? formData.stream;
    const distributionFactor = formData.version !== '4' ? 
      null : formData.distributionFactor === 'MAX' ? 0 : +formData.distributionFactor;
    
    return this.importService.startImport({
      fileName: formData.file[0].name,
      fileSize: formData.file[0].size,
      stream: this.stremaKey,
      version: formData.version,
      distributionFactor,
      periodicity: periodicity,
      description: formData.description,
      fileBySymbol: formData.fileBy === 'symbol',
      symbols: formData.symbols.length ? formData.symbols : null,
      from: formData.setRange ? formData.range.start : null,
      to: formData.setRange ? formData.range.end : null,
      writeMode: formData.writeMode,
     }, this.tbId);
  }

  private catchResponceError(e: HttpErrorResponse) {
    this.messages.push({type: ImportProgressType.error, message: e.error.message});
    this.importError = true;
    return throwError(e);
  }

  checkDataLosses(newStream: boolean = false) {
    if (newStream) {
      this.newStreamCreated = true;
    }
    this.importService.checkDataLosses(this.uploadId, this.stremaKey)
      .pipe(take(1), takeUntil(this.destroy$))
      .subscribe({
        next: schemaIsValid => {
          if (schemaIsValid) {
            this.startImport();
          } else {
            this.showDataLossWarning();
          }
        },
        error: () => {
          if (this.newStreamCreated) {
            this.newStreamCreated = false;
            this.appStore.dispatch(
              new StreamsActions.AskToDeleteStream({ streamKey: this.nameOfCreatingStream, noNotification: true }))
          }
        }
      })
  }

  showDataLossWarning() {
    this.conformationModalOpen = true;
    this.confirmationModal = this.modalService.show(this.dataLossWarning);
  }

  closeConfirmationModal(deleteStream = false) {
    this.conformationModalOpen = false;
    this.confirmationModal?.hide();
    if (this.newStreamCreated && deleteStream) {
      this.newStreamCreated = false;
      this.appStore.dispatch(
        new StreamsActions.AskToDeleteStream({ streamKey: this.nameOfCreatingStream, noNotification: true }))
    }
  }

  startImport() {
    this.uploading = true;
    this.minHeight = minHeightValues.uploading;
    this.closeConfirmationModal();

    this.importService.onUploadProgress(this.uploadId).pipe(
      catchError((e: HttpErrorResponse) => this.catchResponceError(e)),
      takeUntil(this.cancel$),
    ).subscribe(importProgress => this.reportImportProgress([1, importProgress]))
  }


  backToFileInput() {
    this.uploadingFileProgress = 0;
    this.minHeight = minHeightValues.fileInput;
    this.importStep = 'fileInput';
  }

  private finishImportSession() {
    if (this.uploadId) {
      this.fileUploadingSubscription?.unsubscribe();
      this.cancelImport();
      this.uploadId = null;
      this.schema = null;
    }
  }

  private reportImportProgress([fileProgress, importProgress]) {
      this.uploadProgress$.next(fileProgress * 100);
      this.uploadingFile = fileProgress !== 1;
      if (importProgress) {
        if (importProgress.type === ImportProgressType.progress) {
          this.importProgress$.next(parseFloat(importProgress.message) * 100);
        }
        
        if (
          importProgress.type === ImportProgressType.state &&
          importProgress.message === ImportStateMessage.finished
        ) {
          this.importProgress$.next(100);
          this.importFinished = true;
        }
        
        if (
          [
            ImportProgressType.info,
            ImportProgressType.error,
            ImportProgressType.warning,
          ].includes(importProgress.type)
        ) {
          this.messages.push(importProgress);
        }
        
        if (importProgress.type === ImportProgressType.error) {
          this.importError = true;
        }
      }
    }

  distributionFactorChange(value: string) {
    this.form.get('distributionFactor').patchValue(value);
  }

  validateDistributionFactor() {
    return (formGroup: UntypedFormGroup) => {
      if (formGroup.get('version').value === '5') {
        this.validationErrorMessages.distributionFactor = '';
        return null;
      } else {
        if (this.importToExistingStream) {
          this.validationErrorMessages.distributionFactor = '';
          return null;
        } else {
          const value = formGroup.get('distributionFactor').value;
          const distributionFactorIsValid = value === 'MAX' || (value % 1 === 0 && value > 0 && value < 10001);
          this.validationErrorMessages.distributionFactor = distributionFactorIsValid ? 
            '' : "Distribution factor must be an integer between 1 and 10000 or 'MAX'";
          return distributionFactorIsValid ? null : { invalidValue: true };
        }
      }
    }
  }

  originalOrder = (a: KeyValue<number,string>, b: KeyValue<number,string>) => {
    return 0;
  }
}
