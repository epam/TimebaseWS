import { Component, OnInit, ViewChild, OnDestroy, ElementRef } from '@angular/core';
import { Store } from '@ngrx/store';
import { RxStompState } from '@stomp/rx-stomp';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { BehaviorSubject, Subject, of, combineLatest, merge, throwError } from 'rxjs';
import { takeUntil, switchMap, first, finalize, tap, catchError } from 'rxjs/operators';
import * as NotificationsActions from 'src/app/core/modules/notifications/store/notifications.actions';
import { AppState } from 'src/app/core/store';
import { GlobalFiltersService } from 'src/app/shared/services/global-filters.service';
import { ImportProgress, ImportProgressType, ImportStateMessage } from '../../../models/import-progress';
import { ImportFromTextFileService } from '../../../services/import-from-text-file.service';
import { UploadFileComponent } from '../../csv-import/upload-file/upload-file.component';
import { WriteModeAndTimeRangeComponent } from '../../csv-import/write-mode-and-time-range/write-mode-and-time-range.component';

@Component({
  selector: 'app-modal-import-csv-file',
  templateUrl: './modal-import-csv-file.component.html',
  styleUrls: ['./modal-import-csv-file.component.scss']
})
export class ModalImportCSVFileComponent implements OnInit, OnDestroy {

  importSteps = ['uploading', 'parameters-setting', 'preview', 'time-range', 'import-progress'];

  currentStepIndex: number = 0;
  stream: string;
  progress$ = new BehaviorSubject(0);
  fileUploadingProgress = 0;
  importProgress = 0;
  importFinished = false;
  importError = false;
  messages: ImportProgress[] = [];
  importProgressTypes = ImportProgressType;
  private cancel$ = new Subject();
  private destroy$ = new Subject();
  defaultSizeButtonIsVisible = new BehaviorSubject(false);
  minHeight = 650;
  nextButtonDisabled = false;
  settingsForMapping: { separator: string, charset: string, typeToKeyWord: { [ key: string ]: string } };
  socketDisconnected = false;

  @ViewChild('uploadFile') uploadFile: UploadFileComponent;
  @ViewChild('timeRange') timeRange: WriteModeAndTimeRangeComponent;
  @ViewChild('progressMessages') progressMessages: ElementRef;

  constructor(private bsModalRef: BsModalRef, private importFromTextFileService: ImportFromTextFileService,
    private globalFiltersService: GlobalFiltersService, private appStore: Store<AppState>) {}

  ngOnInit(): void {
    this.importFromTextFileService.noUploadedFiles.next(true);
    this.bsModalRef.onHide
      .pipe(
        first(),
        switchMap(() => this.importFromTextFileService.finishImport()),
        first(),
        finalize(() => this.return())
      ).subscribe();

    this.importFromTextFileService.filesUploadingProgress$
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        this.fileUploadingProgress = value;
        if (!this.importProgress) {
          this.progress$.next(+(+(value / 2).toFixed(2) * 100).toFixed());
        }
      });

    this.importFromTextFileService.initImport()
      .pipe(first()).subscribe(res => {
        this.importFromTextFileService.setSessionId(res[0]);
    })
  }


  invalidMappings() {
    return this.importFromTextFileService.mappingErrors.map(item => item.validateResponse.message);
  }

  validationNotPassed() {
    return this.importFromTextFileService.mappingInvalid;
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.complete();
  }

  closeModal() {
    this.bsModalRef.hide();
  }

  importSettingsAreInvalid() {
    return this.importFromTextFileService.invalidSettings;
  }

  saveChangedSettingsAndMapping() {
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

  nextStep() {
    if (this.importStepIs('uploading')) {
      this.nextButtonDisabled = true;
      if (!this.importFromTextFileService.previewReceived) {
        this.importFromTextFileService.getPreviews()
          .pipe(
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
              this.nextButtonDisabled = false;
              this.currentStepIndex += 1;
            },
            error: () => this.nextButtonDisabled = false
          })
      } else {
        this.nextButtonDisabled = false;
        this.currentStepIndex += 1;
      }
    } else if (this.importStepIs('parameters-setting')) {
      this.nextButtonDisabled = true;

      let mappingValidation$;
      const mappingSettingsChanged = this.importFromTextFileService.settings.charset !== this.settingsForMapping.charset || 
        this.importFromTextFileService.settings.separator !== this.settingsForMapping.separator || 
        this.importFromTextFileService.typeToKeyWordMappingsChanged(
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
    } else if (this.importStepIs('time-range')) {
      this.minHeight = 200;

      if (this.timeRange.inputsAreDisabled.startTime) {
        this.importFromTextFileService.updateSettings('startTime', null);
      }
      if (this.timeRange.inputsAreDisabled.endTime) {
        this.importFromTextFileService.updateSettings('endTime', null);
      }

      this.importFromTextFileService.sendFileSize().pipe(
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
      ).subscribe((importProgress: ImportProgress | RxStompState) => {
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
            this.minHeight = 650;
          }
        } else {
          this.socketDisconnected = true;
        }
      })
      this.currentStepIndex += 1;
    } else {
      this.currentStepIndex += 1;
      this.nextButtonDisabled = true;
      setTimeout(() => this.nextButtonDisabled = false, 1000);
    }
  }

  previousStep() {
    if (this.currentStepIndex !== 0) {
      this.currentStepIndex -= 1;
    }
    if (this.minHeight === 200) {
      this.minHeight = 650;
    }
  }

  scrollToTheLatestMessage() {
    if (this.progressMessages) {
      setTimeout(() => this.progressMessages.nativeElement.scrollTop = this.progressMessages.nativeElement.scrollHeight, 0);
    }
  }

  noUploadedFiles() {
    return this.importFromTextFileService.noUploadedFiles;
  }

  importStepIs(stepName: string) {
    return this.importSteps[this.currentStepIndex] === stepName;
  }

  cancelImport() {
    this.cancel$.next();
    const cancel$ = this.importFromTextFileService.uploadingId ? 
      this.importFromTextFileService.finishImport() : 
      of(null);
    cancel$.pipe(finalize(() => this.return())).subscribe();
  }

  stopImport() {
    this.cancel$.next();
    const cancel$ = this.importFromTextFileService.uploadingId ? 
    this.importFromTextFileService.stopImport() : 
      of(null);

    cancel$.pipe(finalize(() => this.return(false))).subscribe();
  }

  return(eraseSessionId = true) {
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

  getSummary() {
    this.importFromTextFileService.getUploadDetails().subscribe((response: any) => {
      let blob = new Blob([response]);
      var downloadURL = window.URL.createObjectURL(blob);
      var link = document.createElement('a');
      link.href = downloadURL;
      link.download = `Import to ${this.stream} log (${this.importFromTextFileService.sessionId}).zip`;
      link.click();
      link.remove();
    })
  }
}
