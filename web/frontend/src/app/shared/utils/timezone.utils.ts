import { HdDate }   from '@assets/hd-date/hd-date';
import { DateTime } from 'luxon';
import { TimeZone } from '../models/timezone.model';

declare var require;
const timeZonesStr: string = require('raw-loader!./timezones.txt');

let timezoneOffsetCash = new Map<string, number>();
let timezoneCashTimeoutId: number;

export function getTimeZones(): Array<TimeZone> {
  const timeZones: Array<TimeZone> = [];
  const groups = timeZonesStr['default'].split('|');

  for (const namesGroup of groups) {
    if (namesGroup === '\r\n') {
      continue;
    }
    const names = namesGroup.split(',');
    const alias = names[0];
    const offset = getTimeZoneOffset(alias);
    if (offset === null || isNaN(offset)) { // not supported tz
      continue;
    }
    for (const name of names) {
      timeZones.push({
        name, offset, alias,
      });
    }
  }

  timeZones.sort((tz1, tz2) => {
    return tz1.offset - tz2.offset;
  });

  return timeZones;
}

export function getTimeZoneInfo(tz: string): { tz: string, alias?: string } {
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

// export function dateToTzDate(date: Date, tz: string): Date {
//   if (!tz) {
//     console.log(`Undefined TIMEZONE`);
//     return null;
//   }
//   try {
//     const formatter = new Intl.DateTimeFormat('us', {
//         timeZone: tz,
//         ...defaultOptions,
//       }),
//       formattedDate = formatter.format(date),
//       newDate = new Date(formattedDate);
//
//     return newDate;
//   } catch (e) {
//     console.log(`Unable to get tz offset for: ${tz}`);
//     console.warn(e);
//     return null;
//   }
//   // return null;
// }

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
  const temp = new HdDate(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(),
    date.getMinutes(), date.getSeconds(), date.getMilliseconds(), date.getMicroseconds(), date.getNanoseconds());
  temp.setMinutes(temp.getMinutes() - temp.getTimezoneOffset());
  if (temp.getFullYear() !== date.getFullYear()) {
    temp.setFullYear(date.getFullYear());
  }
  const offset = getTimeZoneOffset(tz, date.getEpochMillis());
  temp.setMinutes(temp.getMinutes() - offset);
  return temp.toHdISOString();
}

export function hdDateToUTC(date: HdDate, tz: string): HdDate {
  const temp = new HdDate(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(),
    date.getMinutes(), date.getSeconds(), date.getMilliseconds());
  temp.setMinutes(temp.getMinutes() - temp.getTimezoneOffset());
  if (temp.getFullYear() !== date.getFullYear()) {
    temp.setFullYear(date.getFullYear());
  }
  const offset = getTimeZoneOffset(tz, date.getEpochMillis());
  temp.setMinutes(temp.getMinutes() - offset);
  return temp;
}


export function dateToUTC(date: Date, tz: string): Date {
  // date;
  const temp = new HdDate(date.getTime());
  temp.setMinutes(temp.getMinutes() - temp.getTimezoneOffset());
  if (temp.getFullYear() !== date.getFullYear()) {
    temp.setFullYear(date.getFullYear());
  }
  const offset = getTimeZoneOffset(tz, date.getTime());
  temp.setMinutes(temp.getMinutes() - offset);
  return new Date(temp.getEpochMillis());

}

export function hdDateTZ(date: HdDate, tz: string): HdDate {
  const temp = new HdDate(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(),
    date.getMinutes(), date.getSeconds(), date.getMilliseconds(), date.getMicroseconds(), date.getNanoseconds());
  temp.setMinutes(temp.getMinutes() - temp.getTimezoneOffset());
  if (temp.getFullYear() !== date.getFullYear()) {
    temp.setFullYear(date.getFullYear());
  }
  const offset = getTimeZoneOffset(tz, date.getEpochMillis());
  temp.setMinutes(temp.getMinutes() + offset);
  return temp;
}

export function hdDateTZDate(date: Date, tz: string): Date {
  const temp = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(),
    date.getMinutes(), date.getSeconds(), date.getMilliseconds());
  temp.setMinutes(temp.getMinutes() - temp.getTimezoneOffset());
  if (temp.getFullYear() !== date.getFullYear()) {
    temp.setFullYear(date.getFullYear());
  }
  const offset = getTimeZoneOffset(tz, date.getTime());
  temp.setMinutes(temp.getMinutes() + offset);
  return temp;
}


// const defaultOptions: Intl.DateTimeFormatOptions = {
//   hour: 'numeric',
//   day: 'numeric',
//   month: 'numeric',
//   year: 'numeric',
//   minute: 'numeric',
//   hour12: false,
// };


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


// [{
//   '$type': 'deltix.tradingserver.messages.TBAccountTransactionMessage',
//   'symbol': '64100000000000000000000000000000',
//   'timestamp': '2020-09-08T07:40:36.338Z',
//   'accountId': '399AD9B0-6897-471E-90AD-66EC7574C07E',
//   'amount': '0.34674',
//   'conversionCurrency': 'BTC',
//   'conversionPrice': '0.00009753647254470218',
//   'currency': 'USD',
//   'dealId': 'C67776E4-B6EF-4421-B387-F73026010F1C',
//   'isGeneratedByServer': true,
//   'isRejected': false,
//   'postBalance': '9765.343115',
//   'sequenceNumber': 552,
//   'transactionId': '5FA7247A-3692-4584-93B5-9F1440ED1478',
//   'type': 'EXECUTION',
//   'userGroupId': '7C86B166-5162-4B55-8AD2-38FA239887D5',
//   'userId': '64186B9E-8937-4C99-BF6A-E61A3E13C503',
// }]
