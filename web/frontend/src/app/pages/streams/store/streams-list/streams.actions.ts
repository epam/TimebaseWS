import {Action} from '@ngrx/store';
import {StreamDescribeModel} from '../../models/stream.describe.model';
import {StreamDetailsModel} from '../../models/stream.details.model';
import {SpaceModel, StreamModel} from '../../models/stream.model';
import {StreamsStateModel} from '../../models/streams.state.model';

export enum StreamsActionTypes {
  GET_STREAMS = '[Streams] Get Streams',
  SET_STREAMS = '[Streams] Set Streams',

  GET_SYMBOLS = '[Streams] Get Symbols',
  SET_SYMBOLS = '[Streams] Set Symbols',
  GET_SPACES = '[Streams] Get Spaces',
  SET_SPACES = '[Streams] Set Spaces',

  SHOW_STREAM_SPACES = '[Streams] Show Stream Spaces',
  SHOW_STREAM_SYMBOLS = '[Streams] Show Stream Symbols',
  SET_STREAM_STATE = '[Streams] Set Stream State',
  SET_NAVIGATION_STATE = '[Streams] Set Navigation State',

  GET_STREAMS_SEARCH = '[Streams] Get Streams Search',

  PURGE_STREAM = '[Streams] Purge Stream',
  TRUNCATE_STREAM = '[Streams] Truncate Stream',
  ASK_TO_DELETE_STREAM = '[Streams] Ask to delete Stream',
  DELETE_STREAM = '[Streams] Delete Stream',
  CLOSE_MODAL = '[Streams] Close Modal',

  ADD_STREAM_STATES_SUBSCRIPTION = '[Streams] Add stream states subscription',
  SET_STREAM_STATES_SUBSCRIPTION = '[Streams] Set stream states subscription',
  STOP_STREAM_STATES_SUBSCRIPTION = '[Streams] Stop stream states subscription',

  DOWNLOAD_QSMSG_FILE = '[Streams] Download QSMSG file',

  ASK_TO_RENAME_STREAM = '[Streams] Ask to rename Stream',
  ASK_TO_RENAME_SYMBOL = '[Streams] Ask to rename Symbol',
  RENAME_STREAM = '[Streams] Rename Stream',
  RENAME_SYMBOL = '[Streams] Rename Symbol',

  GET_STREAM_DESCRIBE = '[Streams] Get Stream Describe',
  SET_STREAM_DESCRIBE = '[Streams] Set Stream Describe',

  SEND_MESSAGE = '[Streams] Send Message',
}

export class CloseModal implements Action {
  readonly type = StreamsActionTypes.CLOSE_MODAL;

  constructor() {}
}

export class GetStreams implements Action {
  readonly type = StreamsActionTypes.GET_STREAMS;

  constructor(
    public payload: {
      props?: {
        _filter?: string;
        _spaces?: boolean;
      };
    },
  ) {}
}

export class SetStreams implements Action {
  readonly type = StreamsActionTypes.SET_STREAMS;

  constructor(
    public payload: {
      streams: StreamModel[];
    },
  ) {}
}

export class GetSymbols implements Action {
  readonly type = StreamsActionTypes.GET_SYMBOLS;

  constructor(
    public payload: {
      streamKey: string;
      spaceName?: string;
      props?: {
        _filter?: string;
      };
    },
  ) {}
}

export class SetSymbols implements Action {
  readonly type = StreamsActionTypes.SET_SYMBOLS;

  constructor(
    public payload: {
      symbols: string[];
      streamKey: string;
      spaceName?: string;
    },
  ) {}
}

export class GetSpaces implements Action {
  readonly type = StreamsActionTypes.GET_SPACES;

  constructor(
    public payload: {
      streamKey: string;
      props?: {
        _filter?: string;
      };
    },
  ) {}
}

export class SetSpaces implements Action {
  readonly type = StreamsActionTypes.SET_SPACES;

  constructor(
    public payload: {
      spaces: SpaceModel[];
      streamKey: string;
    },
  ) {}
}

export class ShowStreamSpaces implements Action {
  readonly type = StreamsActionTypes.SHOW_STREAM_SPACES;

  constructor(
    public payload: {
      stream: StreamModel;
      props?: {
        _filter?: string;
      };
    },
  ) {}
}

export class ShowStreamSymbols implements Action {
  readonly type = StreamsActionTypes.SHOW_STREAM_SYMBOLS;

  constructor(
    public payload: {
      stream: StreamModel;
      spaceName?: string;
      props?: {
        _filter?: string;
      };
    },
  ) {}
}

export class SetStreamState implements Action {
  readonly type = StreamsActionTypes.SET_STREAM_STATE;

  constructor(
    public payload: {
      stream: StreamModel;
      spaceName?: string;
      props: {
        _active?: boolean;
        _shown?: boolean;
      };
    },
  ) {}
}

export class SetNavigationState implements Action {
  readonly type = StreamsActionTypes.SET_NAVIGATION_STATE;

  constructor(
    public payload: {
      _openNewTab?: boolean;
      _showSpaces?: boolean;
    },
  ) {}
}

export class TruncateStream implements Action {
  readonly type = StreamsActionTypes.TRUNCATE_STREAM;

  constructor(
    public payload: {
      streamKey: string;
      params: {
        symbols?: string[];
        timestamp: number;
      };
    },
  ) {}
}

export class PurgeStream implements Action {
  readonly type = StreamsActionTypes.PURGE_STREAM;

  constructor(
    public payload: {
      streamKey: string;
      params: {
        timestamp: number;
      };
    },
  ) {}
}

export class AskToDeleteStream implements Action {
  readonly type = StreamsActionTypes.ASK_TO_DELETE_STREAM;

  constructor(
    public payload: {
      streamKey: string;
      spaceName?: string;
    },
  ) {}
}

export class DeleteStream implements Action {
  readonly type = StreamsActionTypes.DELETE_STREAM;

  constructor(
    public payload: {
      streamKey: string;
      spaceName?: string;
    },
  ) {}
}

export class AddStreamStatesSubscription implements Action {
  readonly type = StreamsActionTypes.ADD_STREAM_STATES_SUBSCRIPTION;
}

export class SetStreamStatesSubscription implements Action {
  readonly type = StreamsActionTypes.SET_STREAM_STATES_SUBSCRIPTION;

  constructor(
    public payload: {
      dbState: StreamsStateModel;
    },
  ) {}
}

export class StopStreamStatesSubscription implements Action {
  readonly type = StreamsActionTypes.STOP_STREAM_STATES_SUBSCRIPTION;
}

export class DownloadQSMSGFile implements Action {
  readonly type = StreamsActionTypes.DOWNLOAD_QSMSG_FILE;

  constructor(
    public payload: {
      streamId: string;
    },
  ) {}
}

export class AskToRenameStream implements Action {
  readonly type = StreamsActionTypes.ASK_TO_RENAME_STREAM;

  constructor(
    public payload: {
      streamId: string;
      newName: string;
      spaceName?: string;
    },
  ) {}
}

export class AskToRenameSymbol implements Action {
  readonly type = StreamsActionTypes.ASK_TO_RENAME_SYMBOL;

  constructor(
    public payload: {
      streamId: string;
      oldSymbolName: string;
      newSymbolName: string;
      spaceName?: string;
    },
  ) {}
}

export class RenameStream implements Action {
  readonly type = StreamsActionTypes.RENAME_STREAM;

  constructor(
    public payload: {
      streamId: string;
      newName: string;
      spaceName?: string;
    },
  ) {}
}

export class RenameSymbol implements Action {
  readonly type = StreamsActionTypes.RENAME_SYMBOL;

  constructor(
    public payload: {
      streamId: string;
      oldSymbolName: string;
      newSymbolName: string;
    },
  ) {}
}

export class GetStreamDescribe implements Action {
  readonly type = StreamsActionTypes.GET_STREAM_DESCRIBE;

  constructor(
    public payload: {
      streamId: string;
    },
  ) {}
}

export class SetStreamDescribe implements Action {
  readonly type = StreamsActionTypes.SET_STREAM_DESCRIBE;

  constructor(
    public payload: {
      describe: StreamDescribeModel | null;
    },
  ) {}
}

export class SendMessage implements Action {
  readonly type = StreamsActionTypes.SEND_MESSAGE;

  constructor(
    public payload: {
      messages: StreamDetailsModel[];
      writeMode: string;
      streamId: string;
    },
  ) {}
}

export type StreamsActions =
  | CloseModal
  | GetStreams
  | SetStreams
  | GetSymbols
  | SetSymbols
  | GetSpaces
  | SetSpaces
  | ShowStreamSpaces
  | ShowStreamSymbols
  | SetStreamState
  | SetNavigationState
  | TruncateStream
  | PurgeStream
  | AddStreamStatesSubscription
  | SetStreamStatesSubscription
  | StopStreamStatesSubscription
  | DownloadQSMSGFile
  | AskToDeleteStream
  | DeleteStream
  | RenameStream
  | RenameSymbol
  | AskToRenameStream
  | AskToRenameSymbol
  | GetStreamDescribe
  | SetStreamDescribe
  | SendMessage;
