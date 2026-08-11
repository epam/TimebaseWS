export interface TimebaseInstanceModel {
  id: string;
  url: string;
  readonly: boolean;
  connected: boolean;
  serverVersion: string;
  clientVersion: string;
}

export interface AppInfoModel {
  name: string;
  version: string;
  timestamp: number;
  timebases: TimebaseInstanceModel[];
  authentication: boolean;
}
