import {HdDate} from '@assets/hd-date/hd-date';

export const DEFAULT_DATETIME_FORMAT = 'yyyy-MM-dd HH:mm';

export const DEFAULT_DATETIME_FULL_FORMAT = 'yyyy-MM-dd HH:mm:ss.fff';

export const DEFAULT_DATE_FORMAT = 'yyyy-MM-dd';

export const DEFAULT_YEAR_MONTH_FORMAT = 'yyyy-MM';

export const DEFAULT_DATETIME_REPORT_FORMAT = 'yyyy-MM-dd HH:mm:ss';

export const DEFAULT_TIME_FORMAT = 'HH:mm:ss';

export const DEFAULT_DURATION_FORMAT_WITHOUT_SECONDS = 'ddddd.HH:mm';

export const DEFAULT_DURATION_FORMAT = 'dd.HH:mm:ss.fff';

export const maxDate = new HdDate(8640000000000000);

export const minDate = new HdDate(8640000000000000);

const now = new HdDate();

export const toUtc = (date: HdDate) => {
  const newDate = new HdDate(date);
  newDate.setMilliseconds(newDate.getMilliseconds() + now.getTimezoneOffset() * 60 * 1000);
  return newDate;
};

export const fromUtc = (date: HdDate) => {
  const newDate = new HdDate(date);
  newDate.setMilliseconds(newDate.getMilliseconds() - now.getTimezoneOffset() * 60 * 1000);
  return newDate;
};

export const toIsoString = (date: HdDate) => (date ? date.toISOString() : null);

export const addMilliseconds = (date: HdDate | string, ms: number) => {
  const newDate = new HdDate(date as any);
  newDate.setMilliseconds(newDate.getMilliseconds() + ms);
  return newDate;
};

export const addDay = (date: HdDate, day: number) => {
  return addMilliseconds(date, 24 * 60 * 60 * 1000 * day);
};

export const toDate = (date: HdDate) => new Date(date.getEpochMillis());

export const beginningOfDaY = (date: HdDate) =>
  new HdDate(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0, 0);

export const beginningOfWeek = (date: HdDate) => {
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const d = new HdDate(date);
  d.setDate(diff);
  return new HdDate(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0, 0);
};

export const beginningOfMonth = (date: HdDate) =>
  new HdDate(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0, 0);

export const beginningOfYear = (date: HdDate) =>
  new HdDate(date.getFullYear(), 0, 1, 0, 0, 0, 0, 0);

/**
 * Set tz offset to date (UTC by default)
 * @param date
 * @param offset
 */
export const setTimeZone = (date: HdDate, offset: number = 0) => {
  const newDate = new HdDate(date);
  newDate.setMilliseconds(
    newDate.getMilliseconds() + (now.getTimezoneOffset() + offset) * 60 * 1000,
  );
  return newDate;
};
