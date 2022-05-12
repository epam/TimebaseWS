import {AfterViewInit, Component, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
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
} from 'rxjs/operators';
import {AppState} from '../../../../../core/store';
import {formatHDate} from '../../../../../shared/locale.timezone';
import {MenuItem} from '../../../../../shared/models/menu-item';
import {SchemaAllTypeModel, SchemaTypeModel} from '../../../../../shared/models/schema.type.model';
import {GlobalFiltersService} from '../../../../../shared/services/global-filters.service';
import {SchemaService} from '../../../../../shared/services/schema.service';
import {SendMessageService} from '../../../../../shared/services/send-message.service';
import {SymbolsService} from '../../../../../shared/services/symbols.service';
import {FieldModel} from '../../../../../shared/utils/dynamic-form-builder/field-builder/field-model';
import * as NotificationsActions from '../../../../../core/modules/notifications/store/notifications.actions';

enum WriteMode {
  append = 'APPEND',
  insert = 'INSERT',
  truncate = 'TRUNCATE',
}

@Component({
  selector: 'app-modal-send-message',
  templateUrl: './modal-send-message.component.html',
  styleUrls: ['./modal-send-message.component.scss'],
})
export class ModalSendMessageComponent implements OnInit, AfterViewInit, OnDestroy {
  stream: {id: string; name: string} | MenuItem;
  formData: any;
  editorOptions = {
    theme: 'vs-dark',
    language: 'json',
    lineNumbers: 'off',
    minimap: {
      enabled: false,
    },
  };
  viewControl = new FormControl('form');
  writeModeControl = new FormControl(WriteMode.append);
  writeModes = [WriteMode.append, WriteMode.insert, WriteMode.truncate];
  views = ['form', 'json'];
  editJsonField$ = new BehaviorSubject<FieldModel>(null);
  jsonFieldControl = new FormControl();
  jsonViewControl = new FormControl();
  fields$: Observable<FieldModel[]>;
  formGroup: FormGroup;
  confirmTime: string;

  private destroy$ = new Subject();
  private schema$: Observable<{types: SchemaTypeModel[]; all: SchemaAllTypeModel[]}>;
  private symbols$: Observable<string[]>;
  private symbolEnd$: Observable<string>;

  constructor(
    private fb: FormBuilder,
    private schemaService: SchemaService,
    private globalFiltersService: GlobalFiltersService,
    private appStore: Store<AppState>,
    private symbolsService: SymbolsService,
    private sendMessageService: SendMessageService,
    private translateService: TranslateService,
    private bsModalRef: BsModalRef,
  ) {}

  ngOnInit(): void {
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
    this.fields$ = combineLatest([this.schema$, this.symbols$, typeChange$]).pipe(
      debounceTime(0),
      map(([schema, symbols, formData]) => {
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
            required: true,
          },
        ];

        this.formGroup.get('symbol').setValidators(this.fieldValidator(commonFields[0]));
        this.formGroup.get('$type').setValidators(this.fieldValidator(commonFields[1]));
        this.formGroup.get('timestamp').setValidators(this.fieldValidator(commonFields[2]));

        const typeFields: FieldModel[] = schema.types
          .find((t) => t.name === formData.$type)
          .fields.map((f) => {
            const typeBindField = schema.all.find((t) => t.name === f.type.name);
            const types = {
              TIMESTAMP: 'btn-timepicker',
              BOOLEAN: 'select',
              BINARY: 'binary',
              ARRAY: 'json',
              OBJECT: 'json',
            };
            let values = null;
            if (f.type.name === 'BOOLEAN') {
              values = [
                {key: true, title: 'true'},
                {key: false, title: 'false'},
              ];

              if (f.type.nullable) {
                values.unshift({key: null, title: 'null'});
              }
            }

            if (typeBindField) {
              values = typeBindField.fields.map((f) => f.name);
            }
            return {
              type: typeBindField ? 'dropdown' : types[f.type.name] || 'text',
              name: f.name,
              label: f.title,
              required: !f.type.nullable,
              values,
            };
          });

        const type = formData.$type.replace(/\./gi, '-');

        Object.keys(this.formGroup.controls).forEach((key) => {
          if (!['symbol', '$type', 'timestamp'].includes(key)) {
            const tf = typeFields.find((tf) => tf.name === key);
            if (!tf) {
              this.formGroup.removeControl(key);
            } else {
              const control = this.formGroup.get(key);
              control.setValidators(this.fieldValidator(tf));
              control.patchValue(this.formData?.[type]?.[tf.name]);
            }
          }
        });

        typeFields.forEach((tf) => {
          if (!this.formGroup.get(tf.name)) {
            this.formGroup.addControl(
              tf.name,
              new FormControl(this.formData?.[type]?.[tf.name], this.fieldValidator(tf)),
            );
          }
        });

        const allFields = [...commonFields, ...typeFields];

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
      startWith(this.formGroup.value),
      map((value) => value.symbol),
      distinctUntilChanged(),
      switchMap((symbol) => this.symbolsService.getProps(this.stream.id, symbol)),
      map(({props}) => props.symbolRange.end),
      shareReplay(1),
    );

    this.viewControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((view) => {
      if (view === 'json') {
        const formData = this.formGroup.getRawValue();
        const typeValues = {};
        Object.keys(formData).forEach((key) => {
          if (!['$type', 'symbol', 'timestamp'].includes(key)) {
            typeValues[key] = formData[key] || null;
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
  }

  onRevert() {
    this.initialCommonValues()
      .pipe(
        tap(({symbol, $type, timestamp}) => {
          let update = {};
          const formType = $type.replace(/\./gi, '-');
          Object.keys(this.formGroup.getRawValue()).forEach((key) => (update[key] = null));
          update = {...update, symbol, $type, timestamp, ...(this.formData?.[formType] || {})};
          this.formGroup.patchValue(update);
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

  onSubmit() {
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
    this.formGroup.get(field.name).patchValue(JSON.parse(this.jsonFieldControl.value));
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
    this.confirmTime = null;
  }

  save() {
    const form = this.formGroup.getRawValue();
    const writeMode = this.writeModeControl.value;

    this.sendMessageService
      .sendMessage(this.stream.id, [JSON.parse(JSON.stringify(form))], writeMode)
      .pipe(switchMap(() => this.translateService.get('notification_messages')))
      .subscribe((messages) => {
        this.appStore.dispatch(
          new NotificationsActions.AddNotification({
            message: messages.sendMessageSucceeded,
            dismissible: true,
            closeInterval: 2000,
            type: 'success',
          }),
        );

        this.bsModalRef.hide();
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

  private initialCommonValues(): Observable<{symbol: string; $type: string; timestamp: string}> {
    return combineLatest([this.schema$, this.symbols$]).pipe(
      take(1),
      map(([schema, symbols]) => ({
        symbol: this.formData?.symbol || symbols[0],
        $type: this.formData?.$type || schema.types[0].name,
        timestamp: this.formData?.timestamp,
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
        (control) => {
          return field.values.includes(control.value) ? null : {wrongValue: true};
        },
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

          return array.join(',') === string ? null : {wrongValue: true};
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
            return /\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z)/.test(
              control.value,
            )
              ? null
              : {notFormat: true};
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
    if (this.writeModeControl.value !== WriteMode.truncate) {
      return of(false);
    }

    const timestampControl = this.formGroup.get('timestamp');
    if (timestampControl.invalid) {
      return of(false);
    }

    const timestamp = new Date(timestampControl.value);
    return this.symbolEnd$.pipe(map((end) => new Date(end) > timestamp));
  }
}
