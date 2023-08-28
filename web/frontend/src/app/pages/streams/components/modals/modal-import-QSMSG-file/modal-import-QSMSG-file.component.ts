import { HttpErrorResponse }                                             from '@angular/common/http';
import { Component, OnDestroy, OnInit }                                  from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { HdDate }                                                        from '@assets/hd-date/hd-date';
import { select, Store }                                                 from '@ngrx/store';
import { TranslateService }                                              from '@ngx-translate/core';
import { BsModalRef }                                                    from 'ngx-bootstrap/modal';
import {
  BehaviorSubject,
  combineLatest,
  Observable,
  of,
  ReplaySubject,
  Subject,
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
import { toUtc }                from '../../../../../shared/utils/hdDateUtils';
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

@Component({
  selector: 'app-modal-import-QSMSG-file',
  templateUrl: './modal-import-QSMSG-file.component.html',
  styleUrls: ['./modal-import-QSMSG-file.component.scss'],
})
export class ModalImportQSMSGFileComponent implements OnInit, OnDestroy {
  form: UntypedFormGroup;
  autocomplete$: Observable<string[]>;
  
  uploading = false;
  uploadingFile = false;
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
  stream: string;
  existingStream$: Observable<string>;
  streamsKeys: string[];
  
  private uploadProgress$ = new BehaviorSubject(0);
  private importProgress$ = new BehaviorSubject(0);
  private uploadId: number;
  private cancel$ = new Subject();
  private destroy$ = new ReplaySubject(1);
  
  constructor(
    private fb: UntypedFormBuilder,
    private streamsStore: Store<fromStreams.FeatureState>,
    private importService: ImportService,
    private bsModalRef: BsModalRef,
    private translateService: TranslateService,
    private globalFiltersService: GlobalFiltersService,
    private streamsService: StreamsService,
  ) {}
  
  ngOnInit(): void {
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
      
      const range = fg.get('range').value;
      
      return range.start || range.end ? null : {needRange: true};
    };
    
    this.form = this.fb.group(
      {
        file: [null, Validators.required],
        fileBy: 'space',
        stream: [this.stream || '', Validators.required],
        writeMode: WriteMode.append,
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
              if (group.get('type').value[0].id !== PeriodicityType.regular) {
                return null;
              }
              
              return group.get('value').value?.aggregation ? null : {required: true};
            },
          },
        ),
        timezone: null,
        range: {start: null, end: null},
      },
      {validators: [validateRange]},
    );
    
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
    
    this.autocomplete$ = this.streamsStore.pipe(select(streamsListStateSelector)).pipe(
      map((state) => {
        if (!state.streams) {
          return [];
        }
        this.streamsKeys = state.streams.map(stream => stream.key);
        
        return state.streams.map((stream) => stream.name);
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
        return streams.includes(stream) || this.streamsKeys.includes(stream) ? stream : null
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
      map(props => props?.props?.description),
      distinctUntilChanged(),
      takeUntil(this.destroy$),
    ).subscribe(description => this.form.get('description').patchValue(description));

    this.bsModalRef.onHide
      .pipe(first(), takeUntil(this.destroy$))
      .subscribe(() => this.cancelImport());
  }
  
  onStreamChange(search: string) {
    this.form.get('stream').patchValue(search);
  }
  
  import() {
    const formData = this.form.getRawValue();
    this.uploading = true;
    this.uploadingFile = true;
    
    const periodicity = {
      type: formData.periodicity.type,
    };
    
    if (periodicity.type === PeriodicityType.regular) {
      periodicity['value'] = formData.periodicity.value.number;
      periodicity['unit'] = formData.periodicity.value.units;
    }
    
    this.existingStream$.pipe(
        take(1),
        switchMap(showWriteMode => {
          return this.importService
            .startImport({
              fileName: formData.file[0].name,
              fileSize: formData.file[0].size,
              stream: formData.stream,
              periodicity: periodicity,
              description: formData.description,
              fileBySymbol: formData.fileBy === 'symbol',
              symbols: formData.symbols.length ? formData.symbols : null,
              from: formData.setRange ? this.toUtcDate(formData.range.start) : null,
              to: formData.setRange ? this.toUtcDate(formData.range.end) : null,
              writeMode: showWriteMode ? formData.writeMode : null,
            });
        }),
        switchMap((uploadId) => {
          this.uploadId = uploadId;
          return combineLatest([
            this.importService.importChunks(uploadId, formData.file[0]),
            this.importService.onUploadProgress(uploadId).pipe(startWith(null)),
          ]);
        }),
        catchError((e: HttpErrorResponse) => {
          this.messages.unshift({type: ImportProgressType.error, message: e.error.message});
          this.importError = true;
          return throwError(e);
        }),
        takeUntil(this.cancel$),
      )
      .subscribe(([fileProgress, importProgress]) => {
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
            this.messages.unshift(importProgress);
          }
          
          if (importProgress.type === ImportProgressType.error) {
            this.importError = true;
          }
        }
      }
    );
  }
  
  cancelImport() {
    this.cancel$.next();
    const cancel$ = this.uploadId ? this.importService.cancelImport(this.uploadId) : of(null);
    cancel$.pipe(finalize(() => this.return())).subscribe();
  }
  
  finish() {
    this.bsModalRef.hide();
  }
  
  return() {
    this.uploadProgress$.next(0);
    this.importProgress$.next(0);
    this.uploadId = null;
    this.uploading = false;
    this.uploadingFile = false;
    this.importFinished = false;
    this.importError = false;
    this.messages = [];
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.cancelImport();
  }
  
  private toUtcDate(date: Date): string {
    if (!date) {
      return null;
    }
    
    return toUtc(
      new HdDate(dateToUTC(date, this.form.get('timezone').value).toISOString()),
    )?.toISOString();
  }
}
