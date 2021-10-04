import { Action }             from '@ngrx/store';
import { StreamQueryModel }   from '../../models/query.model';
import { StreamDetailsModel } from '../../models/stream.details.model';

export enum StreamQueryActionTypes {
  GET_STREAMS_QUERY = '[Streams:Query] Get Streams Query',
  SET_STREAMS_QUERY = '[Streams:Query] Set Streams Query',
  GET_STREAMS_QUERY_DESCRIBE = '[Streams:Query] Get Streams Query Describe',
  CLEAR_STREAMS_QUERY = '[Streams:Query] Clear Streams Query',
  HIDE_LOADER = '[Streams:Query] Hide Loader',
}


export class GetStreamsQuery implements Action {
  readonly type = StreamQueryActionTypes.GET_STREAMS_QUERY;

  constructor(public payload: {
    query: StreamQueryModel;
  }) { }
}

export class SetStreamsQuery implements Action {
  readonly type = StreamQueryActionTypes.SET_STREAMS_QUERY;

  constructor(public payload: {
    queryStreams: StreamDetailsModel[],
  }) { }
}


export class GetStreamsQueryDescribe implements Action {
  readonly type = StreamQueryActionTypes.GET_STREAMS_QUERY_DESCRIBE;

  constructor(public payload: {
    query: string;
  }) { }
}


export class ClearStreamsQuery implements Action {
  readonly type = StreamQueryActionTypes.CLEAR_STREAMS_QUERY;
}

export class HideLoader implements Action {
  readonly type = StreamQueryActionTypes.HIDE_LOADER;
}

export type StreamQueryActions =
  GetStreamsQuery |
  SetStreamsQuery |
  GetStreamsQueryDescribe |
  ClearStreamsQuery |
  HideLoader;
