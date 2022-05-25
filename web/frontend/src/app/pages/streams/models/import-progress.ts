export enum ImportProgressType {
  state = 'STATE',
  progress = 'PROGRESS',
  info = 'INFO',
  warning = 'WARNING',
  error = 'ERROR',
}

export enum ImportStateMessage {
  started = 'STARTED',
  finished = 'FINISHED',
}

export interface ImportProgress {
  message: ImportStateMessage | string;
  type: ImportProgressType;
}
