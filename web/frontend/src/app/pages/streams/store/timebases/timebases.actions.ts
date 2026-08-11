import {Action} from '@ngrx/store';
import {TimebaseInstanceDef} from '../../../../shared/models/timebase-instance-def.model';

export enum TimebasesActionTypes {
  LOAD_TIMEBASES = '[Timebases] Load Timebases',
  SET_TIMEBASES = '[Timebases] Set Timebases',
  LOAD_TIMEBASES_FAILED = '[Timebases] Load Timebases Failed',
  TIMEBASE_STATUS_CHANGED = '[Timebases] Timebase Status Changed',
}

export class LoadTimebases implements Action {
  readonly type = TimebasesActionTypes.LOAD_TIMEBASES;
}

export class SetTimebases implements Action {
  readonly type = TimebasesActionTypes.SET_TIMEBASES;

  constructor(public payload: { timebases: TimebaseInstanceDef[] }) {}
}

export class LoadTimebasesFailed implements Action {
  readonly type = TimebasesActionTypes.LOAD_TIMEBASES_FAILED;

  constructor(public payload: { error: any }) {}
}

export class TimebaseStatusChanged implements Action {
  readonly type = TimebasesActionTypes.TIMEBASE_STATUS_CHANGED;

  constructor(public payload: { id: string; connected: boolean; errorMessage?: string }) {}
}

export type TimebasesActions = LoadTimebases | SetTimebases | LoadTimebasesFailed | TimebaseStatusChanged;
