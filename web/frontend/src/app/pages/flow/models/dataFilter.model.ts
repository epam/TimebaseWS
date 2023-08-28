import { TopologyTypeModel } from './topologyType.model';

export interface DataFilterModel {
  topologies: TopologyTypeModel[];
  rpsFilter: {
    type: 'all' | 'more' | 'less' | 'equal';
    value: number;
  };
}
