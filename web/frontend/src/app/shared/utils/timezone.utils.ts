import {HdDate} from '@assets/hd-date/hd-date';
import {DateTime} from 'luxon';
import {TimeZone} from '../models/timezone.model';
import {tzStr} from './tz';
import Timeout = NodeJS.Timeout;

let timezoneOffsetCash = new Map<string, number>();
let timezoneCashTimeoutId: Timeout;

export function getTimeZones(): TimeZone[] {
  const timeZones: Array<TimeZone> = [];
  const groups = tzStr.split('|');

  for (const namesGroup of groups) {
    if (namesGroup === '\r\n') {
      continue;
    }
    const names = namesGroup.split(',');
    const alias = names[0];
    const offset = getTimeZoneOffset(alias);
    if (offset === null || isNaN(offset)) {
      // not supported tz
      continue;
    }
    for (const name of names) {
      timeZones.push({
        name,
        offset,
        alias,
      });
    }
  }

  timeZones.sort((tz1, tz2) => {
    return tz1.offset - tz2.offset;
  });

  return timeZones;
}

export const nullTimezone = getTimeZones().find((tz) => tz.offset === 0);

export function getTimeZoneInfo(tz: string): {tz: string; alias?: string} {
  const t = tz.split(',');
  return {
    tz: t[0],
    alias: t[1],
  };
}

export function getTimeZoneObject(tz: string): TimeZone {
  const infoTimezone = getTimeZoneInfo(tz);
  return {
    name: infoTimezone.tz,
    alias: infoTimezone.alias,
    offset: null,
  };
}

export function getTimezoneName(tz: string): string {
  const infoTimezone = getTimeZoneInfo(tz);
  return infoTimezone.alias || infoTimezone.tz;
}

export function getTimeZoneOffset(tz: string, dateDef?: Date | number | string): number {
  initTimeoutForTimezoneCash();
  if (timezoneOffsetCash.has(tz)) {
    return timezoneOffsetCash.get(tz);
  }

  let date: Date;
  if (dateDef instanceof Date) {
    date = dateDef;
  } else if (dateDef == null) {
    date = new Date();
  } else {
    date = new Date(<any>dateDef);
  }

  const tzDate = dateToTzDateTime(date, tz);
  const utcDate = dateToTzDateTime(date, 'UTC');

  const offset = tzDate.offset - utcDate.offset;
  timezoneOffsetCash.set(tz, offset);
  return offset;
}

export function dateToTzDate(date: Date, tz: string): Date {
  return dateToTzDateTime(date, tz).toJSDate();
}

function dateToTzDateTime(date: Date, tz: string): DateTime {
  const d = DateTime.local(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
    date.getMilliseconds(),
  );
  return d.setZone(tz);
}

export function getTimeZoneTitle(tz: TimeZone): string {
  return `${tz.name} (${timeZoneOffsetToString(tz.offset)})`;
}

export function timeZoneOffsetToString(offset: number): string {
  if (offset === 0) {
    return 'UTC+00:00';
  }
  if (isNaN(offset)) {
    console.log('offset is NAN');
    return `UTC`;
  } else {
    const sign = offset < 0 ? '-' : '+';
    offset = Math.abs(offset);
    const hours = Math.floor(offset / 60);
    const minutes = offset % 60;
    const hoursTitle = hours <= 9 ? `0${hours}` : `${hours}`;
    const minutesTitle = minutes <= 9 ? `0${minutes}` : `${minutes}`;
    return `UTC${sign}${hoursTitle}:${minutesTitle}`;
  }
}

export function isoToHdDate(dateStr: string, tz: string): HdDate {
  const date = new HdDate(dateStr);
  const deviceOffset: number = date.getTimezoneOffset();
  const timezoneOffset = getTimeZoneOffset(tz, dateStr);
  date.setMinutes(date.getMinutes() + timezoneOffset + deviceOffset);
  return date;
}

export function hdDateToISO(date: HdDate, tz: string): string {
  const temp = new HdDate(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
    date.getMilliseconds(),
    date.getMicroseconds(),
    date.getNanoseconds(),
  );
  temp.setMinutes(temp.getMinutes() - temp.getTimezoneOffset());
  const offset = getTimeZoneOffset(tz, date.getEpochMillis());
  temp.setMinutes(temp.getMinutes() - offset);
  return temp.toHdISOString();
}

export function hdDateToUTC(date: HdDate, tz: string): HdDate {
  const temp = new HdDate(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
    date.getMilliseconds(),
  );
  temp.setMinutes(temp.getMinutes() - temp.getTimezoneOffset());
  const offset = getTimeZoneOffset(tz, date.getEpochMillis());
  temp.setMinutes(temp.getMinutes() - offset);
  return temp;
}

export function dateToUTC(date: Date, tz: string): Date {
  const temp = new HdDate(date.getTime());
  temp.setMinutes(temp.getMinutes() - temp.getTimezoneOffset());
  const offset = getTimeZoneOffset(tz, date.getTime());
  temp.setMinutes(temp.getMinutes() - offset);
  return new Date(temp.getEpochMillis());
}

export const setTimeZone = (date: HdDate, offset: number = 0) => {
  const newDate = new HdDate(date);
  newDate.setMilliseconds(
    newDate.getMilliseconds() + (new HdDate().getTimezoneOffset() + offset) * 60 * 1000,
  );
  return newDate;
};

export function hdDateTZ(date: HdDate, tz: string): HdDate {
  const temp = new HdDate(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
    date.getMilliseconds(),
    date.getMicroseconds(),
    date.getNanoseconds(),
  );
  temp.setMinutes(temp.getMinutes() - temp.getTimezoneOffset());
  const offset = getTimeZoneOffset(tz, date.getEpochMillis());
  temp.setMinutes(temp.getMinutes() + offset);
  return temp;
}

export function hdDateToTZ(date: HdDate, tz: string): HdDate {
  const temp = new HdDate(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
    date.getMilliseconds(),
    date.getMicroseconds(),
    date.getNanoseconds(),
  );
  temp.setMinutes(temp.getMinutes() + temp.getTimezoneOffset());
  const offset = getTimeZoneOffset(tz, date.getEpochMillis());
  temp.setMinutes(temp.getMinutes() + offset);
  return temp;
}

export function hdDateTZDate(date: Date, tz: string): Date {
  const temp = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
    date.getMilliseconds(),
  );
  temp.setMinutes(temp.getMinutes() - temp.getTimezoneOffset());
  const offset = getTimeZoneOffset(tz, date.getTime());
  temp.setMinutes(temp.getMinutes() + offset);
  return temp;
}

export function dateFromTZToDate(date: Date, tz: string): Date {
  const temp = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
    date.getMilliseconds(),
  );
  temp.setMinutes(temp.getMinutes() - temp.getTimezoneOffset());
  const offset = getTimeZoneOffset(tz, date.getTime());
  temp.setMinutes(temp.getMinutes() - offset);
  return temp;
}

function initTimeoutForTimezoneCash() {
  if (timezoneCashTimeoutId != null) {
    return;
  }
  timezoneCashTimeoutId = setTimeout(() => {
    timezoneCashTimeoutId = null;
    timezoneOffsetCash = new Map<string, number>();
    initTimeoutForTimezoneCash();
  }, 18000000);
}
