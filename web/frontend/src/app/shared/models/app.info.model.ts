export interface AppInfoModel {
  name: string;
  version: string;
  timestamp: number;
  timebase: {
    clientVersion: string;
    connected: boolean;
    serverVersion: string;
  };
  authentication: boolean;
}
