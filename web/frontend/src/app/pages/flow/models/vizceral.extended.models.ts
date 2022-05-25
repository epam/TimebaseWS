// import { Connection, Node }    from '@deltix/vizceral';
import { ConnectionMetadataModel, NodeMetadataModel } from './metadata.model';
import { ShortTrafficNodeModel }                      from './traffic.node.model';

export interface BaseConnectionAndNodeModel {
  type: 'connection' | 'node';
  name: string;
  class: string /*"normal"*/
  ;
  defaultFiltered: boolean;
  filtered: boolean;
  graphRenderer: 'region';
  loaded: boolean;
  minimumNoticeLevel: number;
  notices: any;
  
  // view: e {container: er, object: e, interactiveChildren: Array(1), dimmedLevel: 0.05, opacity: 1, …};
}

export interface VizceralNode extends BaseConnectionAndNodeModel {
  type: 'node';
  boundingBox: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  
  classInvalidated: boolean;
  connected: boolean;
  context: any;
  data: {
    classPercents: VolumeModel;
    globalClassPercents: VolumeModel;
    volume: number;
    volumePercent: number;
  };
  depth: number;
  detailedMode: string;
  entryNode: any;
  incomingConnections: VizceralConnection[];
  incomingVolume: VolumeModel;
  incomingVolumeTotal: number;
  invalidatedSinceLastViewUpdate: boolean;
  layout: string;
  maxVolume: number;
  node_type: string;
  options: {
    showLabel: boolean;
  };
  outgoingConnections: VizceralConnection[];
  outgoingVolume: VolumeModel;
  outgoingVolumeTotal: number;
  position: {
    x: number;
    y: number;
  };
  renderer: string;
  size: number;
  updated: boolean;
  metadata: NodeMetadataModel;
}

export interface VizceralConnection extends BaseConnectionAndNodeModel {
  type: 'connection';
  source: VizceralNode;
  target: VizceralNode;
  annotations: any;
  
  volumeGreatest: number;
  volumeTotal: number;
  valid: boolean;
  
  volume: VolumeModel;
  volumePercent: VolumeModel;
  volumePercentKeysSorted: ['normal', 'warning', 'danger', 'loader', 'cursor'];
  metadata: ConnectionMetadataModel;
}

export interface VolumeModel {
  normal: number;
  warning: number;
  danger: number;
  cursor: number;
  loader: number;
}

export class VizceralFilterModel {
  constructor(node: ShortTrafficNodeModel) {}
}
