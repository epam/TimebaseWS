import {Component, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {select, Store} from '@ngrx/store';
import {BsModalService} from 'ngx-bootstrap/modal';
import {combineLatest, merge, Observable, of, ReplaySubject, timer} from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  startWith,
  switchMap,
  take,
  takeUntil,
  withLatestFrom,
} from 'rxjs/operators';
import {AppState} from '../../../../../../core/store';
import {
  FieldTypeModel,
  SchemaClassFieldModel,
} from '../../../../../../shared/models/schema.class.type.model';
import {PermissionsService} from '../../../../../../shared/services/permissions.service';
import {FieldModel} from '../../../../../../shared/utils/dynamic-form-builder/field-builder/field-model';
import {uniqueName} from '../../../../../../shared/utils/validators';
import {FieldPropertiesFormFieldsService} from '../../services/field-properties-form-fields.service';
import {SeFieldFormsService} from '../../services/se-field-forms.service';
import {SeFormPreferencesService} from '../../services/se-form-preferences.service';
import {ChangeSelectedFieldProps} from '../../store/schema-editor.actions';
import {
  getDefaultsTypes,
  getSelectedFieldProps,
  getSelectedSchemaItem,
  getSelectedSchemaItemAllFields,
} from '../../store/schema-editor.selectors';
import {FIELD_NAME_PATTER_REGEXP} from '../fl-control-panel/fl-control-panel.component';
import {RelativeToModalComponent} from '../relative-to-modal/relative-to-modal.component';

@Component({
  selector: 'app-field-properties',
  templateUrl: './field-properties.component.html',
  styleUrls: ['./field-properties.component.scss'],
  providers: [FieldPropertiesFormFieldsService],
})
export class FieldPropertiesComponent implements OnInit, OnDestroy {
  formGroup: FormGroup;
  fields$: Observable<FieldModel[]>;
  revertDisabled$ = this.seFieldFormsService.hasChanges().pipe(map((hasChanges) => !hasChanges));
  isWriter$: Observable<boolean>;

  private destroy$ = new ReplaySubject(1);

  constructor(
    private fb: FormBuilder,
    private appStore: Store<AppState>,
    private fieldPropertiesFormFieldsService: FieldPropertiesFormFieldsService,
    private seFieldFormsService: SeFieldFormsService,
    private permissionsService: PermissionsService,
    private modalService: BsModalService,
  ) {}

  ngOnInit() {
    this.isWriter$ = this.permissionsService.isWriter();

    const uniqueNameValidator = uniqueName(
      combineLatest([
        this.appStore.pipe(select(getSelectedSchemaItemAllFields)),
        this.field(),
      ]).pipe(
        take(1),
        map(([items, field]) =>
          items.filter((item) => item._props._uuid !== field._props._uuid).map((item) => item.name),
        ),
      ),
    );

    this.formGroup = this.fb.group({
      name: [
        null,
        [Validators.required, Validators.pattern(FIELD_NAME_PATTER_REGEXP)],
        uniqueNameValidator,
      ],
      static: null,
      description: null,
      relativeTo: null,
      value: [null, this.staticFieldValidator()],
      title: null,
      type: this.fb.group({
        name: null,
        encoding: null,
        nullable: null,
        types: [null, this.typesFieldValidator()],
        elementType: this.fb.group({
          name: null,
          encoding: null,
          nullable: null,
          types: null,
        }),
      }),
    });

    this.isWriter$.pipe(takeUntil(this.destroy$)).subscribe((isWriter) => {
      if (isWriter) {
        this.formGroup.enable({emitEvent: false});
      } else {
        this.formGroup.disable({emitEvent: false});
      }
    });

    this.fieldPropertiesFormFieldsService
      .onStaticValueChange()
      .pipe(takeUntil(this.destroy$))
      .subscribe((staticValueField) => {
        const getValue = (entry) => (typeof entry === 'object' ? entry.value : entry);
        if (
          staticValueField?.values &&
          !staticValueField.values.map(getValue).includes(this.formGroup.get('value').value)
        ) {
          this.formGroup
            .get('value')
            .patchValue(getValue(staticValueField.values[0]), {emitEvent: false});
          this.updateStoreValueFromForm();
        }
      });

    this.formGroup.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        distinctUntilChanged((c, p) => JSON.stringify(c) === JSON.stringify(p)),
        debounceTime(150),
        switchMap(() => this.checkRelativeTo()),
      )
      .subscribe(() => this.updateStoreValueFromForm());

    merge(this.formGroup.get('type').valueChanges, this.formGroup.get('static').valueChanges)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.formGroup.get('value').markAsDirty());

    ['type', 'type.elementType'].forEach((formPath) => {
      combineLatest([
        this.formGroup.get(`${formPath}.name`).valueChanges,
        this.appStore.pipe(
          select(getDefaultsTypes),
          filter((t) => !!t),
        ),
      ])
        .pipe(
          distinctUntilChanged((p, c) => JSON.stringify(p) === JSON.stringify(c)),
          takeUntil(this.destroy$),
        )
        .subscribe(([typeName, defaultTypes]) => {
          const encodings = defaultTypes
            .filter((t) => t.name === typeName && t.encoding)
            .map((_type) => _type.encoding);
          this.formGroup
            .get(`${formPath}.encoding`)
            .patchValue(encodings[0] || null, {emitEvent: false});
          this.updateStoreValueFromForm();
        });
    });

    this.formGroup
      .get('type')
      .valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        this.fillEmptyElementType();
      });

    this.formGroup
      .get('static')
      .valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((staticValue) => {
        if (!staticValue) {
          this.formGroup.get('value').patchValue(null, {emitEvent: false});
          this.updateStoreValueFromForm();
        }

        if (staticValue && ['ARRAY', 'OBJECT'].includes(this.formGroup.get('type.name').value)) {
          this.formGroup.get('type').patchValue(this.preferTypeWithoutArray(), {emitEvent: false});
          this.fillEmptyElementType();
          this.updateStoreValueFromForm();
        }
      });

    this.formGroup
      .get('type')
      .valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((type) => {
        SeFormPreferencesService.preferType = {
          ...type,
          elementType: type.name === 'ARRAY' ? type.elementType : null,
        };
      });

    const selectedFieldChanged$: Observable<SchemaClassFieldModel> = this.appStore.pipe(
      select(getSelectedFieldProps),
      filter((f) => !!f),
    );

    selectedFieldChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe((field) => this.resetFormFormField(field));

    selectedFieldChanged$
      .pipe(
        takeUntil(this.destroy$),
        distinctUntilChanged((p, c) => p._props._uuid === c._props._uuid),
        startWith(null),
      )
      .subscribe(() => {
        this.formGroup.markAsPristine();
        this.seFieldFormsService.formGroupChange(this.formGroup);
      });

    this.seFieldFormsService
      .onRevertForm()
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        this.resetFormFormField(data);
        this.formGroup.markAsPristine();
        this.updateStoreValueFromForm();
      });

    this.fields$ = this.fieldPropertiesFormFieldsService.fields();
  }

  revert() {
    this.seFieldFormsService.revertForm();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private resetFormFormField(field: Partial<SchemaClassFieldModel>) {
    this.formGroup.patchValue(
      {
        name: null,
        static: null,
        value: null,
        title: null,
        description: null,
        relativeTo: null,
        ...field,
        type: {
          name: null,
          encoding: null,
          nullable: null,
          types: null,
          ...(field.type || {}),
          elementType: {
            name: null,
            encoding: null,
            nullable: null,
            types: null,
            ...(field.type?.elementType || {}),
          },
        },
      },
      {emitEvent: false},
    );

    // Validators depends of other fields
    this.formGroup.get('value').updateValueAndValidity({emitEvent: false});
    this.formGroup.get('type.types').updateValueAndValidity({emitEvent: false});
  }

  private preferTypeWithoutArray(): FieldTypeModel {
    return ['ARRAY', 'OBJECT'].includes(SeFormPreferencesService.preferType.name)
      ? SeFormPreferencesService.defaultPreferType
      : SeFormPreferencesService.preferType;
  }

  private fillEmptyElementType() {
    const data = this.formGroup.get('type').value;
    if (data.name === 'ARRAY' && !data.elementType.name) {
      this.formGroup
        .get('type.elementType')
        .patchValue(this.preferTypeWithoutArray(), {emitEvent: false});
      this.updateStoreValueFromForm();
    }
  }

  private typesFieldValidator(): (control: FormControl) => object | null {
    return (control: FormControl) => {
      if (!this.formGroup) {
        return null;
      }

      if (this.formGroup.value.type.name === 'OBJECT' && !control.value?.length) {
        return {required: true};
      }

      return null;
    };
  }

  private checkRelativeTo(): Observable<void> {
    return this.appStore.pipe(
      select(getSelectedSchemaItemAllFields),
      take(1),
      switchMap((all) => {
        if (!this.formGroup) {
          return of(null);
        }

        const value = this.formGroup.value;

        if (value.type.name === 'FLOAT' && !value.static) {
          return of(null);
        }

        const blockFields = all.filter((field) => field.relativeTo === value.name);
        if (!blockFields.length) {
          return of(null);
        }

        const ref = this.modalService.show(RelativeToModalComponent, {
          initialState: {blockFields, isFloat: value.type.name === 'FLOAT', fieldName: value.name},
          ignoreBackdropClick: true,
        });
        return ref.content.resolve$.pipe(
          map((result) => {
            if (result) {
              blockFields.forEach((affected) => {
                this.appStore.dispatch(
                  ChangeSelectedFieldProps({
                    newData: {
                      ...affected,
                      relativeTo: null,
                    },
                    uuid: affected._props._uuid,
                    isSelected: false,
                  }),
                );
              });
            } else {
              this.formGroup.get('type').patchValue({name: 'FLOAT'});
              this.formGroup.get('static').patchValue(false);
            }
          }),
        );
      }),
    );
  }

  private staticFieldValidator(): (control: FormControl) => object | null {
    return (control: FormControl) => {
      if (!this.formGroup) {
        return null;
      }

      const formValue = this.formGroup.value;

      if (!formValue.static) {
        return null;
      }

      if (!control.value) {
        return formValue.type.nullable ? null : {required: true};
      }

      const pattern = this.staticFieldPattern(formValue.type.name, formValue.type.encoding);
      return !pattern || pattern.test(control.value) ? null : {pattern: true};
    };
  }

  private staticFieldPattern(typeName: string, encoding: string): RegExp {
    if (typeName === 'FLOAT') {
      /**
       * switch (encoding) {
            // TODO: Add patterns for encodings
            // case 'IEEE32':
            //   validators.push(Validators.pattern(/^.*$/));
            //   break;
            // case 'IEEE64':
            //   validators.push(Validators.pattern(/^.*$/));
            //   break;
            // case 'DECIMAL':
            //   validators.push(Validators.pattern(/^.*$/));
            //   break;
            // case 'DECIMAL64':
            //   validators.push(Validators.pattern(/^.*$/));
            //   break;
            default:
              validators.push(Validators.pattern(/^\-?\d+(.\d+)?([eE][\-\+]\d+)?$/));
              break;
          }
       */
      return /^\-?\d+(.\d+)?([eE][\-\+]\d+)?$/;
    }
    return {
      TIMESTAMP:
        /^\d{4}-(0?[1-9]|1[0-2])-(0?[1-9]|[12][0-9]|3[01]) (0[0-9]|1[0-9]|2[0-3]):([0-9]|[0-5][0-9]):([0-9]|[0-5][0-9]).\d{1,3}$/,
      TIMEOFDAY: /^(00|[0-9]|1[0-9]|2[0-3]):([0-9]|[0-5][0-9])$/,
      CHAR: /^.{1}$/,
      VARCHAR: /^.*$/,
      INTEGER: /^\-?\d+$/,
    }[typeName];
  }

  private field(): Observable<SchemaClassFieldModel> {
    return this.appStore.pipe(
      select(getSelectedFieldProps),
      filter((f) => !!f),
    );
  }

  private updateStoreValueFromForm() {
    this.updateStoreValue(
      this.fieldPropertiesFormFieldsService.fieldFromFormData(this.formGroup.value),
    );
    this.seFieldFormsService.formValueChanged(this.formGroup);
  }

  private updateStoreValue(data) {
    this.appStore
      .pipe(
        select(getSelectedSchemaItem),
        withLatestFrom(
          combineLatest([
            this.appStore.pipe(
              select(getSelectedSchemaItemAllFields),
              filter((d) => !!d),
            ),
            this.appStore.pipe(
              select(getSelectedFieldProps),
              filter((d) => !!d),
            ),
          ]),
        ),
        take(1),
        takeUntil(this.destroy$),
      )
      .subscribe(([selectedItem, [allItems, props]]) => {
        if (selectedItem._props._selectedFieldUuid) {
          if (props.name !== data.name) {
            allItems
              .filter((item) => item.relativeTo === props.name)
              .forEach((item) => {
                this.appStore.dispatch(
                  ChangeSelectedFieldProps({
                    newData: {
                      ...item,
                      relativeTo: data.name,
                    },
                    uuid: item._props._uuid,
                    isSelected: false,
                  }),
                );
              });
          }

          this.appStore.dispatch(
            ChangeSelectedFieldProps({
              newData: {
                hide: false,
                ...data,
                _props: {
                  ...props._props,
                  ...(data._props || {}),
                  _isEdited: true,
                  _isCurrentEdited: true,
                },
              },
              uuid: props._props._uuid,
            }),
          );
        }
      });
  }
}
