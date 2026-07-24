import {Action} from '@ngrx/store';
import {TimebaseInstanceDef} from '../../../../shared/models/timebase-instance-def.model';

export enum TimebasesActionTypes {
  LOAD_TIMEBASES = '[Timebases] Load Timebases',
  SET_TIMEBASES = '[Timebases] Set Timebases',
  LOAD_TIMEBASES_FAILED = '[Timebases] Load Timebases Failed',
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

export type TimebasesActions = LoadTimebases | SetTimebases | LoadTimebasesFailed;
