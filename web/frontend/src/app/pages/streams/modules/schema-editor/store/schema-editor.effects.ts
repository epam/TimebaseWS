import { HttpClient }                                                      from '@angular/common/http';
import { Injectable }                                                      from '@angular/core';
import { Actions, createEffect, ofType }                                   from '@ngrx/effects';
import { select, Store }                                                   from '@ngrx/store';
import { TranslateService }                                                from '@ngx-translate/core';
import { filter, map, mergeMap, switchMap, take, tap, withLatestFrom }     from 'rxjs/operators';
import * as NotificationsActions
                                                                           from '../../../../../core/modules/notifications/store/notifications.actions';
import { AppState }                                                        from '../../../../../core/store';
import {
  DefaultTypeModel,
  SchemaClassTypeModel,
}                                                                          from '../../../../../shared/models/schema.class.type.model';
import * as StreamsTabsActions
                                                                           from '../../../store/streams-tabs/streams-tabs.actions';
import { getActiveTab }                                                    from '../../../store/streams-tabs/streams-tabs.selectors';
import { StreamMetaDataChangeModel }                                       from '../models/stream.meta.data.change.model';
import {
  CreateStream,
  GetDefaultTypes,
  GetSchema,
  GetSchemaDiff,
  SaveSchemaChanges,
  SetDefaultTypes,
  SetSchema,
  SetSchemaDiff,
}                                                                          from './schema-editor.actions';
import { State }                                                           from './schema-editor.reducer';
import { getDiffData, getEditSchemaState, getSaveSchemaData, getStreamId } from './schema-editor.selectors';


@Injectable()
export class SchemaEditorEffects {


  constructor(
    private actions$: Actions,
    private appStore: Store<AppState>,
    private httpClient$: HttpClient,
    private translate: TranslateService,
  ) {}


  getDefaultTypes = createEffect(() =>
    this.actions$.pipe(
      ofType(GetDefaultTypes),
      switchMap(() => this.httpClient$
        .get<DefaultTypeModel[]/*{types: SchemaClassTypeModel[], all: SchemaClassTypeModel[]}*/>(`/datatypes`),
      ),
      map(defaultTypes => SetDefaultTypes({defaultTypes})),
    ),
  );

  getSchema = createEffect(() =>
    this.actions$.pipe(
      ofType(GetSchema),
      switchMap(() => this.appStore
        .pipe(
          select(getStreamId),
          filter(streamId => !!streamId),
          take(1),
        )),
      switchMap((streamId: string) => this.httpClient$
        .get<{ types: SchemaClassTypeModel[], all: SchemaClassTypeModel[] }>(`${encodeURIComponent(streamId)}/schema`, {
          params: {
            'tree': 'true',
          },
        }),
      ),
      map(schema => SetSchema({schema})),
    ),
  );

  getSchemaDiff = createEffect(() =>
    this.actions$.pipe(
      ofType(GetSchemaDiff),
      switchMap(() => this.appStore
        .pipe(
          select(getDiffData),
          filter(([state, streamId]) => !!streamId),
          take(1),
        ),
      ),
      switchMap(([state, streamId]: [State, string]) => {
        const all = JSON.parse(JSON.stringify([...state.classes, ...state.enums])),
          types = all.filter(_type => _type._props && _type._props._isUsed),
          schemaMapping = {...state.schemaMapping};
        all.forEach(_type => {
          delete _type._props;

          if (_type.fields) {
            _type.fields.forEach(_field => {
              delete _field._props;
            });
          }
        });
        types.forEach(_type => {
          delete _type._props;

          if (_type.fields) {
            _type.fields.forEach(_field => {
              delete _field._props;
            });
          }
        });
        return this.httpClient$
          .post<StreamMetaDataChangeModel>(`/${encodeURIComponent(streamId)}/getSchemaChanges`, {
            schema: {
              types,
              all,
            },
            schemaMapping,
          });
      }),
      map(diff => SetSchemaDiff({diff})),
    ),
  );

  createStream = createEffect(() =>
    this.actions$.pipe(
      ofType(CreateStream),
      withLatestFrom(this.appStore.pipe(select(getEditSchemaState))),
      switchMap(([{key}, state]) => {
        const all = JSON.parse(JSON.stringify([...state.classes, ...state.enums])),
          types = all.filter(_type => _type._props && _type._props._isUsed);
        all.forEach(_type => {
          delete _type._props;

          if (_type.fields) {
            _type.fields.forEach(_field => {
              delete _field._props;
            });
          }
        });
        types.forEach(_type => {
          delete _type._props;

          if (_type.fields) {
            _type.fields.forEach(_field => {
              delete _field._props;
            });
          }
        });
        console.warn('CREATE STREAM DATA:', {
          types,
          all,
        }); // TODO: Delete this before checkIN
        return this.httpClient$.post(`/createStream`, {
          types,
          all,
        }, {
          params: {
            key,
          },
        });
      }),
      tap(resp => console.warn('SUCCESS CREATE STREAM RESPONSE: ', resp)), // TODO: Delete this before checkIN
      switchMap(() => this.translate.get('text.streamCreated')),
      withLatestFrom(this.appStore.pipe(select(getActiveTab))),
      mergeMap(([message, activeTab]) => {

        return [
          new StreamsTabsActions.RemoveTab({
            tab: activeTab,
          }),
          new NotificationsActions.AddNotification({
            message: message,
            dismissible: true,
            closeInterval: 2000,
            type: 'success',
          }),
        ];
      }),
    ),
  );

  saveSchemaChanges = createEffect(() =>
    this.actions$.pipe(
      ofType(SaveSchemaChanges),
      tap(() => getSaveSchemaData.release()),
      withLatestFrom(this.appStore.pipe(select(getSaveSchemaData))),
      switchMap(([action, {schemaMapping, classes, enums, defaultValues, streamId, dropValues}]) => {

        const all = JSON.parse(JSON.stringify([...classes, ...enums])),
          types = all.filter(_type => _type._props && _type._props._isUsed);
        all.forEach(_type => {
          delete _type._props;

          if (_type.fields) {
            _type.fields.forEach(_field => {
              delete _field._props;
            });
          }
        });
        types.forEach(_type => {
          delete _type._props;

          if (_type.fields) {
            _type.fields.forEach(_field => {
              delete _field._props;
            });
          }
        });

        return this.httpClient$.post(`/${encodeURIComponent(streamId)}/changeSchema`, {
            schemaMapping,
            defaultValues,
            dropValues,
            schema: {
              all,
              types,
            },
            background: action.background,
          })
          .pipe(
            tap(() => {
              if (action && action.successAction && typeof action.successAction === 'function') action.successAction();
            }),
          );
      }),
      tap(resp => console.warn('SUCCESS CHANGE STREAM SCHEMA RESPONSE: ', resp)), // TODO: Delete this before checkIN
      switchMap(() => this.translate.get('text.streamSchemaChanged')),
      withLatestFrom(this.appStore.pipe(select(getActiveTab))),
      mergeMap(([message, activeTab]) => {

        return [
          new StreamsTabsActions.RemoveTab({
            tab: activeTab,
          }),
          new NotificationsActions.AddNotification({
            message: message,
            dismissible: true,
            closeInterval: 2000,
            type: 'success',
          }),
        ];
      }),
    ),
  );
}
