import {createAction, props} from '@ngrx/store';

export enum MonitorLogActionTypes {}

export const loadMonitorLogs = createAction('[MonitorLog] Load MonitorLogs');

export const loadMonitorLogsSuccess = createAction(
  '[MonitorLog] Load MonitorLogs Success',
  props<{data: any}>(),
);

export const loadMonitorLogsFailure = createAction(
  '[MonitorLog] Load MonitorLogs Failure',
  props<{error: any}>(),
);
