import {IEverChartDataItem} from '@deltix/hd.components-everchart/lib/Store/everChartState';
import {ChartPointModel} from './chart.model';

export interface DeltixChartFormattedData extends IEverChartDataItem {
  points: {[key: string]: ChartPointModel};
}

export interface DeltixChartRequestModel {
  stream: string;
  symbol: string;
  space?: string;
  levels: number;
  from: number;
  to: number;
  streamRange: {
    start: number;
    end: number;
  };
  pureRangeEnd: number;
}

export const ZOOM_PERIODS = {
  SECOND: 0,
  SECOND_5: 481,
  SECOND_15: 957,
  SECOND_30: 1260,
  MINUTE: 1603,
  MINUTE_2: 1902,
  MINUTE_5: 2294,
  MINUTE_10: 2603,
  MINUTE_15: 2779,
  MINUTE_30: 3080,
  HOUR: 3381,
  HOUR_2: 3681,
  HOUR_3: 3829,
  HOUR_6: 4159,
  HOUR_12: 4431,
  DAY: 4761,
  DAY_2: 4972,
  DAY_4: 5363,
  DAY_7: 5577,
  DAY_14: 5907,
  DAY_30: 6238,
  DAY_60: 6546,
  DAY_120: 6847,
  DAY_365: 7323,
  BIG_PERIOD: 9300,
};

export const DEFAULT_ZOOM_TABLE = [
  ZOOM_PERIODS.SECOND,
  ZOOM_PERIODS.SECOND_5,
  ZOOM_PERIODS.SECOND_15,
  ZOOM_PERIODS.SECOND_30,
  ZOOM_PERIODS.MINUTE,
  ZOOM_PERIODS.MINUTE_2,
  ZOOM_PERIODS.MINUTE_5,
  ZOOM_PERIODS.MINUTE_10,
  ZOOM_PERIODS.MINUTE_15,
  ZOOM_PERIODS.MINUTE_30,
  ZOOM_PERIODS.HOUR,
  ZOOM_PERIODS.HOUR_2,
  ZOOM_PERIODS.HOUR_3,
  ZOOM_PERIODS.HOUR_6,
  ZOOM_PERIODS.HOUR_12,
  ZOOM_PERIODS.DAY,
  ZOOM_PERIODS.DAY_2,
  ZOOM_PERIODS.DAY_4,
  ZOOM_PERIODS.DAY_7,
  ZOOM_PERIODS.DAY_14,
  ZOOM_PERIODS.DAY_30,
  ZOOM_PERIODS.DAY_60,
  ZOOM_PERIODS.DAY_120,
  ZOOM_PERIODS.DAY_365,
  ZOOM_PERIODS.BIG_PERIOD,
];

export const BARS_ZOOM_TABLE = [0, 1500, 2500, 3900, 4200, 5700, 6100, 6600, 7000, 7500, 8100];

export const BARS_INTERVAL_MULTIPLAYER = 2;
export const BARS_INTERVALS_TABLE = [
  1, 100, 1000, 30000, 60000, 1800000, 3600000, 14400000, 28800000, 86400000, 604800000,
].map((interval) => interval * BARS_INTERVAL_MULTIPLAYER);
