import { Action } from '@ngrx/store';

export enum StreamSchemaActionTypes {
  GET_SCHEMA_FIELDS = '[Streams] Get Schema Fields',
  CLEAR_SCHEMA_FIELDS = '[Streams] Clear Schema Fields',
  // SET_SCHEMA_FIELDS = '[Streams] Set Schema Fields',
}

export class GetSchemaFields implements Action {
  readonly type = StreamSchemaActionTypes.GET_SCHEMA_FIELDS;

  constructor(public payload: {
    selectedRowIsEnum: boolean,
    selectedRowFields: { name: string, type: string }[],
    selectedRowName: string,
  }) { }
}

export class ClearSchemaFields implements Action {
  readonly type = StreamSchemaActionTypes.CLEAR_SCHEMA_FIELDS;
}

export type StreamSchemaActions = GetSchemaFields |
ClearSchemaFields;
