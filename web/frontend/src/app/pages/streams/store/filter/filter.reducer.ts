import { FilterActions, FilterActionTypes } from './filter.actions';


export interface State {
  'from': string;
}

export const initialState: State = {
  'from': null,
};

export function reducer(state = initialState, action: FilterActions): State {
  switch (action.type) {
    case FilterActionTypes.SET_FILTER:
      return {
        //  'from': action.payload.filter.from,
        'from': null,
        ...action.payload.filter,
      };

    case FilterActionTypes.ADD_FILTER:
      return {
        ...state,
        ...action.payload.filter,
      };

    case FilterActionTypes.REMOVE_FILTER:
      const currentFilter = { ...state };
      delete currentFilter[action.payload.filterName];
      return currentFilter;

    case FilterActionTypes.CLEAN_FILTER:
      return {
        ...state,
        'from': null,
      };

    case FilterActionTypes.RESET_STATE:
      return {
        ...state,
        //  'from': null,
      };

    default:
      return state;
  }
}

