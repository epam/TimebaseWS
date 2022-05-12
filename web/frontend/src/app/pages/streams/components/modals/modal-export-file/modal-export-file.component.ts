import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup} from '@angular/forms';
import {TranslateService} from '@ngx-translate/core';
import {BsModalRef} from 'ngx-bootstrap/modal';
import {combineLatest, Observable, of} from 'rxjs';
import {map, publishReplay, refCount, startWith, switchMap, take} from 'rxjs/operators';
import {TreeItem} from '../../../../../shared/components/tree-checkboxes/tree-item';
import {
  ExportFilter,
  ExportFilterFormat,
  ExportTo,
} from '../../../../../shared/models/export-filter';
import {MenuItem} from '../../../../../shared/models/menu-item';
import {ExportService} from '../../../../../shared/services/export.service';
import {SchemaService} from '../../../../../shared/services/schema.service';
import {StreamsService} from '../../../../../shared/services/streams.service';
import {SymbolsService} from '../../../../../shared/services/symbols.service';

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
export class ModalExportFileComponent implements OnInit {
  stream: MenuItem;
  exportFormat: ExportFilterFormat;
  form: FormGroup;

  symbolsHeader$: Observable<string>;
  fieldsHeader$: Observable<string>;
  configHeader$: Observable<string>;
  tree$: Observable<TreeItem[]>;
  configData: {[index: string]: string[]};

  minDate: Date;
  maxDate: Date;
  autoCompleteProvider = this.getSymbols.bind(this);

  constructor(
    private symbolsService: SymbolsService,
    private schemaService: SchemaService,
    private fb: FormBuilder,
    private translateService: TranslateService,
    private streamsService: StreamsService,
    private exportService: ExportService,
    private bsRef: BsModalRef,
  ) {}

  ngOnInit(): void {
    this.configData = {
      exportTo: Object.values(ExportTo),
    };

    if (this.exportFormat === ExportFilterFormat.CSV) {
      this.configData.delimiters = Object.keys(Delimiters);
    }

    this.tree$ = this.schemaService.getSchema(this.stream.id).pipe(
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

    this.form = this.fb.group({
      symbols: null,
      fields: null,
      exportTo: ExportTo.oneFile,
      delimiters: Delimiters.comma,
      range: {start: null, end: null},
    });

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

    combineLatest([fields$, this.streamsService.range(this.stream.id)])
      .pipe(take(1))
      .subscribe(([fields, range]) => {
        this.form.patchValue({
          fields,
          range: {start: new Date(range.start), end: new Date(range.end)},
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
    const {range, fields, delimiters, exportTo, symbols} = this.form.getRawValue();
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
      from: range.start.toISOString(),
      to: range.end.toISOString(),
      types: Object.values(types),
      format: this.exportFormat,
      valueSeparator: delimiterValues[delimiters],
      mode: exportTo,
    };

    if (symbols) {
      filter.symbols = symbols;
    }

    this.exportService
      .export(this.stream.id, filter)
      .pipe(switchMap(({id}) => this.exportService.downloadUrl(id)))
      .subscribe((url) => {
        location.href = url;
        this.bsRef.hide();
      });
  }

  private getSymbols(term: string): Observable<string[]> {
    return this.symbolsService.getSymbols(this.stream.id, null, term);
  }

  private controlValue(controlName: string): Observable<unknown> {
    return this.form
      .get(controlName)
      .valueChanges.pipe(startWith(this.form.get(controlName).value));
  }
}
