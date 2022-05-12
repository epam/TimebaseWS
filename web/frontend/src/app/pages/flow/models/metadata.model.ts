export interface ConnectionMetadataModel {
  loaders: LoaderMetadataModel[];
  cursors: CursorMetadataModel[];
}

export interface NodeMetadataModel {
  color: string;
}

export interface BaseMetadataModel {
  id: number;
  rps: number;
}

// tslint:disable-next-line:no-empty-interface
export interface LoaderMetadataModel extends BaseMetadataModel {}

// tslint:disable-next-line:no-empty-interface
export interface CursorMetadataModel extends BaseMetadataModel {}

export interface WSRResponseMetadataModel extends ConnectionMetadataModel {
  source: string;
  target: string;
}
