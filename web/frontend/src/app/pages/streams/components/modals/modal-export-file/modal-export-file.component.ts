import {Component, OnDestroy, OnInit} from '@angular/core';
import {UntypedFormBuilder, UntypedFormGroup} from '@angular/forms';
import {TranslateService} from '@ngx-translate/core';
import {BsModalRef} from 'ngx-bootstrap/modal';
import {BehaviorSubject, combineLatest, Observable, of, Subject} from 'rxjs';
import {map, publishReplay, refCount, startWith, switchMap, take, takeUntil} from 'rxjs/operators';
import { dateTimeFormats, dateTimeFormatsWithNano } from 'src/app/shared/utils/dateTimeFormats';
import {TreeItem} from '../../../../../shared/components/tree-checkboxes/tree-item';
import {
  ExportFilter,
  ExportFilterFormat,
  ExportTo,
} from '../../../../../shared/models/export-filter';
import {ExportService} from '../../../../../shared/services/export.service';
import {SchemaService} from '../../../../../shared/services/schema.service';
import {StreamsService} from '../../../../../shared/services/streams.service';
import {SymbolsService} from '../../../../../shared/services/symbols.service';
import { KeyValue } from '@angular/common';
import { GlobalFiltersService } from 'src/app/shared/services/global-filters.service';

enum Delimiters {
  tab = 'tab',
  comma = 'comma',
  semicolon = 'semicolon',
  pipe = 'pipe',
}

const delimiterValues = {
  tab: '\\t',
  comma: ',',
  semicolon: ';',
  pipe: '|',
};

@Component({
  selector: 'app-modal-export-file',
  templateUrl: './modal-export-file.component.html',
  styleUrls: ['./modal-export-file.component.scss'],
})
export class ModalExportFileComponent implements OnInit, OnDestroy {
  stream: {id: string; name: string; tbId?: string};
  symbols: string[];
  types: string[];
  exportFormat: ExportFilterFormat;
  form: UntypedFormGroup;
  initialRangeStart: string;
  initialRangeEnd: string;

  symbolsHeader$: Observable<string>;
  fieldsHeader$: Observable<string>;
  configHeader$: Observable<string>;
  tree$: Observable<TreeItem[]>;
  configData: {[index: string]: string[]};

  minDate: Date;
  maxDate: Date;
  autoCompleteProvider = this.getSymbols.bind(this);

  dateTimeFormats = dateTimeFormats;
  timeRangeOptional = { startTimeDisabled: true, endTimeDisabled: true };
  validationErrorMessages = { startTime: '', endTime: '', range: '' };
  timeInvalid = { startTime: false, endTime: false };
  submitButtonDisabled$ = new BehaviorSubject(false);
  importToTextFile: boolean;
  timezoneName: string;

  private destroy$ = new Subject();

  constructor(
    private symbolsService: SymbolsService,
    private schemaService: SchemaService,
    private fb: UntypedFormBuilder,
    private translateService: TranslateService,
    private streamsService: StreamsService,
    private exportService: ExportService,
    private bsRef: BsModalRef,
    private globalFiltersService: GlobalFiltersService
  ) {}

  ngOnInit(): void {
    this.configData = {
      exportTo: Object.values(ExportTo),
    };

    if (this.exportFormat === ExportFilterFormat.CSV) {
      this.configData.delimiters = Object.keys(Delimiters);
    }

    this.importToTextFile = this.exportFormat === ExportFilterFormat.CSV;

    this.tree$ = this.schemaService.getSchema(this.stream.id, null, false, this.stream.tbId).pipe(
      map(({types}) => {
        if (this.exportFormat === ExportFilterFormat.QSMSG) {
          return types.map((type) => ({
            name: type.name,
            id: type.name,
          }));
        }

        return types.map((type) => ({
          name: type.name,
          children: type.fields.map((f) => ({id: `${type.name}:${f.name}`, name: f.name})),
        }));
      }),
      publishReplay(1),
      refCount(),
    );

    this.dateTimeFormats = [...dateTimeFormats, ...dateTimeFormatsWithNano].sort();

    this.form = this.fb.group({
      symbols: this.symbols ? [this.symbols] : null,
      fields: null,
      exportTo: ExportTo.oneFile,
      delimiters: Delimiters.comma,
      range: {start: null, end: null},
      datetimeFormat: this.dateTimeFormats[0],
      exportStaticFields: true,
    });

    this.form.get('range').valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(range => this.validateRange(range))

    const fields$ = this.tree$.pipe(
      map((tree) => {
        const fields: string[] = [];
        tree.forEach((type) => {
          type.children?.forEach((field) => fields.push(field.id));
          if (type.id) {
            fields.push(type.id);
          }
        });
        return fields;
      }),
    );

    this.globalFiltersService
      .getFilters()
      .pipe(takeUntil(this.destroy$))
      .subscribe(globalFilters => this.timezoneName = globalFilters.timezone[0].name);

    combineLatest([fields$, this.streamsService.range(this.stream.id, null, null, null, this.stream.tbId)])
      .pipe(take(1))
      .subscribe(([fields, range]) => {
        this.form.patchValue({
          fields: this.types ? this.types : fields,
          range: {
            start: this.initialRangeStart || new Date(range.start),
            end: this.initialRangeEnd || new Date(range.end),
          },
        });

        this.minDate = new Date(range.start);
        this.maxDate = new Date(range.end);
      });

    this.symbolsHeader$ = this.controlValue('symbols').pipe(
      switchMap((symbols: string[]) =>
        !symbols?.length
          ? this.translateService.get('exportToFile.all')
          : of(symbols.length.toString()),
      ),
      switchMap((summary) => this.translateService.get('exportToFile.headers.symbols', {summary})),
    );

    this.fieldsHeader$ = combineLatest([fields$, this.controlValue('fields')]).pipe(
      map(
        ([fields, selected]: [string[], string[]]) => `${selected?.length || 0}/${fields.length}`,
      ),
      switchMap((summary) => this.translateService.get('exportToFile.headers.types', {summary})),
    );

    this.configHeader$ = this.form.valueChanges.pipe(
      startWith(this.form.value),
      switchMap((formData) => {
        const configKeys = Object.keys(this.configData);
        const keyTranslation = (key) => this.translateService.get(`exportToFile.config.${key}`);
        return combineLatest([
          combineLatest(...configKeys.map(keyTranslation)),
          combineLatest(...configKeys.map((key) => formData[key]).map(keyTranslation)),
        ]);
      }),
      map(([labels, values]) =>
        labels.map((label, index) => `${label}: ${values[index]}`).join('; '),
      ),
      switchMap((summary) => this.translateService.get(`exportToFile.headers.config`, {summary})),
    );
  }

  export() {
    const {range, fields, delimiters, exportTo, symbols, datetimeFormat, exportStaticFields} = this.form.getRawValue();
    const types = {};
    fields.forEach((field) => {
      const [type, fieldName] = field.split(':');
      types[type] = types[type] || {};
      types[type].name = type;
      if (fieldName) {
        types[type].fields = types[type].fields || [];
        types[type].fields.push(fieldName);
      }
    });

    const filter: ExportFilter = {
      from: this.timeRangeOptional.startTimeDisabled ? null : range.start,
      to: this.timeRangeOptional.endTimeDisabled ? null : range.end,
      types: Object.values(types),
      format: this.exportFormat,
      valueSeparator: delimiterValues[delimiters],
      mode: exportTo,
      datetimeFormat,
      enableStaticFields: exportStaticFields
    };

    if (symbols) {
      filter.symbols = symbols;
    }

    this.exportService
      .export(this.stream.id, filter, this.stream.tbId)
      .pipe(switchMap(({id}) => this.exportService.downloadUrl(id)))
      .subscribe((url) => {
        location.href = url;
        this.bsRef.hide();
      });
  }

  private getSymbols(term: string): Observable<string[]> {
    return this.symbolsService.getSymbols(this.stream.id, null, term, this.stream.tbId);
  }

  private controlValue(controlName: string): Observable<unknown> {
    return this.form
      .get(controlName)
      .valueChanges.pipe(startWith(this.form.get(controlName).value));
  }

  public setTimeRangeState(event: { [key: string]: boolean }) {
    this.timeRangeOptional = {
      ...this.timeRangeOptional,
      ...event
    };
    this.validateRange(this.form.get('range').value);
  }

  private validateRange(range: { start: Date, end: Date }) {
    this.validationErrorMessages.startTime = (!range.start || range.start?.toString() === 'Invalid Date') && !this.timeRangeOptional.startTimeDisabled ? 
      'Start Time is invalid' : '';

    this.validationErrorMessages.endTime = (!range.end || range.end?.toString() === 'Invalid Date') && !this.timeRangeOptional.endTimeDisabled ?
      'End Time is invalid' : '';

    const rangeError = range.end?.toString() !== 'Invalid Date' && range.start?.toString() !== 'Invalid Date'
      && !this.timeRangeOptional.startTimeDisabled && !this.timeRangeOptional.endTimeDisabled && range.end < range.start;
    this.validationErrorMessages.range = rangeError ? 'End Time should be greater than Start Time' : '';
    this.timeInvalid = {
      startTime: !!this.validationErrorMessages.startTime || !!this.validationErrorMessages.range,
      endTime: !!this.validationErrorMessages.endTime || !!this.validationErrorMessages.range,
    };
    this.submitButtonDisabled$.next(Object.values(this.validationErrorMessages).some(v => !!v));
  };

  originalOrder = (a: KeyValue<number,string>, b: KeyValue<number,string>) => {
    return 0;
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
