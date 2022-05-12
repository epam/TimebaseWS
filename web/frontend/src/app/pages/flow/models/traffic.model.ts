import {Renderer, TrafficNodeModel} from './traffic.node.model';

export interface TrafficModel {
  // Which graph renderer to use for this graph (currently only 'global' and 'region')
  renderer: Renderer;
  connections: TrafficConnection[];
  // since the root object is a node, it has a name too.
  name: string;
  // OPTIONAL: The maximum volume seen recently to relatively measure particle density. This 'global' maxVolume is optional because it can be calculated by using all of the required sub-node maxVolumes.
  maxVolume: number;
  // OPTIONAL: The name of the entry node to the global graph. If omitted, will assume an 'INTERNET' node
  entryNode: string;
  // list of nodes for this graph
  nodes: TrafficNodeModel[];
}

export interface TrafficConnection {
  class: string;
  metrics: any;
  source: string;
  target: string;
}
