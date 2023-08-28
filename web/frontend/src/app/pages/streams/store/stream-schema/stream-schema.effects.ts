import {Injectable} from '@angular/core';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {share} from 'rxjs/operators';
import * as StreamSchemaActions from './stream-schema.actions';
import {StreamSchemaActionTypes} from './stream-schema.actions';

@Injectable()
export class StreamSchemaEffects {
   getSchemaFields = createEffect(() => this.actions$.pipe(
    ofType<StreamSchemaActions.GetSchemaFields>(StreamSchemaActionTypes.GET_SCHEMA_FIELDS),
    share(),
  ), {dispatch: false});
   clearSchemaFields = createEffect(() => this.actions$.pipe(
    ofType<StreamSchemaActions.ClearSchemaFields>(StreamSchemaActionTypes.CLEAR_SCHEMA_FIELDS),
    share(),
  ), {dispatch: false});

  constructor(private actions$: Actions) {}
}
