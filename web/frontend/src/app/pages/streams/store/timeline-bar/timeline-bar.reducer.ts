import {HdDate} from '@assets/hd-date/hd-date';
import {TimelineBarActions, TimelineBarActionTypes} from './timeline-bar.actions';

export interface State {
  top: string;
  bottom: string;
  startDate: HdDate;
  endDate: HdDate;
  firstLoadedDate: HdDate;
  lastLoadedDate: HdDate;
}

export const initialState: State = {
  top: '0',
  bottom: '100%',
  startDate: null, // new HdDate(startDate.toISOString()),
  endDate: null, // new HdDate(endDate.toISOString()),
  firstLoadedDate: null, // new HdDate(startDate.toISOString()),
  lastLoadedDate: null, // new HdDate(startDate.toISOString()),
};

function getThumbTopPosition(
  startDate: HdDate,
  endDate: HdDate,
  firstLoadedDate: HdDate,
  top: string,
): string {
  if (startDate && endDate && firstLoadedDate) {
    const barSize = endDate.getEpochMillis() - startDate.getEpochMillis(),
      firstLoadedDateTopPos = firstLoadedDate.getEpochMillis() - startDate.getEpochMillis();
    return (firstLoadedDateTopPos / barSize) * 100 + '%';
  }
  if (!firstLoadedDate) return '0';
  return top;
}

function getThumbBottomPosition(
  startDate: HdDate,
  endDate: HdDate,
  lastLoadedDate: HdDate,
  bottom: string,
): string {
  if (startDate && endDate && lastLoadedDate) {
    const barSize = endDate.getEpochMillis() - startDate.getEpochMillis(),
      lastLoadedDateTopPos = lastLoadedDate.getEpochMillis() - startDate.getEpochMillis();
    return (1 - lastLoadedDateTopPos / barSize) * 100 + '%';
  }
  if (!lastLoadedDate) return '100%';
  return bottom;
}

export function reducer(state = initialState, action: TimelineBarActions): State {
  switch (action.type) {
    case TimelineBarActionTypes.SET_START_DATE:
      return {
        ...state,
        startDate: new HdDate(action.payload.date),
      };
    case TimelineBarActionTypes.SET_END_DATE:
      return {
        ...state,
        endDate: new HdDate(action.payload.date),
      };
    case TimelineBarActionTypes.SET_FIRST_LOADED_DATE:
      return {
        ...state,
        firstLoadedDate: new HdDate(action.payload.date),
      };
    case TimelineBarActionTypes.SET_LAST_LOADED_DATE:
      return {
        ...state,
        lastLoadedDate: new HdDate(action.payload.date),
      };
    case TimelineBarActionTypes.CLEAR_LOADED_DATES:
      return {
        ...state,
        firstLoadedDate: null,
        lastLoadedDate: null,
      };
    case TimelineBarActionTypes.RECALCULATE_THUMB_POSITIONS:
      const topPosition = getThumbTopPosition(
          state.startDate,
          state.endDate,
          state.firstLoadedDate,
          state.top,
        ),
        bottomPosition = getThumbBottomPosition(
          state.startDate,
          state.endDate,
          state.lastLoadedDate,
          state.bottom,
        );
      return {
        ...state,
        top: topPosition,
        bottom: bottomPosition,
      };
    default:
      return state;
  }
}
