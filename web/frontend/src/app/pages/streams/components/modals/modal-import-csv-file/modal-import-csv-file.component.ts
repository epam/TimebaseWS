import { Component, OnInit, ViewChild, OnDestroy, ElementRef } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Store, select } from '@ngrx/store';
import { RxStompState } from '@stomp/rx-stomp';

import { BehaviorSubject, Subject, of, combineLatest, merge, throwError, Observable, Subscription } from 'rxjs';
import { takeUntil, switchMap, first, finalize, tap, catchError,
  map, publishReplay, refCount, debounceTime, filter, skip } from 'rxjs/operators';
import { BsModalRef } from 'ngx-bootstrap/modal';
import * as fromStreams from '../../../store/streams-list/streams.reducer';
import { streamsListStateSelector } from '../../../store/streams-list/streams.selectors';
import { GlobalFiltersService } from 'src/app/shared/services/global-filters.service';
import { ImportFromTextFileService } from '../../../services/import-from-text-file.service';
import { UploadFileComponent } from '../../csv-import/upload-file/upload-file.component';
import { WriteModeAndTimeRangeComponent } from '../../csv-import/write-mode-and-time-range/write-mode-and-time-range.component';
import { ImportProgress, ImportProgressType, ImportStateMessage } from '../../../models/import-progress';
import { SchemaAllTypeModel, SchemaTypeModel } from 'src/app/shared/models/schema.type.model';
import { TextFileImportStepsEnum } from '../../../models/import-steps.enum';
import { StreamModel } from '../../../models/stream.model';
import { AppState } from 'src/app/core/store';
import * as StreamsActions from '../../../store/streams-list/streams.actions';
import { KeyValue } from '@angular/common';

const defaultHeight = 600;

@Component({
  selector: 'app-modal-import-csv-file',
  templateUrl: './modal-import-csv-file.component.html',
  styleUrls: ['./modal-import-csv-file.component.scss']
})
export class ModalImportCSVFileComponent implements OnInit, OnDestroy {

  private importSteps = ['uploading', 'schema', 'parameters-setting', 'preview', 'time-range', 'import-progress'];
  private currentStepIndex: number = 0;
  private fileUploadingProgress = 0;
  private importProgress = 0;
  private cancel$ = new Subject();
  private destroy$ = new Subject();
  private settingsForMapping: { separator: string, charset: string, typeToKeyWord: { [ key: string ]: string } };
  private streamList: StreamModel[];
  private importToExistingStream: boolean;
  private importProcessSubscription: Subscription;
  private newStreamCreated = false;
  private importDataChanged = false;
  private createdStreamSchema: string;

  readonly TextFileImportStepsEnum = TextFileImportStepsEnum;
  readonly importProgressTypes = ImportProgressType;

  public streamInput: string;
  public progress$ = new BehaviorSubject(0);
  public importFinished = false;
  public importError = false;
  public messages: ImportProgress[] = [];
  public defaultSizeButtonIsVisible = new BehaviorSubject(false);
  public minHeight = defaultHeight;
  public nextButtonDisabled = false;
  public socketDisconnected = false;
  public streamNameControl: FormControl;
  public versionControl: FormControl;
  public distributionFactorControl: FormControl;
  public autocomplete$: Observable<string[]>;
  public schemaIsValid$: Observable<boolean>;
  public versionOptions = [ { id: '4', name: '4' }, { id: '5', name: '5' } ];
  public distributionFactorOptions = ['1', 'MAX'];
  public distributionFactorControlDisabled$ = new BehaviorSubject(true);
  public distributionFactorControlInvalid = false;
  public validationErrorMessages = {
    file: '',
    stream: '',
    distributionFactor: ''
  };
  public noUploadedFiles$: Observable<boolean>;
  public noSelectedStream$ = new Subject<boolean>(); 

  @ViewChild('uploadFile') uploadFile: UploadFileComponent;
  @ViewChild('timeRange') timeRange: WriteModeAndTimeRangeComponent;
  @ViewChild('progressMessages') progressMessages: ElementRef;

  constructor(
    private bsModalRef: BsModalRef, 
    private importFromTextFileService: ImportFromTextFileService,
    private globalFiltersService: GlobalFiltersService, 
    private streamsStore: Store<fromStreams.FeatureState>,
    private appStore: Store<AppState>) {}

  ngOnInit(): void {
    this.noUploadedFiles$ = this.importFromTextFileService.noUploadedFiles$.asObservable();
    this.importFromTextFileService.noUploadedFiles$.next(true);
    this.bsModalRef.onHide
      .pipe(
        first(),
        filter(() => !this.importFinished),
        switchMap(() => this.importFromTextFileService.finishImport()),
        first(),
        finalize(() => this.return()),
        takeUntil(this.destroy$)
      ).subscribe();

    this.importFromTextFileService.filesUploadingProgress$
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        this.fileUploadingProgress = value;
        if (!this.importProgress) {
          this.progress$.next(+(+(value / 2).toFixed(2) * 100).toFixed());
        }
      });

    this.streamNameControl = new FormControl(null);
    this.versionControl = new FormControl('5');
    this.distributionFactorControl = new FormControl('MAX');

    this.versionControl.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(version => {
        this.distributionFactorControlDisabled$.next(version === '5');
        this.updateDistributionFactorInvalidMessage();
        this.setImportDataChanged();
    });

    this.distributionFactorControl.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(df => {
        this.distributionFactorControlInvalid = !(df === 'MAX' || (df % 1 === 0 && df > 0 && df < 10001));
        this.updateDistributionFactorInvalidMessage();
        this.setImportDataChanged();
      });

    this.autocomplete$ = this.streamsStore.pipe(select(streamsListStateSelector)).pipe(
      map((state) => {
        if (!state.streams) {
          return [];
        }
        this.streamList = state.streams;

        return state.streams.map((stream) => stream.name);
      }),
      publishReplay(1),
      refCount(),
    );

    this.noSelectedStream$.next(!this.streamInput && !this.streamNameControl.value);

    this.noUploadedFiles$.pipe(skip(1), takeUntil(this.destroy$))
      .subscribe(noUploadedFiles => this.validationErrorMessages.file = noUploadedFiles ? 'Importing file is required' : '');

    this.noSelectedStream$.pipe(skip(1), takeUntil(this.destroy$))
      .subscribe(noSelectedStream => this.validationErrorMessages.stream = noSelectedStream ? 'Stream is required' : '');

    this.streamNameControl.valueChanges.pipe(debounceTime(300)).pipe(
      tap(streamName => this.noSelectedStream$.next(!this.streamInput && !streamName)),
      map((streamName: string) => {
        return this.streamList.find(stream => stream.name === streamName)?.key ?? null
      }),
      publishReplay(1),
      refCount(),
      filter(() => this.importStepIs(TextFileImportStepsEnum.uploading)),
      takeUntil(this.destroy$)
    ).subscribe(stream => {
      this.importToExistingStream = !!stream;
      this.updateDistributionFactorInvalidMessage();
      this.importFromTextFileService.previewReceived = false;
      this.importFromTextFileService.createdStreamSchema = null;
      this.setImportDataChanged();
    });

    this.schemaIsValid$ = this.importFromTextFileService.schemaIsValidAsObservable();
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.complete();
  }

  public invalidMappings() {
    return this.importFromTextFileService.mappingErrors.map(item => item.validateResponse.message);
  }

  public closeModal() {
    this.bsModalRef.hide();
  }

  public importSettingsAreInvalid() {
    return this.importFromTextFileService.invalidSettings;
  }

  private saveChangedSettingsAndMapping() {
    const streamId = this.importFromTextFileService.streamId;
    const editedSettings = this.importFromTextFileService.editedSettings;
    const editedSettingsKeys = Object.keys(editedSettings ?? {});

    const changedMappingItems = [];
    const currentMapping = this.importFromTextFileService.currentMappings;
    const originalMapping = this.importFromTextFileService.originalMapping;
    for (let i = 0; i < currentMapping.length; i++) {
      if (currentMapping[i].column !== originalMapping[i].column) {
        changedMappingItems.push(currentMapping[i]);
      }
    }

    if (editedSettingsKeys.length || changedMappingItems.length) {
      localStorage.setItem(`settings-${streamId}`, JSON.stringify(editedSettings));
      localStorage.setItem(`mapping-${this.importFromTextFileService.streamId}`, JSON.stringify(changedMappingItems));
    }
  }

  public nextStep() {
    if (this.importStepIs(TextFileImportStepsEnum.uploading)) {
      if (this.importToExistingStream) {
        this.importFromTextFileService.setStreamId(this.getStreamKey(this.streamNameControl.value));
      }
      this.nextButtonDisabled = true;
      if (this.streamInput || this.importToExistingStream) {
        if (!this.importFromTextFileService.previewReceived) {

          if (this.importFromTextFileService.sessionId) {
            this.importFromTextFileService.finishImport().pipe(first(), takeUntil(this.destroy$)).subscribe();
          }

          this.importFromTextFileService.initImport().pipe(
            tap(res => this.importFromTextFileService.setSessionId(res[0])),
            switchMap(() => this.importFromTextFileService.getPreviews()),
            switchMap(() => this.globalFiltersService.getFilters()),
            switchMap(filters => {
              this.importFromTextFileService.updateSettings('timeZone', filters.timezone[0].name);
              return combineLatest([
                this.importFromTextFileService.getSettings(),
                this.importFromTextFileService.getAllFileHeaders()
              ])
            }),
            first(), 
            takeUntil(this.destroy$),
            catchError(err => throwError(err))
          )
          .subscribe({
            next: ([res, allHeaders]: any)  => {
              this.applySettingsAndMapping([res, allHeaders]);
              this.nextButtonDisabled = false;
              this.currentStepIndex += 2;
            },
            error: () => this.nextButtonDisabled = false
          })
        } else {
          this.nextButtonDisabled = false;
          this.currentStepIndex += 2;
        }
      } else {
        if (!this.importFromTextFileService.createdStreamSchema) {

          if (this.importFromTextFileService.sessionId) {
            this.importFromTextFileService.finishImport().pipe(first(), takeUntil(this.destroy$)).subscribe();
          }
          
          this.importFromTextFileService.initImport(this.getStreamKey(this.streamNameControl.value)).pipe(
            tap(res => {
              this.importFromTextFileService.setSessionId(res[0]);
              if (!this.importProcessSubscription) {
                this.importProcessSubscription = this.importFromTextFileService.onImportProgress()
                  .pipe(takeUntil(this.destroy$)).subscribe();
              }
            }),
            switchMap(() => this.importFromTextFileService.sendFileSize()),
            switchMap((uploadId: string) => {
              this.importFromTextFileService.uploadingId = uploadId;
              return this.importFromTextFileService.uploadAllFiles()
            }),
            switchMap(() => {
              this.nextButtonDisabled = false;
              return this.importFromTextFileService.getNewStreamSchema();
            }),
            takeUntil(this.destroy$)
          ).subscribe({
            next: (response: { types: SchemaTypeModel[], all: SchemaAllTypeModel[] }) => {
              this.importFromTextFileService.createdStreamSchema = response;
              this.nextButtonDisabled = false;
              this.currentStepIndex += 1;
            },
            error: () => this.nextButtonDisabled = false
          })
        } else {
          this.nextButtonDisabled = false;
          this.currentStepIndex += 1;
        }
      }
    } else if (this.importStepIs(TextFileImportStepsEnum.schema)) {
      this.nextButtonDisabled = true;
      const distributionFactorValue = this.distributionFactorControl.value;
      const distributionFactor = this.versionControl.value === '4' && !this.importToExistingStream ? 
        (distributionFactorValue === 'MAX' ? 0 : +distributionFactorValue) : null;

      if (this.newStreamCreated && !this.importDataChanged && 
        this.createdStreamSchema === JSON.stringify(this.importFromTextFileService.createdStreamSchema)) {
        this.nextButtonDisabled = false;
        this.currentStepIndex += 1;
      } else {
        let nameCollisionFixed$ = of(null);
        if (this.newStreamCreated) {
          this.newStreamCreated = false;
          nameCollisionFixed$ = this.importFromTextFileService.deleteStream(this.importFromTextFileService.streamId);
        }

        nameCollisionFixed$.pipe(
          switchMap(() => this.importFromTextFileService.createStream(this.streamNameControl.value, this.versionControl.value, distributionFactor)),
          tap(() => {
            this.newStreamCreated = true;
            this.importDataChanged = false;
            this.createdStreamSchema = JSON.stringify(this.importFromTextFileService.createdStreamSchema);
            this.importFromTextFileService.setStreamId(this.getStreamKey(this.streamNameControl.value))
          }),
          switchMap(() => this.importFromTextFileService.getPreviews()),
          switchMap(() => this.globalFiltersService.getFilters()),
          switchMap(filters => {
              this.importFromTextFileService.updateSettings('timeZone', filters.timezone[0].name);
              return combineLatest([
                this.importFromTextFileService.getSettings(),
                this.importFromTextFileService.getAllFileHeaders()
              ])
            }),
            first(),
            takeUntil(this.destroy$),
            catchError(err => throwError(err))
          )
          .subscribe({
            next: ([res, allHeaders]: any) => {
              this.applySettingsAndMapping([res, allHeaders]);
              this.nextButtonDisabled = false;
              this.currentStepIndex += 1;
            },
            error: () => this.nextButtonDisabled = false
          })
      }
    } else if (this.importStepIs(TextFileImportStepsEnum.parametersSetting)) {
      this.nextButtonDisabled = true;

      let mappingValidation$;
      const mappingSettingsChanged = this.importFromTextFileService.settings.charset !== this.settingsForMapping.charset || 
        this.importFromTextFileService.settings.separator !== this.settingsForMapping.separator || 
        this.importFromTextFileService.isTypeToKeyWordMappingsChanged(
          this.settingsForMapping.typeToKeyWord, 
          this.importFromTextFileService.settings.typeToKeywordMapping, true);

      if (mappingSettingsChanged) {
        mappingValidation$ = this.importFromTextFileService.getNewMapping()
          .pipe(
            tap((mappings: any[]) => {
              this.importFromTextFileService.currentMappings = mappings;

              this.settingsForMapping = {
                separator: this.importFromTextFileService.settings.separator,
                charset: this.importFromTextFileService.settings.charset,
                typeToKeyWord: this.importFromTextFileService.settings.typeToKeywordMapping
              }
            }),
            switchMap(() => this.importFromTextFileService.validateMappingGeneral())
          )
      } else {
        mappingValidation$ = this.importFromTextFileService.validateMappingGeneral();
      }
      mappingValidation$
        .pipe(first(), takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.currentStepIndex += 1;
            setTimeout(() => this.nextButtonDisabled = false, 1000);
          },
          error: () => this.nextButtonDisabled = false
        });
    } else if (this.importStepIs(TextFileImportStepsEnum.timeRange)) {
      this.minHeight = 200;

      if (this.timeRange.inputsAreDisabled.startTime) {
        this.importFromTextFileService.updateSettings('startTime', null);
      }
      if (this.timeRange.inputsAreDisabled.endTime) {
        this.importFromTextFileService.updateSettings('endTime', null);
      }

      if (!this.importToExistingStream && !this.streamInput) {
        this.importFromTextFileService.setSettings().pipe(
          switchMap((uploadId: string) => {
            this.importFromTextFileService.uploadingId = uploadId;
            return merge(
              this.importFromTextFileService.onUploadProgress(),
              this.importFromTextFileService.onSocketClosed()
            );
          }),
          takeUntil(this.cancel$),
          takeUntil(this.destroy$),
        ).subscribe((importProgress: ImportProgress | RxStompState) => this.displayImportProgress(importProgress))
      } else {
        this.importFromTextFileService.sendFileSize().pipe(
          switchMap(() => this.importFromTextFileService.setSettings()),
          switchMap((uploadId: string) => {
            this.importFromTextFileService.uploadingId = uploadId;
            return this.importFromTextFileService.uploadAllFiles();
          }),
          switchMap(() => {
            return merge(
              this.importFromTextFileService.onUploadProgress(), this.importFromTextFileService.onSocketClosed()
            );
          }),
          takeUntil(this.cancel$),
          takeUntil(this.destroy$),
        ).subscribe((importProgress: ImportProgress | RxStompState) => this.displayImportProgress(importProgress));
      }

      this.currentStepIndex += 1;
    } else {
      this.currentStepIndex += 1;
      this.nextButtonDisabled = true;
      setTimeout(() => this.nextButtonDisabled = false, 1000);
    }
  }

  public previousStep() {
    if (this.currentStepIndex !== 0) {
      if (this.importStepIs(TextFileImportStepsEnum.parametersSetting) && (this.streamInput || this.importToExistingStream)) {
        this.currentStepIndex -= 2;
      } else {
        this.currentStepIndex -= 1;
      }
    }
    if (this.minHeight === 200) {
      this.minHeight = defaultHeight;
    }
  }

  updateDistributionFactorInvalidMessage() {
    this.validationErrorMessages.distributionFactor = this.distributionFactorControlInvalid 
      && this.versionControl.value === '4' && !this.importToExistingStream ? 
      "Distribution factor must be an integer between 1 and 10000 or 'MAX'" : '';
  }

  private scrollToTheLatestMessage() {
    if (this.progressMessages) {
      setTimeout(() => this.progressMessages.nativeElement.scrollTop = this.progressMessages.nativeElement.scrollHeight, 0);
    }
  }

  public get currentStreamId() {
    return this.importStepIs(TextFileImportStepsEnum.uploading) ? null : 
      this.importFromTextFileService.streamId;
  }

  public importStepIs(stepName: string) {
    return this.importSteps[this.currentStepIndex] === stepName;
  }

  public cancelImport() {
    this.cancel$.next();
    const cancel$ = this.importFromTextFileService.uploadingId ? 
      this.importFromTextFileService.finishImport() : 
      of(null);
    cancel$.pipe(finalize(() => this.return())).subscribe();
  }

  public stopImport() {
    this.cancel$.next();
    const cancel$ = this.importFromTextFileService.uploadingId ? 
    this.importFromTextFileService.stopImport() : 
      of(null);

    cancel$.pipe(finalize(() => this.return(false))).subscribe();
  }

  public return(eraseSessionId = true) {
    if (this.newStreamCreated && (!this.importFinished || this.importError)) {
      this.newStreamCreated = false;
      this.appStore.dispatch(
        new StreamsActions.AskToDeleteStream({ streamKey: this.importFromTextFileService.streamId, noNotification: true }))
    }

    this.progress$.next(0);
    this.importFinished = false;
    this.importError = false;
    this.messages = [];
    this.socketDisconnected = false;

    if (eraseSessionId) {
      this.importFromTextFileService.endSession();
      this.closeModal();
    } else {
      this.importFromTextFileService.endSession(false);
      this.previousStep();
    }
  }

  public getSummary() {
    this.importFromTextFileService.getUploadDetails()
      .pipe(takeUntil(this.destroy$))
      .subscribe((response: any) => {
        let blob = new Blob([response]);
        var downloadURL = window.URL.createObjectURL(blob);
        var link = document.createElement('a');
        link.href = downloadURL;
        link.download = `Import to ${this.streamInput ?? this.streamNameControl.value} log (${this.importFromTextFileService.sessionId}).zip`;
        link.click();
        link.remove();
      })
  }

  public onStreamChange(search: string) {
    this.streamNameControl.patchValue(search);
  }

  private applySettingsAndMapping([res, allHeaders]) {
      this.importFromTextFileService.originalMapping = [...res.mappings];

      if (this.importFromTextFileService.changedMappingFields.size) {
        const changedMappingItems = this.importFromTextFileService.currentMappings
          .filter(item => {
            return this.importFromTextFileService.changedMappingFields.has(item.field.name) &&
              (!item.column || allHeaders.includes(item.column))
          });

        this.importFromTextFileService.currentMappings = res.mappings.map(item => {
          const changed = changedMappingItems.find(mapping => mapping.field.name === item.field.name);
          return changed ?? item;
        })
      } else {
        this.importFromTextFileService.currentMappings = res.mappings;
      }

      const savedMapping = localStorage.getItem(`mapping-${this.importFromTextFileService.streamId}`);
      if (savedMapping) {
        const filteredSavedMapping = JSON.parse(savedMapping)
          .filter(item => {
            return (allHeaders.includes(item.column) || !item.column) && (!item.field.messageType ||
              this.importFromTextFileService.streamSchema.map(field => field.name).includes(item.field.name))
          })

        filteredSavedMapping.forEach(item => {
          const fieldIndex = this.importFromTextFileService.currentMappings
            .findIndex(mappingItem => mappingItem.field.name === item.field.name);

          this.importFromTextFileService.currentMappings[fieldIndex] = {
            ...this.importFromTextFileService.currentMappings[fieldIndex],
            column: item.column
          }
          this.importFromTextFileService.changedMappingFields.add(item.field.name);
        })
      }

      if (!this.importFromTextFileService.settingsReceived) {
        this.importFromTextFileService.instrumentTypes = res.generalSettings.instrumentType;

        this.importFromTextFileService.defaultSettings = {
          ...res.generalSettings,
          timeZone: this.importFromTextFileService.settings.timeZone,
          strategy: res.generalSettings.strategy ?? 'SKIP',
          symbols: null,
          instrumentType: [ this.importFromTextFileService.instrumentTypes[0] ]
        }

        const savedSettings = localStorage.getItem(`settings-${this.importFromTextFileService.streamId}`);

        this.importFromTextFileService.editedSettings = JSON.parse(savedSettings);

        this.importFromTextFileService.settings = {
          ...this.importFromTextFileService.defaultSettings,
          ...this.importFromTextFileService.editedSettings,
        }

        this.importFromTextFileService.defaultTypeToKeywordMapping = res.generalSettings.typeToKeywordMapping;
        this.importFromTextFileService.allSymbols = res.generalSettings.symbols;

        const keywordField = this.importFromTextFileService.currentMappings.find(item => item.column && item.field.name === 'keyword');
        if (!keywordField?.column) {
          this.importFromTextFileService.updateSettings('strategy', 'SKIP');
        }
        this.importFromTextFileService.updateSettings('defaultMessageType',
          Object.keys(res.generalSettings.typeToKeywordMapping)[0]);

        const defaultType = Object.entries(this.importFromTextFileService.settings.typeToKeywordMapping)[0];

        this.settingsForMapping = {
          separator: this.importFromTextFileService.settings.separator,
          charset: this.importFromTextFileService.settings.charset,
          typeToKeyWord: this.importFromTextFileService.keywordColumnMapped ?
            this.importFromTextFileService.settings.typeToKeywordMapping :
            { [defaultType[0]]: defaultType[1] }
        }
      }
      this.importFromTextFileService.previewReceived = true;
      this.importFromTextFileService.settingsReceived = true;
  }

  private displayImportProgress(importProgress: ImportProgress | RxStompState) {
    if (typeof importProgress === 'object') {
      if (importProgress.type === ImportProgressType.progress) {
        this.importProgress = +(parseFloat(importProgress.message)).toFixed(2);
        const progress = +(((this.importProgress + this.fileUploadingProgress) / 2) * 100).toFixed();
        this.progress$.next(progress);
      }
      if (
        importProgress.type === ImportProgressType.state &&
        importProgress.message === ImportStateMessage.finished
      ) {
        this.progress$.next(100);
        this.importFinished = true;
        this.saveChangedSettingsAndMapping();
      }

      if (
        [
          ImportProgressType.info,
          ImportProgressType.error,
          ImportProgressType.warning,
        ].includes(importProgress.type)
      ) {
        this.messages.push(importProgress);
        this.scrollToTheLatestMessage();
      }

      if (importProgress.type === ImportProgressType.error) {
        this.importError = true;
        this.messages.push(importProgress);
        this.scrollToTheLatestMessage();
      }

      if (this.messages.length) {
        this.minHeight = defaultHeight;
      }
    } else {
      this.socketDisconnected = true;
    }
  }

  private getStreamKey(streamName: string) {
    return this.streamList.find(stream => stream.name === streamName)?.key ?? streamName;
  }

  toggleNextButtonState(timeRangeIsValid: boolean) {
    this.nextButtonDisabled = !timeRangeIsValid;
  }

  distributionFactorChange(value: string) {
    this.distributionFactorControl.patchValue(value);
  }

  originalOrder = (a: KeyValue<number,string>, b: KeyValue<number,string>) => {
    return 0;
  }

  fileListChanged() {
    this.setImportDataChanged();
  }

  private setImportDataChanged() {
    if (this.newStreamCreated) {
      this.importDataChanged = true;
    }
  }
}
