import {Injectable} from '@angular/core';
import {FormControl} from '@angular/forms';
import {select, Store} from '@ngrx/store';
import {TranslateService} from '@ngx-translate/core';
import {combineLatest, merge, Observable, ReplaySubject} from 'rxjs';
import {distinctUntilChanged, filter, map} from 'rxjs/operators';
import {AppState} from '../../../../../core/store';
import {
  DefaultTypeModel,
  FieldTypeModel,
  SchemaClassFieldModel,
  SchemaClassTypeModel,
} from '../../../../../shared/models/schema.class.type.model';
import {FieldModel} from '../../../../../shared/utils/dynamic-form-builder/field-builder/field-model';
import {
  getAllSchemaItems,
  getDefaultsTypes,
  getSelectedFieldProps,
  getSelectedSchemaItem,
  getSelectedSchemaItemAllFields,
} from '../store/schema-editor.selectors';
import {SeFieldFormsService} from './se-field-forms.service';

@Injectable()
export class FieldPropertiesFormFieldsService {
  private staticValueFieldChange$ = new ReplaySubject<FieldModel>(1);

  constructor(
    private appStore: Store<AppState>,
    private translateService: TranslateService,
    private seFieldFormsService: SeFieldFormsService,
  ) {}

  fields(): Observable<FieldModel[]> {
    return combineLatest([
      this.translateService.get('forms.fieldsList'),
      this.appStore.pipe(select(getSelectedSchemaItem), filter(Boolean)),
      merge(
        this.appStore.pipe(select(getSelectedFieldProps), filter(Boolean)),
        this.seFieldFormsService.onRevertForm().pipe(map((data) => this.fieldFromFormData(data))),
      ),
      this.appStore.pipe(select(getAllSchemaItems), filter(Boolean)),
      this.appStore.pipe(select(getDefaultsTypes), filter(Boolean)),
      this.appStore.pipe(select(getSelectedSchemaItemAllFields), filter(Boolean)),
    ]).pipe(
      map(
        ([messages, type, field, allSchemaItems, defaultTypes, allFields]: [
          any,
          SchemaClassTypeModel,
          SchemaClassFieldModel,
          SchemaClassTypeModel[],
          DefaultTypeModel[],
          SchemaClassFieldModel[],
        ]) => {
          const enums = allSchemaItems.filter((_type) => _type.isEnum);
          const enumNames = enums.map((_type) => _type.name);
          const defaultTypeNames = [...new Set(defaultTypes.map((t) => t.name))];
          const classNames = allSchemaItems
            .filter((t) => !t.isEnum && !t.isAbstract && !t?._props?._isSelected)
            .map((t) => t.name);
          let nameValues = [...defaultTypeNames, ...enumNames];

          const fields: FieldModel[] = [
            {
              type: 'text',
              name: 'name',
              label: messages.value,
              required: true,
              validators: {getErrorsText: this.getErrorsText(true)},
            },
          ];

          if (type.isEnum) {
            return fields;
          }

          fields.push({
            type: 'dropdown',
            name: 'static',
            label: messages.static.title,
            required: true,
            values: [
              {value: true, label: messages.static.static},
              {value: false, label: messages.static.nonstatic},
            ],
          });

          if (field.static) {
            const staticValueField = this.getStaticValueField(messages, field, enums);
            this.staticValueFieldChange$.next(staticValueField);
            if (staticValueField) {
              fields.push(staticValueField);
            }
          }

          fields.push({
            type: 'text',
            name: 'title',
            label: messages.title,
            required: false,
          });

          if (field.type.name === 'FLOAT' && !field.static) {
            const previous = [];
            allFields
              .filter((f) => f.type.name === field.type.name && field.static === f.static)
              .some((f) => {
                if (f.name === field.name) {
                  return true;
                }

                previous.push(f);
              });

            if (previous.length) {
              fields.push({
                type: 'dropdown',
                name: 'relativeTo',
                label: messages.relativeTo,
                required: false,
                values: [
                  {value: null, label: 'NULL'},
                  ...previous.map((f) => ({value: f.name, label: f.name})),
                ],
                validators: {getErrorsText: this.getErrorsText()},
              });
            }
          }

          fields.push({
            type: 'text',
            name: 'description',
            label: messages.description,
            required: false,
          });

          if (field.static) {
            nameValues = nameValues.filter((value) => !['ARRAY', 'OBJECT'].includes(value));
          }

          fields.push(
            this.getTypeField('type', messages, defaultTypes, nameValues, field.type, classNames),
          );

          return fields;
        },
      ),
      distinctUntilChanged((p, c) => JSON.stringify(p) === JSON.stringify(c)),
    );
  }

  onStaticValueChange(): Observable<FieldModel> {
    return this.staticValueFieldChange$.pipe(
      distinctUntilChanged((p, c) => JSON.stringify(p) === JSON.stringify(c)),
    );
  }

  fieldFromFormData(data: Partial<SchemaClassFieldModel>): SchemaClassFieldModel {
    return {
      ...data,
      type: {
        ...data.type,
        elementType: data.type.name === 'ARRAY' ? data.type.elementType : null,
      },
    } as SchemaClassFieldModel;
  }

  private getTypeField(
    name: string,
    messages,
    defaultTypes: DefaultTypeModel[],
    nameValues: string[],
    type: FieldTypeModel,
    classNames: string[],
  ): FieldModel {
    const childFields: FieldModel[] = [
      {
        type: 'dropdown',
        name: 'name',
        label: messages.name,
        required: true,
        values: nameValues,
      },
    ];

    const encodings = defaultTypes
      .filter((t) => t.name === type.name && t.encoding)
      .map((_type) => _type.encoding);

    if (encodings.length) {
      childFields.push({
        type: 'dropdown',
        name: 'encoding',
        label: messages.encoding,
        values: encodings,
        required: false,
      });
    }

    if (type.name === 'OBJECT') {
      childFields.push({
        type: 'multiselect',
        name: 'types',
        label: messages.types.controlTitle,
        required: true,
        values: classNames,
        _controlSpecOptions: {
          selectAllText: messages.types.selectAllText,
          unSelectAllText: messages.types.unSelectAllText,
        },
      });
    }

    childFields.push({
      type: 'checkbox',
      name: 'nullable',
      label: messages.nullable,
      required: false,
    });

    if (type.elementType) {
      childFields.push(
        this.getTypeField(
          'elementType',
          messages,
          defaultTypes,
          nameValues.filter((n) => n !== 'ARRAY'),
          type.elementType,
          classNames,
        ),
      );
    }

    return {
      type: 'object',
      name: name,
      label: messages.type,
      required: false,
      childFields: childFields,
    };
  }

  private getStaticValueField(
    messages,
    field: SchemaClassFieldModel,
    enums: SchemaClassTypeModel[],
  ): FieldModel {
    const required = !field.type.nullable;
    const staticEnum = enums.find((enumField) => enumField.name === field.type.name);

    if (staticEnum) {
      const values = staticEnum.fields.map((f) => ({value: f.name, label: f.name}));
      if (!required) {
        values.unshift({value: null, label: 'NULL'});
      }
      return {
        type: 'dropdown',
        name: 'value',
        label: messages.staticValue,
        values,
        required,
        validators: {getErrorsText: this.getErrorsText()},
      };
    }

    switch (field.type.name) {
      case 'BOOLEAN':
        const values = [
          {value: 'true', label: 'true'},
          {value: 'false', label: 'false'},
        ];
        if (!required) {
          values.unshift({value: null, label: 'NULL'});
        }
        return {
          type: 'dropdown',
          name: 'value',
          label: messages.staticValue,
          values,
          required,
          validators: {getErrorsText: this.getErrorsText()},
        };

      case 'TIMESTAMP':
        return {
          type: 'datetimepicker',
          name: 'value',
          label: messages.staticValue,
          value: field.value || null,
          required,
          _controlSpecOptions: {
            dateInputFormat: 'YYYY-MM-DD HH:mm:ss.SSS',
          },
          validators: {getErrorsText: this.getErrorsText()},
        };

      case 'TIMEOFDAY':
      case 'CHAR':
      case 'VARCHAR':
      case 'FLOAT':
      case 'INTEGER':
      case 'BINARY':
        return {
          type: 'text',
          name: 'value',
          label: messages.staticValue,
          required,
          validators: {getErrorsText: this.getErrorsText()},
        };
    }
  }

  private getErrorsText(isName = false): (control: FormControl) => Observable<string> {
    return (control) => {
      return this.translateService.get('forms').pipe(
        map((messages) => {
          let stringHtml = '';
          const getMessageString = (text: string): string => `<span class="d-block">${text}</span>`;
          if (control.errors && Object.keys(control.errors)) {
            if (control.errors.required) {
              stringHtml += getMessageString(messages.validators.requiredField);
            }
            if (control.errors.pattern) {
              stringHtml += getMessageString(messages.validators.invalidPattern);
            }
            if (isName && control.errors.pattern) {
              stringHtml += `<span class="d-block text-pre">${messages.fieldsList.validators.allowedFieldNamePattern}</span>`;
            }
            if (control.errors.nameIsForbidden) {
              stringHtml += getMessageString(messages.validators.nameExists);
            }
          }
          return stringHtml;
        }),
      );
    };
  }
}
