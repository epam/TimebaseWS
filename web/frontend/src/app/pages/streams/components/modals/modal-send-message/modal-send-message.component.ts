import {AfterViewInit, Component, ElementRef, HostListener, OnDestroy, OnInit} from '@angular/core';
import {FormControl, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators} from '@angular/forms';
import {Store} from '@ngrx/store';
import {TranslateService} from '@ngx-translate/core';
import {BsModalRef} from 'ngx-bootstrap/modal';
import {BehaviorSubject, combineLatest, Observable, of, Subject} from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  map,
  shareReplay,
  switchMap,
  take,
  takeUntil,
  tap,
  startWith,
  withLatestFrom, catchError,
}                                            from 'rxjs/operators';
import {AppState}                            from '../../../../../core/store';
import { WriteMode }                         from '../../../../../shared/components/write-modes-control/write-mode';
import {formatHDate}                         from '../../../../../shared/locale.timezone';
import {MenuItem}                            from '../../../../../shared/models/menu-item';
import {SchemaAllTypeModel, SchemaTypeModel} from '../../../../../shared/models/schema.type.model';
import {GlobalFiltersService}                from '../../../../../shared/services/global-filters.service';
import {SchemaService}                       from '../../../../../shared/services/schema.service';
import {StreamMessageService}                  from '../../../../../shared/services/stream-message.service';
import {SymbolsService}                      from '../../../../../shared/services/symbols.service';
import {FieldModel}                          from '../../../../../shared/utils/dynamic-form-builder/field-builder/field-model';
import * as NotificationsActions             from '../../../../../core/modules/notifications/store/notifications.actions';
import { getAppSettings } from 'src/app/core/store/app/app.selectors';

const JSONbig = require('json-bigint')({ storeAsString: true });

export interface editedMessageProps {
  symbols?: string[],
  types?: string[],
  timestamp: string,
  offset: number,
  reverse: boolean,
}

const instrumentTypes = [
  'EQUITY', 'OPTION', 'FUTURE', 'BOND', 'FX', 'INDEX', 'ETF', 'CUSTOM', 'SIMPLE_OPTION', 'EXCHANGE', 'TRADING_SESSION',
  'STREAM', 'DATA_CONNECTOR', 'EXCHANGE_TRADED_SYNTHETIC', 'SYSTEM', 'CFD'
]

@Component({
  selector: 'app-modal-send-message',
  templateUrl: './modal-send-message.component.html',
  styleUrls: ['./modal-send-message.component.scss'],
})
export class ModalSendMessageComponent implements OnInit, AfterViewInit, OnDestroy {
  stream: {id: string; name: string} | MenuItem;
  formData: any;
  editMessageMode: boolean;
  messageInfo: editedMessageProps;
  editingMessageNanoTime?: string;
  editorOptions = {
    theme: 'vs-dark',
    language: 'json',
    lineNumbers: 'off',
    minimap: {
      enabled: false,
    },
  };
  viewControl = new UntypedFormControl('form');
  writeModeControl = new UntypedFormControl(WriteMode.rewrite);
  writeModes = [WriteMode.append, WriteMode.insert, WriteMode.rewrite];
  views = ['form', 'json'];
  editJsonField$ = new BehaviorSubject<FieldModel>(null);
  jsonFieldControl = new UntypedFormControl();
  jsonViewControl = new UntypedFormControl();
  fields$: Observable<FieldModel[]>;
  formGroup: UntypedFormGroup;
  confirmTime: string;
  requestInProgress = false;
  public validationErrorMessage: {fieldName: string, fieldLabel: string, message: string};
  private fieldList: FieldModel[];

  @HostListener('focusin', ['$event']) onFocus(event) {
    this.setValidationErrorMessage(event.target.name);
  }

  private destroy$ = new Subject();
  private schema$: Observable<{types: SchemaTypeModel[]; all: SchemaAllTypeModel[]}>;
  private symbols$: Observable<string[]>;
  private symbolEnd$: Observable<string>;
  private symbolEndCache: {[index: string]: Observable<string>} = {};
  private typeFields: FieldModel[];

  constructor(
    private fb: UntypedFormBuilder,
    private schemaService: SchemaService,
    private globalFiltersService: GlobalFiltersService,
    private appStore: Store<AppState>,
    private symbolsService: SymbolsService,
    private streamMessageService: StreamMessageService,
    private translateService: TranslateService,
    private bsModalRef: BsModalRef,
    private host: ElementRef
  ) {}

  ngOnInit(): void {
    const appSettings$ = this.appStore.select(getAppSettings);

    this.formGroup = this.fb.group({
      symbol: this.formData?.symbol,
      $type: this.formData?.$type,
      timestamp: this.formData?.timestamp,
    });

    this.schema$ = this.schemaService.getSchema(this.stream.id).pipe(shareReplay(1));
    this.symbols$ = this.symbolsService.getSymbols(this.stream.id).pipe(shareReplay(1));

    this.initialCommonValues().subscribe(({symbol, $type, timestamp}) =>
      this.formGroup.patchValue({
        symbol,
        $type,
        timestamp,
      }),
    );

    const typeChange$ = this.formGroup.valueChanges.pipe(
      distinctUntilChanged((v1, v2) => v1.$type === v2.$type),
    );
    this.fields$ = combineLatest([this.schema$, this.symbols$, typeChange$, appSettings$]).pipe(
      debounceTime(0),
      map(([schema, symbols, formData, appSettings]) => {
        const commonFields: FieldModel[] = [
          {
            type: 'autocomplete',
            name: 'symbol',
            label: 'Symbol',
            required: true,
            values: symbols,
          },
          {
            type: 'dropdown',
            name: '$type',
            label: 'Type',
            required: true,
            values: schema.types.map((t) => t.name),
          },
          {
            type: 'btn-timepicker',
            name: 'timestamp',
            label: 'Timestamp',
            required: !!this.editMessageMode,
            nanotimeSupport: true
          },
        ];

        if (appSettings.hasInstrumentType) {
          commonFields.push({
            type: 'dropdown',
            name: 'instrumentType',
            label: 'Instrument Type',
            required: true,
            values: instrumentTypes,
          });

          this.formGroup.addControl('instrumentType', new FormControl(this.formData?.instrumentType ?? instrumentTypes[0], Validators.required));
        }

        this.formGroup.get('symbol').setValidators(this.fieldValidator(commonFields[0]));
        this.formGroup.get('$type').setValidators(this.fieldValidator(commonFields[1]));
        this.formGroup.get('timestamp').setValidators(this.fieldValidator(commonFields[2]));

        this.typeFields = schema.types
          .find(type => type.name === formData.$type)
          .fields.map(field => {
            const typeBindField = schema.all.find((type) => type.name === field.type.name);
            const types = {
              TIMESTAMP: 'btn-timepicker',
              BOOLEAN: 'select',
              BINARY: 'binary',
              ARRAY: 'json',
              OBJECT: 'json',
              FLOAT: 'number',
              INTEGER: 'number',
              BYTE: 'number',
              SHORT: 'number',
              DOUBLE: 'number',
            };
            let values = null;
            if (field.type.name === 'BOOLEAN') {
              values = [
                {key: true, title: 'true'},
                {key: false, title: 'false'},
              ];

              if (field.type.nullable) {
                values.unshift({key: null, title: 'null'});
              }
            }

            if (typeBindField) {
              values = typeBindField.fields.map((f) => f.name);
            }
            const nanotimeSupport = field.type.name === 'TIMESTAMP' && field.type.encoding === 'NANOSECOND';
            return {
              type: typeBindField ? 'dropdown' : types[field.type.name] || 'text',
              name: field.name,
              label: field.title || field.name[0].toLocaleUpperCase() + field.name.slice(1),
              required: !field.type.nullable,
              values,
              disabled: field.static && this.editMessageMode,
              nanotimeSupport
            };
          });

        const type = formData.$type.replace(/\./gi, '-');

        Object.keys(this.formGroup.controls).forEach((key) => {
          if (!['symbol', '$type', 'timestamp', 'instrumentType'].includes(key)) {
            const tf = this.typeFields.find((tf) => tf.name === key);
            if (!tf) {
              this.formGroup.removeControl(key);
            } else {
              const control = this.formGroup.get(key);
              control.setValidators(this.fieldValidator(tf));
              control.patchValue(this.formData?.[type]?.[tf.name]);
            }
          }
        });

        this.typeFields.forEach((typeField) => {
          if (!this.formGroup.get(typeField.name)) {
            const rawValue = this.formData?.[type]?.[typeField.name];
            const controlValue = isNaN(rawValue) ? rawValue : +rawValue;
            this.formGroup.addControl(
              typeField.name,
              new UntypedFormControl(controlValue, this.fieldValidator(typeField)),
            );
          }
          if (typeField.disabled) {
            this.formGroup.get(typeField.name).disable();
          }
        });

        const allFields = [...commonFields, ...this.typeFields];

        this.updateDropDowns(allFields);

        return allFields;
      }),
      shareReplay(1),
    );

    combineLatest([this.fields$, this.formGroup.valueChanges])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([fields, value]) => {
        fields.forEach((f) => {
          if (f.type === 'binary') {
            if (typeof value[f.name] === 'string') {
              this.formGroup.get(f.name).patchValue(
                value[f.name].split(',').map((v) => {
                  const num = Number(v);
                  return !v.length || isNaN(num) ? v : num;
                }),
                {emitEvent: false},
              );
            }
          }
        });
      });
    
    this.symbolEnd$ = this.formGroup.valueChanges.pipe(
      startWith(null),
      map(() => this.formGroup.getRawValue().symbol),
      distinctUntilChanged(),
      switchMap((symbol) => this.getSymbolEnd(symbol)),
    );

    this.viewControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((view) => {
      if (view === 'json') {
        this.patchJsonViewFromForm();
      }
    });

    this.jsonViewControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((value) => {
      try {
        const data = JSON.parse(value);
        this.formGroup.setErrors(null);
        const update = {
          $type: data.$type,
          symbol: data.symbol,
          timestamp: data.timestamp,
          ...data[data.$type.replace(/\./gi, '-')],
        };

        this.formGroup.patchValue(update);
        this.formGroup.updateValueAndValidity();
      } catch (e) {
        this.formGroup.setErrors({jsonViewError: true});
      }
    });

    this.formGroup.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const focusedFieldName = document.activeElement.getAttribute('name');
        this.setValidationErrorMessage(focusedFieldName);
      });

    this.fields$
      .pipe(takeUntil(this.destroy$))
      .subscribe(fields => {
        this.fieldList = fields;
        this.setValidationErrorMessage();
      });
  }
  
  private getSymbolEnd(symbol: string): Observable<string> {
    if (!this.symbolEndCache[symbol]) {
      const nullRange$ = of({props: {symbolRange: {end: '0'}}});
      const props$ = symbol ?
        this.symbolsService.getProps(this.stream.id, symbol).pipe(catchError(() => nullRange$)) :
        nullRange$;
  
      this.symbolEndCache[symbol] = props$.pipe(
        map(({props}) => props.symbolRange.end),
        shareReplay(1),
      );
    }

    return this.symbolEndCache[symbol].pipe(take(1));
  }

  private patchJsonViewFromForm() {
    this.fields$
      .pipe(take(1))
      .subscribe(fieldList => {
        const textFields = fieldList.filter(field => field.type === 'text').map(field => field.name);

        const formData = this.formGroup.getRawValue();
        fieldList.forEach(field => {
          if (!formData[field.name] && !field.required) {
            delete formData[field.name];
          }
        });

        const typeValues = {};
        Object.keys(formData).forEach((key) => {
          if (!['$type', 'symbol', 'timestamp'].includes(key)) {
            if (textFields.includes(key) && !formData[key]) {
              typeValues[key] = '';
            } else {
              typeValues[key] = formData[key] || null;
            }
          }
      });
    
      const type = formData.$type.replace(/\./gi, '-');
      this.jsonViewControl.patchValue(
        JSON.stringify(
          {
            [type]: typeValues,
            symbol: formData.symbol,
            $type: formData.$type,
            timestamp: formData.timestamp,
          },
          null,
          '\t',
        ),
        {emitEvent: false},
      );
    });
  }

  onRevert() {
    this.initialCommonValues()
      .pipe(
        tap(({symbol, $type, timestamp, instrumentType}) => {
          let update = {};
          const formType = $type.replace(/\./gi, '-');
          Object.keys(this.formGroup.getRawValue()).forEach((key) => (update[key] = null));
          update = {...update, symbol, $type, timestamp, instrumentType, ...(this.formData?.[formType] || {})};
          this.formGroup.patchValue(update);
          this.patchJsonViewFromForm();
        }),
        switchMap(() => this.fields$.pipe(take(1))),
      )
      .subscribe((fields) => this.updateDropDowns(fields));
  }

  onEditJson(field: FieldModel) {
    this.jsonFieldControl.setValidators([this.jsonControlValidator(field.required)]);
    this.jsonFieldControl.patchValue(
      JSON.stringify(this.formGroup.get(field.name).value || null, null, '\t'),
    );
    this.editJsonField$.next(field);
  }

  onSave() {
    this.requestInProgress = true;
    const form = this.formGroup.getRawValue();
    if (this.editingMessageNanoTime) {
      form.nanoTime = this.editingMessageNanoTime;
    }
    this.typeFields.forEach(field => {
      const fieldName = field.name;
      if (!form[fieldName] && !field.required) {
        delete form[fieldName];
      }
    });

    this.streamMessageService
      .updateMessage(this.stream.id, JSON.parse(JSON.stringify(form)), this.messageInfo)
      .pipe(withLatestFrom(this.translateService.get('notification_messages')))
      .subscribe({
        next: ([response, messages]) => {
        const errorMessages = response
          .filter((entry) => entry.error)
          .map((entry) => entry.message)
          .join(', ');

        this.appStore.dispatch(
          new NotificationsActions.AddNotification({
            message: errorMessages || messages.updateMessageSucceeded,
            dismissible: true,
            closeInterval: errorMessages ? 10000 : 3000,
            type: errorMessages ? 'danger' : 'success',
          }),
        );
        this.requestInProgress = false;

        if (!errorMessages) {
          this.bsModalRef.hide();
        }
      },
      error: () => this.requestInProgress = false
    });
  }

  onSubmit() {
    this.requestInProgress = true;
    combineLatest([this.needTruncateConfirm(), this.globalFiltersService.getFilters()])
      .pipe(take(1))
      .subscribe(([needConfirm, filters]) => {
        this.confirmTime = needConfirm
          ? formatHDate(
              new Date(this.formGroup.get('timestamp').value).toISOString(),
              filters.dateFormat,
              filters.timeFormat,
              filters.timezone,
            )
          : null;

        if (!needConfirm) {
          this.save();
        }
      });
  }

  saveJson(field: FieldModel) {
    this.formGroup.get(field.name).patchValue(JSONbig.parse(this.jsonFieldControl.value));
    this.jsonFieldControl.setValidators(null);
    this.jsonFieldControl.patchValue(null);
    this.editJsonField$.next(null);
  }

  cancelJsonEdit(field: FieldModel) {
    this.jsonFieldControl.patchValue(null);
    this.editJsonField$.next(null);
  }

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }

  cancelSave() {
    this.requestInProgress = false;
    this.confirmTime = null;
  }

  save() {
    const form = this.formGroup.getRawValue();
    const writeMode = this.writeModeControl.value;

    if (!form.timestamp) {
      delete form.timestamp;
    }
    this.typeFields.forEach(field => {
      const fieldName = field.name;
      if (!form[fieldName] && !field.required) {
        delete form[fieldName];
      }
    });

    this.streamMessageService
      .sendMessage(this.stream.id, [JSON.parse(JSON.stringify(form))], writeMode)
      .pipe(withLatestFrom(this.translateService.get('notification_messages')))
      .subscribe({
        next:([response, messages]) => {
        const errorMessages = response
          .filter((entry) => entry.error)
          .map((entry) => entry.message)
          .join(', ');

        this.appStore.dispatch(
          new NotificationsActions.AddNotification({
            message: errorMessages || messages.sendMessageSucceeded,
            dismissible: true,
            closeInterval: errorMessages ? 10000 : 3000,
            type: errorMessages ? 'danger' : 'success',
          }),
        );
        this.requestInProgress = false;

        if (!errorMessages) {
          this.bsModalRef.hide();
        }
      },
      error: () => this.requestInProgress = false
    });
  }

  private jsonControlValidator(required = false) {
    return (control) => {
      try {
        const data = JSON.parse(control.value);
        return required && !data ? {required: true} : null;
      } catch (e) {
        return {invalidJson: true};
      }
    };
  }

  private initialCommonValues(): Observable<{symbol: string; $type: string; timestamp: string, instrumentType: string}> {
    return combineLatest([this.schema$, this.symbols$]).pipe(
      take(1),
      map(([schema, symbols]) => ({
        symbol: this.formData?.symbol || symbols[0],
        $type: this.formData?.$type || schema.types[0].name,
        timestamp: this.formData?.timestamp,
        instrumentType: this.formData?.instrumentType ?? instrumentTypes[0]
      })),
    );
  }

  private updateDropDowns(fields: FieldModel[]) {
    fields.forEach((f) => {
      if (['dropdown', 'select'].includes(f.type) && !this.formGroup.get(f.name).value) {
        const val = f.values[0] && typeof f.values[0] === 'object' ? f.values[0].key : f.values[0];
        this.formGroup.get(f.name).patchValue(val);
      }
    });
  }

  private fieldValidator(field: FieldModel) {
    if (field.type === 'json') {
      return (control) => (!field.required || control.value ? null : {required: true});
    }

    if (field.type === 'dropdown') {
      return [
        field.required ? Validators.required : null,
        (control) => ((!field.required && control.value === null) || field.values.includes(control.value)) ? 
          null : {wrong_value: true},
      ].filter(Boolean);
    }

    if (field.type === 'binary') {
      return [
        field.required ? Validators.required : null,
        (control) => {
          if (!control.value) {
            return;
          }

          const isString = typeof control.value === 'string';
          const string = isString ? control.value : control.value.join(',');
          let array = isString ? control.value.split(',') : control.value;
          array = array.map((v) => Number(v)).filter((v) => !isNaN(v));

          return array.join(',') === string || (!field.required && !string) ? null : {wrong_value: true};
        },
      ].filter(Boolean);
    }

    if (field.type === 'btn-timepicker') {
      return [
        field.required ? Validators.required : null,
        (control) => {
          if (!control.value) {
            return null;
          }

          if (typeof control.value === 'string') {
            if (field.nanotimeSupport) {
              const dateFormat = /\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d{1,9}Z/;
              return ((!field.required && !control.value) || dateFormat.test(control.value)) ? null : { wrong_format: true };
            } else {
              const dateFormat = /\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d{1,3}Z/;
              const invalidDateFormat = /\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d{4}Z/;
              return ((!field.required && !control.value) || (dateFormat.test(control.value) && !invalidDateFormat.test(control.value))) ? 
                null : { wrong_format: true };
            }
          }

          if (control.value?.getTime && control.value?.getTime() !== undefined) {
            return null;
          }

          return {notDate: true};
        },
      ].filter(Boolean);
    }
    return field.required ? Validators.required : null;
  }

  private needTruncateConfirm(): Observable<boolean> {
    if (this.writeModeControl.value !== WriteMode.rewrite) {
      return of(false);
    }

    const timestampControl = this.formGroup.get('timestamp');
    if (timestampControl.invalid || !timestampControl.value) {
      return of(false);
    }

    const timestamp = new Date(timestampControl.value);
    return this.symbolEnd$.pipe(map((end) => new Date(end) >= timestamp));
  }

  private setValidationErrorMessage(fieldName: string = '') {
    this.validationErrorMessage = null;
    if (fieldName && this.fieldList) {
      const fieldError = this.formGroup.get(fieldName)?.errors;
      if (fieldError) {
        const fieldLabel = this.fieldList.find(field => field.name === fieldName)?.label;
        const errorText = Object.keys(fieldError)[0].split('_').join(' ');
        this.validationErrorMessage = { fieldName, fieldLabel, message: errorText };
      }
    }
    if (!this.validationErrorMessage && this.fieldList) {
      setTimeout(() => {
        const invalidControl = Object.entries(this.formGroup.controls).find(([, value]) => !!value.errors);
        if (invalidControl) {
          const fieldLabel = this.fieldList?.find(field => field.name === invalidControl[0])?.label;
          this.validationErrorMessage = { 
            fieldName: invalidControl[0], 
            fieldLabel, 
            message: Object.keys(invalidControl[1].errors)[0].split('_').join(' ') };
        }
      });
    }
  }

  public scrollToInvalidField(fieldName: string) {
    const targetField = this.host.nativeElement.querySelector(`[name=${fieldName}]`);
    targetField.scrollIntoView({block: "center", behavior: "smooth"});
  }
}
