import { Action }             from '@ngrx/store';
import { SchemaTypeModel }    from '../../../../shared/models/schema.type.model';
import { StreamDetailsModel } from '../../models/stream.details.model';
import { TabModel }           from '../../models/tab.model';

export enum StreamDetailsActionTypes {
  SUBSCRIBE_TAB_CHANGES = '[StreamDetails] Subscribe to Tab Changes',

  GET_SCHEMA = '[StreamDetails] Get Schema',
  SET_SCHEMA = '[StreamDetails] Set Schema',

  CLEAN_STREAM_DATA = '[StreamDetails] Clean Stream Data',

  GET_STREAM_DATA = '[StreamDetails] Get Stream Data',
  SET_STREAM_DATA = '[StreamDetails] Set Stream Data',
  ADD_STREAM_DATA = '[StreamDetails] Add Stream Data',

  GET_SYMBOLS = '[StreamDetails] Get Symbols',
  SET_SYMBOLS = '[StreamDetails] Set Symbols',

  GET_STREAM_RANGE = '[StreamDetails] Get Stream Range',
  SET_STREAM_RANGE = '[StreamDetails] Set Stream Range',

  SAVE_GLOBAL_FILTER_STATE = '[StreamDetails] Save Global Filter State',
  SET_GLOBAL_FILTER_STATE = '[StreamDetails] Set Global Filter State',
  CLEAR_GLOBAL_FILTER_STATE = '[StreamDetails] Clear Global Filter State',

  ADD_ERROR_MESSAGE = '[StreamDetails] Add Error Message',
  REMOVE_ERROR_MESSAGE = '[StreamDetails] Remove Error Message',

  STOP_SUBSCRIPTIONS = '[StreamDetails] Stop Subscriptions',

}

export class StopSubscriptions implements Action {
  readonly type = StreamDetailsActionTypes.STOP_SUBSCRIPTIONS;
}

export class SubscribeTabChanges implements Action {
  readonly type = StreamDetailsActionTypes.SUBSCRIBE_TAB_CHANGES;
}

export class GetSchema implements Action {
  readonly type = StreamDetailsActionTypes.GET_SCHEMA;

  constructor(public payload: {
    streamId: string,
  }) { }
}

export class SetSchema implements Action {
  readonly type = StreamDetailsActionTypes.SET_SCHEMA;

  constructor(public payload: {
    schema: SchemaTypeModel[],
    schemaAll: SchemaTypeModel[],
  }) { }
}


export class CleanStreamData implements Action {
  readonly type = StreamDetailsActionTypes.CLEAN_STREAM_DATA;
}

export class GetStreamData implements Action {
  readonly type = StreamDetailsActionTypes.GET_STREAM_DATA;

  constructor(public payload: {
    activeTab: TabModel,
  }) { }
}

export class SetStreamData implements Action {
  readonly type = StreamDetailsActionTypes.SET_STREAM_DATA;

  constructor(public payload: {
    streamData: StreamDetailsModel[],
  }) { }
}

export class AddStreamData implements Action {
  readonly type = StreamDetailsActionTypes.ADD_STREAM_DATA;

  constructor(public payload: {
    streamData: [],
  }) { }
}

export class SaveGlobalFilterState implements Action {
  readonly type = StreamDetailsActionTypes.SAVE_GLOBAL_FILTER_STATE;

  constructor(public payload: {
    global_filter: {
      filter_date_format: string[];
      filter_time_format: string[];
      filter_timezone: any;
    },
  }) { }
}

export class SetGlobalFilterState implements Action {
  readonly type = StreamDetailsActionTypes.SET_GLOBAL_FILTER_STATE;

  // constructor(public payload: string) { }
}

export class ClearGlobalFilterState implements Action {
  readonly type = StreamDetailsActionTypes.CLEAR_GLOBAL_FILTER_STATE;
}

export class AddErrorMessage implements Action {
  readonly type = StreamDetailsActionTypes.ADD_ERROR_MESSAGE;

  constructor(public payload: {
    message: string,
  }) { }
}

export class RemoveErrorMessage implements Action {
  readonly type = StreamDetailsActionTypes.REMOVE_ERROR_MESSAGE;
}

export class GetSymbols implements Action {
  readonly type = StreamDetailsActionTypes.GET_SYMBOLS;

  constructor(public payload: {
    streamId: string,
    spaceId?: string,
  }) { }
}

export class SetSymbols implements Action {
  readonly type = StreamDetailsActionTypes.SET_SYMBOLS;

  constructor(public payload: {
    symbols: string[],
  }) { }
}

export class GetStreamRange implements Action {
  readonly type = StreamDetailsActionTypes.GET_STREAM_RANGE;

  constructor(public payload: {
    streamId: string,
    symbol?: string,
    spaceName?: string,
  }) { }
}

export class SetStreamRange implements Action {
  readonly type = StreamDetailsActionTypes.SET_STREAM_RANGE;

  constructor(public payload: {
    streamRange: {
      end: string,
      start: string,
    },
  }) { }
}


export type StreamDetailsActions =
  StopSubscriptions |
  SubscribeTabChanges |
  CleanStreamData |
  GetSchema |
  SetSchema |
  GetStreamData |
  SetStreamData |
  AddStreamData |
  SaveGlobalFilterState |
  SetGlobalFilterState |
  ClearGlobalFilterState |
  GetSymbols |
  SetSymbols |
  AddErrorMessage |
  RemoveErrorMessage |

  GetStreamRange |
  SetStreamRange;
