export interface StreamsStateModel {
  messageType?: string;
  id?: number;
  added?: string[];
  deleted?: Array<string | {streamId: string; space: string}>;
  changed?: string[];
  renamed?: Array<{streamId?: string; oldName: string; newName: string}>;
}
