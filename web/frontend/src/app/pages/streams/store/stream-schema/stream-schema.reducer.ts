import { StreamSchemaActions, StreamSchemaActionTypes } from './stream-schema.actions';
import { AppState }                                     from '../../../../core/store';


export interface FeatureState extends AppState {
  streamSchema: State;
}

export interface State {
  selectedRowIsEnum: boolean;
  selectedRowFields: { name: string, type: string }[];
  selectedRowName: string;

}

export const initialState: State = {
  selectedRowIsEnum: false,
  selectedRowFields: [],
  selectedRowName: '',
};

export function reducer(state = initialState, action: StreamSchemaActions): State {
  switch (action.type) {

    case StreamSchemaActionTypes.GET_SCHEMA_FIELDS:
      return {
        ...state,
        selectedRowIsEnum: action.payload.selectedRowIsEnum,
        selectedRowFields: action.payload.selectedRowFields,
        selectedRowName: action.payload.selectedRowName,
      };

    case StreamSchemaActionTypes.CLEAR_SCHEMA_FIELDS:
      return {
        ...state,
        selectedRowIsEnum: false,
        selectedRowFields: [],
        selectedRowName: '',
      };
    default:
      return state;
  }
}
