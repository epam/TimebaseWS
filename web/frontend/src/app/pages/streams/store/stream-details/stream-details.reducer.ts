import { Action }                                                      from '@ngrx/store';
import { AppState }                                                    from '../../../../core/store';
import { DEFAULT_DATE_FORMAT, DEFAULT_TIME_FORMAT, DEFAULT_TIME_ZONE } from '../../../../shared/locale.timezone';
import { SchemaTypeModel }                                             from '../../../../shared/models/schema.type.model';
import { StreamDetailsModel }                                          from '../../models/stream.details.model';
import { StreamDetailsActions, StreamDetailsActionTypes }              from './stream-details.actions';


export interface FeatureState extends AppState {
  streamDetails: State;
}


export interface State {
  schema: SchemaTypeModel[];
  schemaAll: SchemaTypeModel[];
  symbols: string[];
  streamData: StreamDetailsModel[];
  global_filter: {
    filter_date_format: string[];
    filter_time_format: string[];
    filter_timezone: any;
  };
  errorMessage: string;
  streamRange: { end: string, start: string };
}

export const initialState: State = {
  schema: null,
  schemaAll: null,
  symbols: null,
  streamData: null,
  global_filter: {
    filter_date_format: [DEFAULT_DATE_FORMAT],
    filter_time_format: [DEFAULT_TIME_FORMAT],
    filter_timezone: [DEFAULT_TIME_ZONE],
  },
  errorMessage: null,
  streamRange: null,
};


export function reducer(state = initialState, action: Action | StreamDetailsActions): State {
  switch (action.type) {
    case StreamDetailsActionTypes.SET_SCHEMA:
      return {
        ...state,
        schema: action['payload'].schema,
        schemaAll: action['payload'].schemaAll,
      };

    case StreamDetailsActionTypes.SET_SYMBOLS:
      return {
        ...state,
        symbols: action['payload'].symbols,
      };

    case StreamDetailsActionTypes.GET_STREAM_RANGE:
      return {
        ...state,
        streamRange: null,
      };
    case StreamDetailsActionTypes.SET_STREAM_RANGE:
      return {
        ...state,
        streamRange: {...action['payload'].streamRange},
      };

    case StreamDetailsActionTypes.SET_STREAM_DATA:
      return {
        ...state,
        streamData: action['payload'].streamData,
      };

    case StreamDetailsActionTypes.SAVE_GLOBAL_FILTER_STATE:
      const GLOBAL_FILTER = {...action['payload'].global_filter};
      if (!GLOBAL_FILTER.filter_date_format || !GLOBAL_FILTER.filter_date_format.length) {
        GLOBAL_FILTER.filter_date_format = [DEFAULT_DATE_FORMAT];
      }
      if (!GLOBAL_FILTER.filter_time_format || !GLOBAL_FILTER.filter_time_format.length) {
        GLOBAL_FILTER.filter_time_format = [DEFAULT_TIME_FORMAT];
      }
      if (!GLOBAL_FILTER.filter_timezone || !GLOBAL_FILTER.filter_timezone.length) {
        GLOBAL_FILTER.filter_timezone = [DEFAULT_TIME_ZONE];
      }
      return {
        ...state,
        global_filter: GLOBAL_FILTER,
      };

    case StreamDetailsActionTypes.SET_GLOBAL_FILTER_STATE:
      let global_filter = {

        filter_date_format: null,
        filter_time_format: null,
        filter_timezone: null,
      };

      if (localStorage.getItem('global_filter') && localStorage.getItem('global_filter').length) {
        global_filter = JSON.parse(localStorage.getItem('global_filter'));
      }
      // if (!global_filter.filter_timezone) {
      //   global_filter.filter_timezone = getTimeZones()
      //     .map(item => {
      //       return {nameTitle: getTimeZoneTitle(item), name: item.name, offset: item.offset};
      //     })
      //     .find(timezone => timezone.name === Intl.DateTimeFormat().resolvedOptions().timeZone);
      // }
      if (!global_filter.filter_date_format || !global_filter.filter_date_format.length) {
        global_filter.filter_date_format = [DEFAULT_DATE_FORMAT];
      }
      if (!global_filter.filter_time_format || !global_filter.filter_time_format.length) {
        global_filter.filter_time_format = [DEFAULT_TIME_FORMAT];
      }
      if (!global_filter.filter_timezone || !global_filter.filter_timezone.length) {
        global_filter.filter_timezone = [DEFAULT_TIME_ZONE];
      }
      return {
        ...state,
        global_filter: global_filter,
      };

    case StreamDetailsActionTypes.CLEAR_GLOBAL_FILTER_STATE:
      return {
        ...state,
        global_filter: {
          filter_date_format: [DEFAULT_DATE_FORMAT],
          filter_time_format: [DEFAULT_TIME_FORMAT],
          filter_timezone: [DEFAULT_TIME_ZONE],
        },

      };
    case StreamDetailsActionTypes.ADD_ERROR_MESSAGE:
      return {
        ...state,
        errorMessage: action['payload'].message,
      };
    case StreamDetailsActionTypes.REMOVE_ERROR_MESSAGE:
      return {
        ...state,
        errorMessage: null,
      };

    default:
      return state;
  }
}
