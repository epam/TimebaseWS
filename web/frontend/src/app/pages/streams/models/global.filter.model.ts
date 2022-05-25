import {TimeZone} from '../../../shared/models/timezone.model';

export interface GlobalFilterModel {
  filter_date_format: string[];
  filter_time_format: string[];
  filter_timezone: GlobalFilterTimeZone[];
}

export interface GlobalFilterTimeZone extends TimeZone {
  nameTitle: string;
}
