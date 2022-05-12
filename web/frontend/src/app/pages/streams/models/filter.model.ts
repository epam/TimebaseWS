import {BarChartPeriod} from '../../../shared/models/bar-chart-period';
import {ChartTypes} from './chart.model';

export class FilterModel {
  public from?: string;
  public to?: string;
  // public 'streamRange'?: string;
  public symbol?: string;
  public levels?: number;
  public symbols?: string[];
  public filter_types?: string[];
  public filter_symbols?: string[];
  public filter_date_format?: string[];
  public filter_time_format?: string[];
  public chart_width_val?: string | number;
  public filter_timezone?: string[];
  public chart_type?: ChartTypes;
  public period?: BarChartPeriod;

  public _isDataLoading?: boolean;
  public silent?: boolean;
  public manuallyChanged?: boolean;

  constructor(obj: FilterModel | {}) {
    Object.assign(this, obj);
  }
}

export const WIDTH_VALUES_MS = [
  {
    title: 'Custom time range',
    val: 'custom',
  },
  {
    title: 'Last 5 minutes',
    val: 5 * 60 * 1000,
  },
  {
    title: 'Last 15 minutes',
    val: 15 * 60 * 1000,
  },
  {
    title: 'Last 30 minutes',
    val: 30 * 60 * 1000,
  },
  {
    title: 'Last 1 hour',
    val: 60 * 60 * 1000,
  },
  {
    title: 'Last 3 hours',
    val: 3 * 60 * 60 * 1000,
  },
  {
    title: 'Last 6 hours',
    val: 6 * 60 * 60 * 1000,
  },
  {
    title: 'Last 12 hours',
    val: 12 * 60 * 60 * 1000,
  },
  {
    title: 'Last 24 hours',
    val: 24 * 60 * 60 * 1000,
  },
  {
    title: 'Last 2 day',
    val: 2 * 24 * 60 * 60 * 1000,
  },
  {
    title: 'Last 7 days',
    val: 7 * 24 * 60 * 60 * 1000,
  },
];
