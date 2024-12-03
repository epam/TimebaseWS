import { Injectable } from '@angular/core';
import { SchemaClassFieldModel, SchemaClassTypeModel } from 'src/app/shared/models/schema.class.type.model';

@Injectable({
  providedIn: 'root',
})
export class SchemaValidityService {

  private hasError: { 
    modal: { [key: string]: boolean }, 
    tab: { [key: string]: boolean } } = { modal: {}, tab: {} };

  showErrorOnField(type: SchemaClassTypeModel, field: SchemaClassFieldModel, insideModal: boolean) {
    const key = this.key(type._props._uuid, field._props._uuid);
    return this.hasError[insideModal ? 'modal' : 'tab'][key];
  }

  showErrorOnType(type: SchemaClassTypeModel, insideModal: boolean) {
    return type?.fields.some((field) => this.showErrorOnField(type, field, insideModal));
  }

  setErrorOnField(type: SchemaClassTypeModel, field: SchemaClassFieldModel, insideModal: boolean) {
    const key = this.key(type._props._uuid, field._props._uuid);
    this.hasError[insideModal ? 'modal' : 'tab'][key] = true;
  }

  removeErrorOnField(type: SchemaClassTypeModel, field: SchemaClassFieldModel, insideModal: boolean) {
    const key = this.key(type._props._uuid, field._props._uuid);
    this.hasError[insideModal ? 'modal' : 'tab'][key] = false;
  }

  clearAllErrors(insideModal: boolean) {
    this.hasError[insideModal ? 'modal' : 'tab'] = {};
  }

  hasAnyError(insideModal: boolean) {
    return Object.values(this.hasError[insideModal ? 'modal' : 'tab']).some(Boolean);
  }

  private key(typeName: string, name: string): string {
    return `${typeName}:${name}`;
  }
}