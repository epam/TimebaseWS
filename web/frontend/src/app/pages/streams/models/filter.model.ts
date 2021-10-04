import { ChartTypes } from './chart.model';

export class FilterModel {
  public 'from'?: string;
  public 'to'?: string;
  public 'symbol'?: string;
  public 'levels'?: number;
  public 'symbols'?: string[];
  public 'filter_types'?: string[];
  public 'filter_symbols'?: string[];
  public 'filter_date_format'?: string[];
  public 'filter_time_format'?: string[];
  public 'chart_width_val'?: string | number;
  public 'filter_timezone'?: string[];
  public 'chart_type'?: ChartTypes;

  public silent?: boolean;

  constructor(obj: FilterModel | {}) {
    Object.assign(this, obj);
  }

}
