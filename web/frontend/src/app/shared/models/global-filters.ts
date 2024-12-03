import {GlobalFilterTimeZone} from '../../pages/streams/models/global.filter.model';

export interface GlobalFilters {
  dateFormat: string[];
  timeFormat: string[];
  timezone: GlobalFilterTimeZone[];
  reverseViewIsDefault: boolean;
  showSpaces: boolean;
  hideSystemStreams: boolean;
  showTopics: boolean
}
