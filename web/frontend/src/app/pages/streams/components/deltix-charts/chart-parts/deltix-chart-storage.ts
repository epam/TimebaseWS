import {ChartTypes} from '../../../models/chart.model';
import {DeltixChartFormattedData} from '../../../models/deltix-chart.models';

export interface DeltixChartStorage {
  interval: number;
  savedSchema: {key: string, unique: number}[];
  knownRanges: [number, number][];
  data: DeltixChartFormattedData[];
  barsAggregation: number;
  chartType: ChartTypes;
  levels: number;
  pointInterval: number;
  track?: boolean;
  exchange?: {id: string, name: string};
}
