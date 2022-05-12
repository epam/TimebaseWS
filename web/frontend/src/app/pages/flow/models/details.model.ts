// tslint:disable-next-line:no-empty-interface
import { ConnectionMetadataModel, NodeMetadataModel }    from './metadata.model';
import { COLOR_TRAFFIC }                                 from './traffic.node.model';
import { VizceralConnection, VizceralNode, VolumeModel } from './vizceral.extended.models';

export class NodeDetailsModel implements VizceralNode {
  public boundingBox: { top: number; right: number; bottom: number; left: number };
  public classInvalidated: boolean;
  public connected: boolean;
  public context: any;
  public data: {
    classPercents: VolumeModel;
    globalClassPercents: VolumeModel;
    volume: number;
    volumePercent: number;
  };
  public depth: number;
  public detailedMode: string;
  public entryNode: any;
  public incomingConnections: VizceralConnection[];
  public incomingVolume: VolumeModel;
  public incomingVolumeTotal: number;
  public invalidatedSinceLastViewUpdate: boolean;
  public layout: string;
  public maxVolume: number;
  public metadata: NodeMetadataModel;
  public node_type: string;
  public options: { showLabel: boolean };
  public outgoingConnections: VizceralConnection[];
  public outgoingVolume: VolumeModel;
  public outgoingVolumeTotal: number;
  public position: { x: number; y: number };
  public renderer: string;
  public size: number;
  public type: 'node';
  public updated: boolean;
  public class: string; // 'stream' || 'application'
  public defaultFiltered: boolean;
  public filtered: boolean;
  public graphRenderer: 'region';
  public loaded: boolean;
  public minimumNoticeLevel: number;
  public name: string;
  public notices: any;
  
  constructor(connection: VizceralNode, traffic) {
    Object.assign(this, connection);
    this.metadata = {
      ...(this.metadata || {}),
      color: COLOR_TRAFFIC[this.class],
    };
    
    this.incomingConnections = this.incomingConnections.map(
      (connection) => new ConnectionDetailsModel(connection, traffic),
    );
    this.outgoingConnections = this.outgoingConnections.map(
      (connection) => new ConnectionDetailsModel(connection, traffic),
    );
  }
}

export class ConnectionDetailsModel implements VizceralConnection {
  public annotations: any;
  public metadata: ConnectionMetadataModel;
  public source: VizceralNode;
  public target: VizceralNode;
  public type: 'connection';
  public valid: boolean;
  public volume: VolumeModel;
  public volumeGreatest: number;
  public volumePercent: VolumeModel;
  public volumePercentKeysSorted: ['normal', 'warning', 'danger', 'loader', 'cursor'];
  public volumeTotal: number;
  public class: string;
  public defaultFiltered: boolean;
  public filtered: boolean;
  public graphRenderer: 'region';
  public loaded: boolean;
  public minimumNoticeLevel: number;
  public name: string;
  public notices: any;
  
  constructor(connection: VizceralConnection, traffic) {
    Object.assign(this, connection);
    
    if (this.source) {
      this.source = {
        ...this.source,
        metadata: {
          ...(this.source.metadata || {}),
          color: COLOR_TRAFFIC[this.source?.class || ''],
        },
      };
    }
    if (this.target) {
      this.target = {
        ...this.target,
        metadata: {
          ...(this.target.metadata || {}),
          color: COLOR_TRAFFIC[this.target?.class || ''],
        },
      };
    }
  }
}

export class ShortNodeDetailsModel {
  name: string;
  type: string;
  color: string;
  incomingConnections: ShortConnectionDetailsModel[];
  outgoingConnections: ShortConnectionDetailsModel[];
  
  constructor(node: NodeDetailsModel) {
    this.name = node.name;
    this.type = node.class;
    this.color = node.metadata?.color || '';
    this.incomingConnections = node.incomingConnections.map(
      (connection) => new ShortConnectionDetailsModel(connection),
    );
    this.outgoingConnections = node.outgoingConnections.map(
      (connection) => new ShortConnectionDetailsModel(connection),
    );
  }
}

export class ShortConnectionDetailsModel {
  name: string;
  source: string;
  target: string;
  
  constructor(connection: ConnectionDetailsModel) {
    this.name = connection.name;
    this.source = connection.source.name;
    this.target = connection.target.name;
  }
}
