import {HdDate} from '@assets/hd-date/hd-date';
import {DEFAULT_DATETIME_FULL_FORMAT} from './hdDateUtils';
import {hdDateToTZ} from './timezone.utils';

export const formatDateTime = (value: string | number | Date, template?: string, tz?: string) => {
  if (template == null || template.length === 0) {
    template = DEFAULT_DATETIME_FULL_FORMAT;
  }

  const date = new Date(value);
  const datetotz = hdDateToTZ(new HdDate(date.getTime()), tz);
  return datetotz.toLocaleFormat(template);
};
