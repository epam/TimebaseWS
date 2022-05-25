import {HttpErrorResponse} from '@angular/common/http';
import {Component, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {HdDate} from '@assets/hd-date/hd-date';
import {select, Store} from '@ngrx/store';
import {TranslateService} from '@ngx-translate/core';
import {BsModalRef} from 'ngx-bootstrap/modal';
import {
  BehaviorSubject,
  combineLatest,
  interval,
  Observable,
  of,
  ReplaySubject,
  Subject,
  throwError,
} from 'rxjs';
import {
  catchError,
  distinctUntilChanged,
  filter,
  finalize,
  map,
  pairwise,
  startWith,
  switchMap,
  take,
  takeUntil,
} from 'rxjs/operators';
import {dateToTimezone} from '../../../../../shared/locale.timezone';
import {GlobalFiltersService} from '../../../../../shared/services/global-filters.service';
import {ImportService} from '../../../../../shared/services/import.service';
import {toUtc} from '../../../../../shared/utils/hdDateUtils';
import {
  dateToUTC,
  getTimeZones,
  getTimeZoneTitle,
  nullTimezone,
} from '../../../../../shared/utils/timezone.utils';
import {GlobalFilterTimeZone} from '../../../models/global.filter.model';
import {
  ImportProgress,
  ImportProgressType,
  ImportStateMessage,
} from '../../../models/import-progress';
import {PeriodicityType} from '../../../models/periodicity-type';
import * as fromStreams from '../../../store/streams-list/streams.reducer';
import {streamsListStateSelector} from '../../../store/streams-list/streams.selectors';

@Component({
  selector: 'app-modal-import-file',
  templateUrl: './modal-import-file.component.html',
  styleUrls: ['./modal-import-file.component.scss'],
})
export class ModalImportFileComponent implements OnInit, OnDestroy {
  form: FormGroup;
  autocomplete$: Observable<string[]>;

  uploading = false;
  uploadingFile = false;
  importFinished = false;
  importError = false;
  progress$: Observable<number>;
  messages: ImportProgress[] = [];
  importProgressTypes = ImportProgressType;
  periodicityTypes$: Observable<{id: string; title: string}[]>;
  timezones: GlobalFilterTimeZone[];
  periodicityTypes = PeriodicityType;
  nullTimezone = nullTimezone;

  private uploadProgress$ = new BehaviorSubject(0);
  private importProgress$ = new BehaviorSubject(0);
  private uploadId: number;
  private cancel$ = new Subject();
  private destroy$ = new ReplaySubject(1);

  constructor(
    private fb: FormBuilder,
    private streamsStore: Store<fromStreams.FeatureState>,
    private importService: ImportService,
    private bsModalRef: BsModalRef,
    private translateService: TranslateService,
    private globalFiltersService: GlobalFiltersService,
  ) {}

  ngOnInit(): void {
    this.progress$ = combineLatest([this.uploadProgress$, this.importProgress$]).pipe(
      map(([uploadProgress, importProgress]) => Math.floor((uploadProgress + importProgress) / 2)),
    );

    this.periodicityTypes$ = this.translateService.get('importFromFile.periodicityTypes').pipe(
      map((translations) => {
        return [
          {id: PeriodicityType.regular, title: translations.regular},
          {id: PeriodicityType.irregular, title: translations.irregular},
          {id: PeriodicityType.static, title: translations.static},
        ];
      }),
    );

    this.timezones = getTimeZones().map((timezone) => ({
      ...timezone,
      nameTitle: getTimeZoneTitle(timezone),
    }));

    const validateRange = (fg: FormGroup) => {
      if (!fg.get('setRange').value) {
        return null;
      }

      const range = fg.get('range').value;

      return range.start || range.end ? null : {needRange: true};
    };

    this.form = this.fb.group(
      {
        file: [null, Validators.required],
        stream: ['', Validators.required],
        description: '',
        symbols: [[]],
        setRange: false,
        periodicity: this.fb.group(
          {
            type: [[PeriodicityType.irregular]],
            value: null,
          },
          {
            validators: (group: FormGroup) => {
              if (group.get('type').value[0].id !== PeriodicityType.regular) {
                return null;
              }

              return group.get('value').value?.aggregation ? null : {required: true};
            },
          },
        ),
        timezone: [[]],
        range: {start: null, end: null},
      },
      {validators: [validateRange]},
    );

    this.globalFiltersService
      .getFilters()
      .pipe(take(1))
      .subscribe((filters) =>
        this.form.get('timezone').patchValue(
          filters.timezone.map((timezone) => ({
            ...timezone,
            nameTitle: getTimeZoneTitle(timezone),
          })),
        ),
      );

    const stream = this.form.get('stream');
    this.autocomplete$ = combineLatest([
      this.streamsStore.pipe(select(streamsListStateSelector)),
      stream.valueChanges.pipe(startWith(stream.value)),
    ]).pipe(
      map(([state, search]) => {
        if (!state.streams) {
          return [];
        }

        return state.streams
          ?.map((stream) => stream.name)
          .filter((stream) => stream.toLowerCase().includes(search?.toLowerCase()));
      }),
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
  }

  onStreamChange(search: string) {
    this.form.get('stream').patchValue(search);
  }

  import() {
    const formData = this.form.getRawValue();
    this.uploading = true;
    this.uploadingFile = true;

    const periodicity = {
      type: formData.periodicity.type[0].id,
    };

    if (periodicity.type === PeriodicityType.regular) {
      periodicity['value'] = formData.periodicity.value.number;
      periodicity['unit'] = formData.periodicity.value.units;
    }

    this.importService
      .startImport({
        fileName: formData.file[0].name,
        fileSize: formData.file[0].size,
        stream: formData.stream,
        periodicity: periodicity,
        description: formData.description,
        symbols: formData.symbols.length ? formData.symbols : null,
        from: formData.setRange ? this.toUtcDate(formData.range.start) : null,
        to: formData.setRange ? this.toUtcDate(formData.range.end) : null,
      })
      .pipe(
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
      });
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
  }

  private toUtcDate(date: Date): string {
    if (!date) {
      return null;
    }

    return toUtc(
      new HdDate(dateToUTC(date, this.form.get('timezone').value[0]?.name).toISOString()),
    )?.toISOString();
  }
}
