export interface StructureUpdate {
  type: StructureUpdateType;
  action: StructureUpdateAction;
  id: string;
  target: string;
  tbId?: string;
  viewMd?: {
    stream: string;
  };
}

export enum StructureUpdateType {
  stream = 'STREAM',
  view = 'VIEW',
  topic = 'TOPIC',
  playback = 'PLAYBACK'
}

export enum StructureUpdateAction {
  update = 'UPDATE',
  rename = 'RENAME',
  add = 'ADD',
  remove = 'REMOVE',
}
