import {GlobalFilterTimeZone} from '../../pages/streams/models/global.filter.model';

export interface GlobalFilters {
  dateFormat: string[];
  timeFormat: string[];
  timezone: GlobalFilterTimeZone[];
}
