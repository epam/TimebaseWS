import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { share } from 'rxjs/operators';
import * as StreamSchemaActions
  from './stream-schema.actions';
import { StreamSchemaActionTypes } from './stream-schema.actions';


@Injectable()
export class StreamSchemaEffects {
  @Effect({ dispatch: false }) getSchemaFields = this.actions$
    .pipe(
      ofType<StreamSchemaActions.GetSchemaFields>(StreamSchemaActionTypes.GET_SCHEMA_FIELDS),
      share(),
    );
    @Effect({ dispatch: false }) clearSchemaFields = this.actions$
    .pipe(
      ofType<StreamSchemaActions.ClearSchemaFields>(StreamSchemaActionTypes.CLEAR_SCHEMA_FIELDS),
      share(),
    );



  constructor(private actions$: Actions) {}

}
