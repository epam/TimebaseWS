export interface StructureUpdate {
  type: StructureUpdateType;
  action: StructureUpdateAction;
  id: string;
  target: string;
  viewMd?: {
    stream: string;
  };
}

export enum StructureUpdateType {
  stream = 'STREAM',
  view = 'VIEW',
}

export enum StructureUpdateAction {
  update = 'UPDATE',
  rename = 'RENAME',
  add = 'ADD',
  remove = 'REMOVE',
}
