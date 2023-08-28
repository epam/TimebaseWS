import {IEverChartDataItem}          from '@deltix/hd.components-everchart/lib/Store/everChartState';
import { day, hour, minute, second } from '../components/deltix-charts/charts/units-in-ms';
import {ChartPointModel}             from './chart.model';

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
  DAY_7: 5544.85,
  DAY_14: 5907,
  DAY_30: 6238,
  DAY_60: 6546,
  DAY_120: 6847,
  DAY_365: 7323,
  BIG_PERIOD: 9300,
};

export const ZOOM_TIME = {
  [ZOOM_PERIODS.SECOND]: second,
  [ZOOM_PERIODS.SECOND_5]: 5 * second,
  [ZOOM_PERIODS.SECOND_15]: 15 * second,
  [ZOOM_PERIODS.SECOND_30]: 30 * second,
  [ZOOM_PERIODS.MINUTE]: minute,
  [ZOOM_PERIODS.MINUTE_2]: 2 * minute,
  [ZOOM_PERIODS.MINUTE_5]: 5 * minute,
  [ZOOM_PERIODS.MINUTE_10]: 10 * minute,
  [ZOOM_PERIODS.MINUTE_15]: 15 * minute,
  [ZOOM_PERIODS.MINUTE_30]: 30 * minute,
  [ZOOM_PERIODS.HOUR]: hour,
  [ZOOM_PERIODS.HOUR_2]: 2 * hour,
  [ZOOM_PERIODS.DAY]: day,
  [ZOOM_PERIODS.DAY_2]: 2 * day,
  [ZOOM_PERIODS.DAY_4]: 4 * day,
  [ZOOM_PERIODS.DAY_7]: 7 * day,
  [ZOOM_PERIODS.DAY_14]: 14 * day,
  [ZOOM_PERIODS.DAY_30]: 30 * day,
  [ZOOM_PERIODS.DAY_60]: 60 * day,
  [ZOOM_PERIODS.DAY_120]: 120 * day,
  [ZOOM_PERIODS.DAY_365]: 365 * day,
  [ZOOM_PERIODS.BIG_PERIOD]: 3 * 365 * day,
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
  // ZOOM_PERIODS.DAY_14,
  // ZOOM_PERIODS.DAY_30,
  // ZOOM_PERIODS.DAY_60,
  // ZOOM_PERIODS.DAY_120,
  // ZOOM_PERIODS.DAY_365,
  // ZOOM_PERIODS.BIG_PERIOD,
];
