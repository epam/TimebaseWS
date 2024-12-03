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
  public source?: string[];

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
    defaultList: true
  },
  {
    title: 'Last 5 minutes',
    val: 5 * 60 * 1000,
    defaultList: true
  },
  {
    title: 'Last 10 minutes',
    val: 10 * 60 * 1000,
  },
  {
    title: 'Last 15 minutes',
    val: 15 * 60 * 1000,
    defaultList: true
  },
  {
    title: 'Last 20 minutes',
    val: 20 * 60 * 1000,
  },
  {
    title: 'Last 30 minutes',
    val: 30 * 60 * 1000,
    defaultList: true
  },
  {
    title: 'Last 40 minutes',
    val: 40 * 60 * 1000,
  },
  {
    title: 'Last 1 hour',
    val: 60 * 60 * 1000,
    defaultList: true
  },
  {
    title: 'Last 2 hour',
    val: 2 * 60 * 60 * 1000,
  },
  {
    title: 'Last 3 hours',
    val: 3 * 60 * 60 * 1000,
    defaultList: true
  },
  {
    title: 'Last 4 hours',
    val: 4 * 60 * 60 * 1000,
  },
  {
    title: 'Last 6 hours',
    val: 6 * 60 * 60 * 1000,
    defaultList: true
  },
  {
    title: 'Last 12 hours',
    val: 12 * 60 * 60 * 1000,
    defaultList: true
  },
  {
    title: 'Last 24 hours',
    val: 24 * 60 * 60 * 1000,
    defaultList: true
  },
  {
    title: 'Last 2 days',
    val: 2 * 24 * 60 * 60 * 1000,
    defaultList: true
  },
  {
    title: 'Last 4 days',
    val: 4 * 24 * 60 * 60 * 1000,
  },
  {
    title: 'Last 7 days',
    val: 7 * 24 * 60 * 60 * 1000,
    defaultList: true
  },
  {
    title: 'Last 2 weeks',
    val: 14 * 24 * 60 * 60 * 1000,
  },
  {
    title: 'Last month',
    val: 30 * 24 * 60 * 60 * 1000,
  },
  {
    title: 'Last 2 months',
    val: 2 * 30 * 24 * 60 * 60 * 1000,
  },
  {
    title: 'Last 6 months',
    val: 6 * 30 * 24 * 60 * 60 * 1000,
  },
  {
    title: 'Last year',
    val: 365 * 24 * 60 * 60 * 1000,
  },
  {
    title: 'Last 2 years',
    val: 2 * 365 * 24 * 60 * 60 * 1000,
  },
  {
    title: 'Last 5 years',
    val: (5 * 365 + 1) * 24 * 60 * 60 * 1000,
  },
  {
    title: 'Last 10 years',
    val: (10 * 365 + 2) * 24 * 60 * 60 * 1000,
  },
  {
    title: 'Last 20 years',
    val: (20 * 365 + 4) * 24 * 60 * 60 * 1000,
  }
];

export const defaultTimeRangeList = (periodicity: number = null) => {
  let defaultTimeRangeInMinutes: number[];
  if (!periodicity) {
    defaultTimeRangeInMinutes = [5, 15, 30, 60, 180, 360, 720, 1440, 5760];
  } else if (periodicity >= 1000 && periodicity < 60 * 1000) {
    defaultTimeRangeInMinutes = [5, 10, 15, 30, 60, 120, 240, 360, 720, 1440];
  } else if (periodicity >= 60 * 1000 && periodicity < 5 * 60 * 1000) {
    defaultTimeRangeInMinutes = [30, 60, 180, 360, 720, 1440, 2880, 5760, 10080];
  } else if (periodicity >= 5 * 60 * 1000 && periodicity < 60 * 60 * 1000) {
    defaultTimeRangeInMinutes = [360, 720, 1440, 2880, 5760, 10080];
  } else if (periodicity >= 60 * 60 * 1000 && periodicity < 4 * 60 * 60 * 1000) {
    defaultTimeRangeInMinutes = [2880, 5760, 10080, 20160, 43200];
  } else if (periodicity >= 4 * 60 * 60 * 1000 && periodicity < 12 * 60 * 60 * 1000) {
    defaultTimeRangeInMinutes = [10080, 20160, 43200, 86400, 259200];
  } else if (periodicity >= 12 * 60 * 60 * 1000 && periodicity < 24 * 60 * 60 * 1000) {
    defaultTimeRangeInMinutes = [43200, 86400, 259200, 525600];
  } else if (periodicity >= 24 * 60 * 60 * 1000 && periodicity < 7 * 24 * 60 * 60 * 1000) {
    defaultTimeRangeInMinutes = [43200, 86400, 259200, 525600, 1051200, 2629440, 5258880];
  } else if (periodicity >= 7 * 24 * 60 * 60 * 1000 && periodicity < 30 * 24 * 60 * 60 * 1000) {
    defaultTimeRangeInMinutes = [525600, 1051200, 2629440, 5258880, 10517760];
  } else if (periodicity >= 30 * 24 * 60 * 60 * 1000 && periodicity <= 366 * 24 * 60 * 60 * 1000) {
    defaultTimeRangeInMinutes = [2629440, 5258880, 10517760];
  }
  return defaultTimeRangeInMinutes.map(value => value * 60 * 1000);
}