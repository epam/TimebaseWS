# `HdDate` class spec
* Class is a wrapper for two fields: `Date` and `Number` where `Date` stores the major date/time part up to milliseconds. while `Number` stores micro- and nanosecond fractions (value range: 0..999 999).
* `HdDate` class provides the interface of `Date` class and extends it with methods to work with microseconds and nanoseconds.
* `HdDate` provides 3 major parsing methods for strings:
  - `parseIso(isoFormatString)`
  - `parseFormat(format, formatString)`
  - `tryParse(arbitraryString)`
* Constructors:
  - `new HdDate();` - constructs new HdDate of now
  - `new HdDate(HdDate);`- constructs new HdDate on base HdDate
  - `new HdDate(isoString);`- constructs new HdDate on a string in iso format
  - `new HdDate(epochMillis);`- constructs new HdDate of miliseconds that passed since` 1970-01-01 00:00:00 UTC`
  - `new HdDate([epochMillis, nanosFraction]);` - constructs new HdDate of milliseconds that passed since` 1970-01-01 00:00:00 UTC` and a nanosecond component
  - `new HdDate(year, month[, date[, hours[, minutes[, seconds[, milliseconds[, microseconds[,nanoseconds]]]]]]])`
* Getters:
  - `HdDate.prototype.getDate()` *(Proxy to Date object)* - Returns the day of the month (1-31) for the specified date according to local time.
  - `HdDate.prototype.getDay()` *(Proxy to Date object)* - Returns the day of the week (0-6) for the specified date according to local time.
  - `HdDate.prototype.getEpochMillis()` *(Proxy to Date object)* - Returns the numeric value of the specified date as the number of milliseconds since January 1, 1970, 00:00:00 UTC (negative for prior times).
  - `HdDate.prototype.getFullYear()` *(Proxy to Date object)* - Returns the year (4 digits for 4-digit years) of the specified date according to local time.
  - `HdDate.prototype.getHours()` *(Proxy to Date object)* - Returns the hour (0-23) in the specified date according to local time.
  - `HdDate.prototype.getMicroseconds()`- Returns the microseconds (0-999) in the specified date according to local time.
  - `HdDate.prototype.getMilliseconds()` *(Proxy to Date object)*- Returns the milliseconds (0-999) in the specified date according to local time.
  - `HdDate.prototype.getMinutes()` *(Proxy to Date object)* - Returns the minutes (0-59) in the specified date according to local time.
  - `HdDate.prototype.getMonth()` *(Proxy to Date object)* - Returns the month (0-11) in the specified date according to local time.
  - `HdDate.prototype.getNanoseconds()`- Returns the nanoseconds (0-999) in the specified date according to local time.
  - `HdDate.prototype.getNanosFraction()`- Returns the micro- and nanoseconds component (0-999 999) that is complementary to `getEpochMillis` to provide a date with nanosecond resolution.
  - `HdDate.prototype.getSeconds()` *(Proxy to Date object)* - Returns the seconds (0-59) in the specified date according to local time.
  - `HdDate.prototype.getTimezoneOffset()` *(Proxy to Date object)* - Returns the time-zone offset in minutes for the current locale.
  - `HdDate.prototype.getUTCDate()` *(Proxy to Date object)* - Returns the day (date) of the month (1-31) in the specified date according to universal time.
  - `HdDate.prototype.getUTCDay()` *(Proxy to Date object)* - Returns the day of the week (0-6) in the specified date according to universal time.
  - `HdDate.prototype.getUTCFullYear()` *(Proxy to Date object)* - Returns the year (4 digits for 4-digit years) in the specified date according to universal time.
  - `HdDate.prototype.getUTCHours()` *(Proxy to Date object)* - Returns the hours (0-23) in the specified date according to universal time.
  - `HdDate.prototype.getUTCMicroseconds()` - Returns the microseconds (0-999) in the specified date according to universal time.
  - `HdDate.prototype.getUTCMilliseconds()` *(Proxy to Date object)* - Returns the milliseconds (0-999) in the specified date according to universal time.
  - `HdDate.prototype.getUTCMinutes()` *(Proxy to Date object)* - Returns the minutes (0-59) in the specified date according to universal time.
  - `HdDate.prototype.getUTCMonth()` *(Proxy to Date object)* - Returns the month (0-11) in the specified date according to universal time.
  - `HdDate.prototype.getUTCNanoseconds()` - Returns the nanoseconds (0-999) in the specified date according to universal time.
  - `HdDate.prototype.getUTCSeconds()` *(Proxy to Date object)* - Returns the seconds (0-59) in the specified date according to universal time.
  - `HdDate.prototype.getWeeks()` - Returns the numeric of weeks since start year.
* Setters:
  - `HdDate.prototype.setDate()` - Sets the day of the month for a specified date according to local time.
  - `HdDate.prototype.setEpochMillis()` *(Proxy to Date object)* - Sets the Date object to the time represented by a number of milliseconds since January 1, 1970, 00:00:00 UTC, allowing for negative numbers for times prior.
  - `HdDate.prototype.setFullYear()` *(Proxy to Date object)* - Sets the full year (e.g. 4 digits for 4-digit years) for a specified date according to local time.
  - `HdDate.prototype.setHours()` *(Proxy to Date object)* - Sets the hours for a specified date according to local time.
  - `HdDate.prototype.setMicroseconds()` - Sets the microseconds for a specified date according to local time.
  - `HdDate.prototype.setMilliseconds()` *(Proxy to Date object)* - Sets the milliseconds for a specified date according to local time.
  - `HdDate.prototype.setMinutes()` *(Proxy to Date object)* - Sets the minutes for a specified date according to local time.
  - `HdDate.prototype.setMonth()` *(Proxy to Date object)* - Sets the month for a specified date according to local time.
  - `HdDate.prototype.setNanoseconds()` - Sets the nanoseconds for a specified date according to local time.
  - `HdDate.prototype.setNanosFraction()`- Sets the micro- and nanoseconds component (0-999 999) that is complementary to `getEpochMillis` to provide a date with nanosecond resolution.
  - `HdDate.prototype.setSeconds()` *(Proxy to Date object)* - Sets the seconds for a specified date according to local time.
  - `HdDate.prototype.setUTCDate()` *(Proxy to Date object)* - Sets the day of the month for a specified date according to universal time.
  - `HdDate.prototype.setUTCFullYear()` *(Proxy to Date object)* - Sets the full year (e.g. 4 digits for 4-digit years) for a specified date according to universal time.
  - `HdDate.prototype.setUTCHours()` *(Proxy to Date object)* - Sets the hour for a specified date according to universal time.
  - `HdDate.prototype.setUTCMicroseconds()` - Sets the microseconds for a specified date according to universal time.
  - `HdDate.prototype.setUTCMilliseconds()` *(Proxy to Date object)* - Sets the milliseconds for a specified date according to universal time.
  - `HdDate.prototype.setUTCMinutes()` *(Proxy to Date object)* - Sets the minutes for a specified date according to universal time.
  - `HdDate.prototype.setUTCMonth()` *(Proxy to Date object)* - Sets the month for a specified date according to universal time.
  - `HdDate.prototype.setUTCNanoseconds()` - Sets the nanoseconds for a specified date according to universal time.
  - `HdDate.prototype.setUTCSeconds()` *(Proxy to Date object)* - Sets the seconds for a specified date according to universal time.
* Converters:
  - `HdDate.prototype.toDateString()` *(Proxy to Date object)* - Returns the "date" portion of the Date as a human-readable string.
  - `HdDate.prototype.toHdTimeString()` - Returns the "time" portion of the Date as a human-readable string with nanosecond precision.
  - `HdDate.prototype.toHdISOString()` - Converts a date to a string following the ISO 8601 Extended Format with nanosecond precision.
  - `HdDate.prototype.toHdLocaleString()` - Returns a string with a locality sensitive representation of this date with nanosecond precision.
  - `HdDate.prototype.toHdLocaleTimeString()` - Returns a string with a locality sensitive representation of the time portion of this date based on system settings with nanosecond precision.
  - `HdDate.prototype.toHdString()` - Returns a string representing the specified Date object with nanosecond precision.
  - `HdDate.prototype.toHdTimeString()` - Returns the "time" portion of the Date as a human-readable string with nanosecond precision.
  - `HdDate.prototype.toISOString()` *(Proxy to Date object)* - Converts a date to a string following the ISO 8601 Extended Format.
  - `HdDate.prototype.toJSON()` *(Proxy to Date object)* - Returns a string representing the Date using toISOString(). Intended for use by JSON.stringify().
  - `HdDate.prototype.toLocaleDateString()` *(Proxy to Date object)* - Returns a string with a locality sensitive representation of the date portion of this date based on system settings.
  - `HdDate.prototype.toLocaleFormat()` *(Proxy to Date object)* - Converts a date to a string, using a format string.
  - `HdDate.prototype.toLocaleString()` *(Proxy to Date object)* - Returns a string with a locality sensitive representation of this date. Overrides the Object.prototype.toLocaleString() method.
  - `HdDate.prototype.toLocaleTimeString()` *(Proxy to Date object)* - Returns a string with a locality sensitive representation of the time portion of this date based on system settings.
  - `HdDate.prototype.toString()` *(Proxy to Date object)* - Returns a string representing the specified Date object. Overrides the Object.prototype.toString() method.
  - `HdDate.prototype.toTimeString()` *(Proxy to Date object)* - Returns the "time" portion of the Date as a human-readable string.
  - `HdDate.prototype.toUTCString()` *(Proxy to Date object)* - Converts a date to a string using the UTC timezone.
  - `HdDate.prototype.valueOf()` - Returns the string value of a HdDate object. Overrides the Object.prototype.valueOf() method. Functional equivalent to `HdDate.prototype.toHdISOString()`
