import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {select, Store} from '@ngrx/store';
import {TranslateService} from '@ngx-translate/core';
import {filter, map, mergeMap, switchMap, take, tap, withLatestFrom} from 'rxjs/operators';
import * as NotificationsActions from '../../../../../core/modules/notifications/store/notifications.actions';
import {AppState} from '../../../../../core/store';
import {
  DefaultTypeModel,
  SchemaClassTypeModel,
} from '../../../../../shared/models/schema.class.type.model';
import * as StreamsTabsActions from '../../../store/streams-tabs/streams-tabs.actions';
import {getActiveTab} from '../../../store/streams-tabs/streams-tabs.selectors';
import {StreamMetaDataChangeModel} from '../models/stream.meta.data.change.model';
import {
  CreateStream,
  GetDefaultTypes,
  GetSchema,
  GetSchemaDiff,
  RemoveSchemaItems,
  RemoveSelectedSchemaItem,
  SaveSchemaChanges,
  SetDefaultTypes,
  SetSchema,
  SetSchemaDiff,
  UpdateSchemaAndRemoveType,
} from './schema-editor.actions';
import {State} from './schema-editor.reducer';
import {
  getDiffData,
  getEditSchemaState,
  getSaveSchemaData,
  getStreamId,
} from './schema-editor.selectors';
import { TopicService } from '../services/topic.service';
import { of } from 'rxjs';
import { SchemaEditorService } from '../services/schema-editor.service';
import { SchemaValidityService } from '../services/schema-validity.service';

@Injectable()
export class SchemaEditorEffects {
  getDefaultTypes = createEffect(() =>
    this.actions$.pipe(
      ofType(GetDefaultTypes),
      switchMap(() =>
        this.httpClient$.get<
          DefaultTypeModel[] /*{types: SchemaClassTypeModel[], all: SchemaClassTypeModel[]}*/
        >(`/datatypes`),
      ),
      map((defaultTypes) => SetDefaultTypes({defaultTypes})),
    ),
  );
  getSchema = createEffect(() =>
    this.actions$.pipe(
      ofType(GetSchema),
      switchMap(({ topic, streamKey }) =>
        streamKey ? of({ streamId: streamKey, topic }) :
          this.appStore.pipe(
            select(getStreamId),
            filter((streamId) => !!streamId),
            take(1),
            map(streamId => ({ streamId, topic }))
          ),
      ),
      switchMap(({ streamId, topic }) => {
        if (!topic) {
          return this.httpClient$.get<{types: SchemaClassTypeModel[]; all: SchemaClassTypeModel[]}>(
            `${encodeURIComponent(streamId)}/schema`,
            {
              params: {
                tree: 'true',
              },
            },
          )
        } else { 
          return this.topicService.getTopicSchema(streamId);
        }
      }),
      map((schema) => SetSchema({ schema })),
    ),
  );
  getSchemaDiff = createEffect(() =>
    this.actions$.pipe(
      ofType(GetSchemaDiff),
      switchMap(() =>
        this.appStore.pipe(
          select(getDiffData),
          filter(([state, streamId]) => !!streamId),
          take(1),
        ),
      ),
      switchMap(([state, streamId]: [State, string]) => {
        const all = JSON.parse(JSON.stringify([...state.classes, ...state.enums])),
          types = all.filter((_type) => _type._props && _type._props._isUsed),
          schemaMapping = {...state.schemaMapping};

        all.forEach((_type) => {
          delete _type._props;

          if (_type.fields) {
            _type.fields.forEach((_field) => {
              delete _field._props;
            });
          }
        });
        types.forEach((_type) => {
          delete _type._props;

          if (_type.fields) {
            _type.fields.forEach((_field) => {
              delete _field._props;
            });
          }
        });
        return this.httpClient$.post<StreamMetaDataChangeModel>(
          `/${encodeURIComponent(streamId)}/getSchemaChanges`,
          {
            schema: {
              types,
              all,
            },
            schemaMapping,
          },
        );
      }),
      map((diff) => SetSchemaDiff({diff})),
    ),
  );
  createStream = createEffect(() =>
    this.actions$.pipe(
      ofType(CreateStream),
      withLatestFrom(this.appStore.pipe(select(getEditSchemaState))),
      switchMap(([{key, topic, copyToStream, version, distributionFactor, noNotification}, state]) => {
        const all = JSON.parse(JSON.stringify([...state.classes, ...state.enums])),
          types = all.filter((_type) => _type._props && _type._props._isUsed);
        all.forEach((_type) => {
          delete _type._props;

          if (_type.fields) {
            _type.fields.forEach((_field) => {
              delete _field._props;
            });
          }
        });
        types.forEach((_type) => {
          delete _type._props;

          if (_type.fields) {
            _type.fields.forEach((_field) => {
              delete _field._props;
            });
          }
        });
        console.warn('CREATE STREAM DATA:', {
          types,
          all,
        }); 
        if (topic) {
          const params = {
            key,
            schema: { types, all },
            copyToStream,
            version,
            distributionFactor
          };
          if (!params.distributionFactor) {
            delete params.distributionFactor;
          }
          if (!version) {
            delete params.version;
          }
          return this.httpClient$.post( '/topics', params).pipe(map(() => ({ topic, noNotification })));
        } else {
          const params = {
            key,
            version,
            distributionFactor
          };
          if (!params.distributionFactor) {
            delete params.distributionFactor;
          }
          return this.httpClient$.post(
            `/createStream`,
            {
              types,
              all,
            },
            {
              params
            },
          ).pipe(map(() => ({ topic, noNotification })));
        }
      }),
      // tap((resp) => console.warn('SUCCESS CREATE STREAM RESPONSE: ', resp)), // TODO: Delete this before checkIN
      tap(() => this.schemaEditorService.streamCreated$.next()),
      switchMap(({ topic, noNotification }) => noNotification ? of(null) : this.translate.get('text.streamOrTopicCreated', { streamOrTopic: topic ? 'Topic' : 'Stream' })),
      withLatestFrom(this.appStore.pipe(select(getActiveTab))),
      mergeMap(([message, activeTab]) => {
         const actions: any[] = [
          new StreamsTabsActions.RemoveTab({
            tab: activeTab,
          })
        ];
        if (message) {
          actions.push(
            new NotificationsActions.AddNotification({
              message: message,
              dismissible: true,
              closeInterval: 2000,
              type: 'success',
            })
          )
        };
        return actions;
      }),
    ),
  );
  saveSchemaChanges = createEffect(() =>
    this.actions$.pipe(
      ofType(SaveSchemaChanges),
      tap(() => getSaveSchemaData.release()),
      withLatestFrom(this.appStore.pipe(select(getSaveSchemaData))),
      switchMap(
        ([action, {schemaMapping, classes, enums, defaultValues, streamId, dropValues}]) => {
          const all = JSON.parse(JSON.stringify([...classes, ...enums])),
            types = all.filter((_type) => _type._props && _type._props._isUsed);
          all.forEach((_type) => {
            delete _type._props;

            if (_type.fields) {
              _type.fields.forEach((_field) => {
                delete _field._props;
              });
            }
          });
          types.forEach((_type) => {
            delete _type._props;

            if (_type.fields) {
              _type.fields.forEach((_field) => {
                delete _field._props;
              });
            }
          });

          return this.httpClient$
            .post(`/${encodeURIComponent(streamId)}/changeSchema`, {
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
                if (action && action.successAction && typeof action.successAction === 'function')
                  action.successAction();
              }),
            );
        },
      ),
      tap((resp) => console.warn('SUCCESS CHANGE STREAM SCHEMA RESPONSE: ', resp)), // TODO: Delete this before checkIN
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

  UpdateSchemaAndRemoveType = createEffect(() =>
    this.actions$.pipe(
      ofType(UpdateSchemaAndRemoveType),
      withLatestFrom(this.appStore.pipe(select(getSaveSchemaData))),
      mergeMap(([{ deletingItems, insideModal }, { classes, enums }]) => {
        if (!deletingItems?.length) {
          const selectedItem = [...classes, ...enums].find((type) => type._props && type._props._isSelected);
          if (selectedItem.isEnum) {
            classes.forEach(type => {
              type.fields = type.fields
                .map(field => {
                  if (field.type.name === selectedItem.name) {
                    this.schemaValidityService.setErrorOnField(type, field, insideModal);
                  }
                  if (field.type.elementType && field.type.elementType?.name === selectedItem.name) {
                    this.schemaValidityService.setErrorOnField(type, field, insideModal);
                  }
                  return field;
                });
              });
          } 
          return [RemoveSelectedSchemaItem()];
        } else {
          const deletingEnumSet = new Set<string>();
          
          deletingItems.forEach(item => {
            if (item.isEnum) {
              deletingEnumSet.add(item.name);
            }
          });

          classes.forEach(type => {
            type.fields = type.fields
              .map(field => {
                if (deletingEnumSet.has(field.type.name)) {
                  this.schemaValidityService.setErrorOnField(type, field, insideModal);
                }
                if (field.type.elementType && deletingEnumSet.has(field.type.elementType?.name)) {
                  this.schemaValidityService.setErrorOnField(type, field, insideModal);
                }
                return field;
              });
          });
          return [RemoveSchemaItems({ deletingItems })];
          }
        },
      ),
    ),
  );

  constructor(
    private actions$: Actions,
    private appStore: Store<AppState>,
    private httpClient$: HttpClient,
    private translate: TranslateService,
    private topicService: TopicService,
    private schemaEditorService: SchemaEditorService,
    private schemaValidityService: SchemaValidityService
  ) {}
}