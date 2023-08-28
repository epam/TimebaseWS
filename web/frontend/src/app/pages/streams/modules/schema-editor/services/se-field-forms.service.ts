import {Injectable} from '@angular/core';
import {UntypedFormGroup} from '@angular/forms';
import {select, Store} from '@ngrx/store';
import {BehaviorSubject, combineLatest, Observable, Subject} from 'rxjs';
import {distinctUntilChanged, filter, map, take} from 'rxjs/operators';
import {AppState} from '../../../../../core/store';
import {
  SchemaClassFieldModel,
  SchemaClassTypeModel,
} from '../../../../../shared/models/schema.class.type.model';
import {getSelectedFieldProps, getSelectedSchemaItem} from '../store/schema-editor.selectors';

interface SeFieldFormsServiceState {
  lastField: string;
  hasError: {[index: string]: boolean};
  touched: string[];
  hasAnyError: boolean;
  originalFormState: {[index: string]: object};
  formChanged: string[];
  typesHasChanges: string[];
  isTypeFieldsChanged: string[];
  originalFields: {[index: string]: string};
}

@Injectable()
export class SeFieldFormsService {
  private lastField: string;
  private hasError = new Map<string, boolean>();
  private touched = new Set<string>();
  private hasAnyError$ = new BehaviorSubject<boolean>(false);
  private originalFormState = new Map<string, object>();
  private formChanged$ = new BehaviorSubject<Set<string>>(new Set());
  private typesHasChanges$ = new BehaviorSubject<Set<string>>(new Set());
  private isTypeFieldsChanged = new Set<string>();
  private originalFields: Map<string, string> = null;
  private revertForm$ = new Subject<SchemaClassFieldModel>();

  constructor(private appStore: Store<AppState>) {}

  streamChanged() {
    this.lastField = null;
    this.hasError = new Map<string, boolean>();
    this.touched = new Set<string>();
    this.hasAnyError$.next(false);
    this.originalFormState = new Map();
    this.formChanged$.next(new Set());
    this.typesHasChanges$.next(new Set());
    this.isTypeFieldsChanged = new Set();
    this.originalFields = null;
  }

  dumpState(): Observable<SeFieldFormsServiceState> {
    return combineLatest([this.hasAnyError$, this.formChanged$, this.typesHasChanges$]).pipe(
      map(([hasAnyError, formChanged, typesHasChanges]) => {
        return {
          hasAnyError,
          formChanged: [...formChanged],
          typesHasChanges: [...typesHasChanges],
          lastField: this.lastField,
          hasError: this.mapToObject(this.hasError),
          touched: [...this.touched],
          originalFormState: this.mapToObject(this.originalFormState),
          isTypeFieldsChanged: [...this.isTypeFieldsChanged],
          originalFields: this.mapToObject(this.originalFields),
        };
      }),
    );
  }

  restoreFromState(state: SeFieldFormsServiceState) {
    this.lastField = state.lastField;
    this.hasError = this.objectToMap(state.hasError);
    this.touched = new Set(state.touched);
    this.originalFormState = this.objectToMap(state.originalFormState);
    this.isTypeFieldsChanged = new Set(state.isTypeFieldsChanged);
    this.originalFields = this.objectToMap(state.originalFields);
    this.hasAnyError$.next(state.hasAnyError);
    this.formChanged$.next(new Set(state.formChanged));
    this.typesHasChanges$.next(new Set(state.typesHasChanges));
  }

  currentField(): Observable<SchemaClassFieldModel> {
    return this.appStore.pipe(select(getSelectedFieldProps));
  }

  currentKey(nullIfNoField = false): Observable<string> {
    return combineLatest([
      this.currentField(),
      this.appStore.pipe(select(getSelectedSchemaItem)),
    ]).pipe(
      filter(([field, type]) => (!!field || nullIfNoField) && !!type),
      map(([field, type]) => [type._props._uuid, field?._props._uuid]),
      map(([type, field]) => (field ? this.key(type, field) : null)),
      distinctUntilChanged(),
    );
  }

  formGroupChange(form: UntypedFormGroup) {
    this.updateErrorState(form.invalid);
    this.currentKey()
      .pipe(take(1))
      .subscribe((key) => {
        if (!this.originalFormState.get(key)) {
          this.originalFormState.set(key, form.value);
        }
      });
  }

  selectedChange(typeName: string, fieldName: string) {
    const key = this.key(typeName, fieldName);
    if (this.lastField && key !== this.lastField) {
      this.touched.add(this.lastField);
    }
    this.lastField = key;
  }

  formValueChanged(form: UntypedFormGroup) {
    this.updateErrorState(form.invalid);
    this.currentKey()
      .pipe(take(1))
      .subscribe((key) => {
        this.touched.add(key);
        this.setFormChanged(this.formChanged$.value.add(key));
      });
  }

  showErrorOnField(type: SchemaClassTypeModel, field: SchemaClassFieldModel) {
    const key = this.key(type._props._uuid, field._props._uuid);
    return this.touched.has(key) && this.hasError.get(key);
  }

  showErrorOnType(type: SchemaClassTypeModel) {
    return type?.fields.some((field) => this.showErrorOnField(type, field));
  }

  typeFieldsChanged(typeUuid: string, state: boolean) {
    if (state) {
      this.isTypeFieldsChanged.add(typeUuid);
    } else {
      this.isTypeFieldsChanged.delete(typeUuid);
    }
  }

  typesChanged(types: SchemaClassTypeModel[]) {
    const existingKeys = new Set();
    const firstTime = !!(this.originalFields === null && types?.length);
    if (firstTime) {
      this.originalFields = new Map();
    }

    const fieldsToString = (fields: SchemaClassFieldModel[]) => {
      return JSON.stringify(fields.map((f) => f._props._uuid));
    };

    types?.forEach((type) => {
      if (firstTime) {
        this.originalFields.set(type._props._uuid, fieldsToString(type.fields));
      } else {
        const original = this.originalFields.get(type._props._uuid);
        this.typeFieldsChanged(type._props._uuid, original !== fieldsToString(type.fields));
      }

      type.fields.forEach((field) =>
        existingKeys.add(this.key(type._props._uuid, field._props._uuid)),
      );
    });
    const touched = [...this.touched].filter((key) => existingKeys.has(key));
    this.touched = new Set(touched);
    const hasErrorFiltered = [...this.hasError].filter(([key]) => existingKeys.has(key));
    this.hasError = new Map();
    hasErrorFiltered.forEach(([key, value]) => this.hasError.set(key, value));
    this.updateAnyError();
  }

  hasAnyError(): Observable<boolean> {
    return this.hasAnyError$.asObservable();
  }

  typeHasChanges(type: SchemaClassTypeModel) {
    if (!type) {
      return false;
    }

    const uuid = type._props._uuid;
    return this.typesHasChanges$.value.has(uuid) || this.isTypeFieldsChanged.has(uuid);
  }

  fieldHasChanges(field: SchemaClassFieldModel) {
    return this.formChanged$.value.has(this.key(field._props._typeName, field._props._uuid));
  }

  hasChanges(): Observable<boolean> {
    return combineLatest([this.currentKey(), this.formChanged$]).pipe(
      map(([key, formChanges]) => formChanges.has(key)),
    );
  }

  revertForm(): void {
    combineLatest([this.currentKey(), this.currentField()])
      .pipe(take(1))
      .subscribe(([key, field]) => {
        const data = this.originalFormState.get(key);
        this.revertForm$.next(data as SchemaClassFieldModel);

        const changedState = this.formChanged$.value;
        changedState.delete(key);
        this.setFormChanged(changedState);
      });
  }

  onRevertForm(): Observable<SchemaClassFieldModel> {
    return this.revertForm$.asObservable();
  }

  private setFormChanged(keys: Set<string>) {
    const changedTypes = new Set<string>();
    [...keys].forEach((key) => changedTypes.add(key.split(':')[0]));
    this.typesHasChanges$.next(changedTypes);
    this.formChanged$.next(keys);
  }

  private updateErrorState(state: boolean) {
    this.currentKey(true)
      .pipe(take(1))
      .subscribe((key) => {
        if (key === null) {
          return;
        }

        this.hasError.set(key, state);
        this.updateAnyError();
      });
  }

  private updateAnyError() {
    this.hasAnyError$.next(!![...this.hasError].find(([key, value]) => value));
  }

  private key(typeName: string, name: string): string {
    return `${typeName}:${name}`;
  }

  private mapToObject<T>(map: Map<string, T>): {[index: string]: T} {
    const obj = {};
    map?.forEach((value, key) => (obj[key] = value));
    return obj;
  }

  private objectToMap<T>(object: {[index: string]: T}): Map<string, T> {
    const map = new Map();
    Object.keys(object).forEach((key) => map.set(key, object[key]));
    return map;
  }
}
