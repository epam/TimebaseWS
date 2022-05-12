(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (factory((global['deltix-hd-date'] = {})));
}(this, (function (exports) { 'use strict';

    var DateTimeFormat;
    (function (DateTimeFormat) {
        DateTimeFormat["YYYY"] = "YYYY";
        DateTimeFormat["yyyy"] = "yyyy";
        DateTimeFormat["yy"] = "yy";
        DateTimeFormat["MM"] = "MM";
        DateTimeFormat["MMM"] = "MMM";
        DateTimeFormat["MMMM"] = "MMMM";
        DateTimeFormat["Www"] = "Www";
        DateTimeFormat["dd"] = "dd";
        DateTimeFormat["hh"] = "hh";
        DateTimeFormat["HH"] = "HH";
        DateTimeFormat["mm"] = "mm";
        DateTimeFormat["ss"] = "ss";
        DateTimeFormat["tt"] = "tt";
    })(DateTimeFormat || (DateTimeFormat = {}));
    var FullNameDigit;
    (function (FullNameDigit) {
        FullNameDigit["Month"] = "Month";
        FullNameDigit["Date"] = "Date";
        FullNameDigit["FullYear"] = "FullYear";
        FullNameDigit["Hours"] = "Hours";
        FullNameDigit["Minutes"] = "Minutes";
        FullNameDigit["Seconds"] = "Seconds";
        FullNameDigit["Milliseconds"] = "Milliseconds";
    })(FullNameDigit || (FullNameDigit = {}));

    var DENOMINATOR = 1000;
    var REGULAR_LETTERS = /[A-Za-z]+/ig;
    var REGULAR_ISO = /[0-9]{4}\-[0-9][0-9]?\-[0-9][0-9]?[T]?[0-9][0-9]?:[0-9][0-9]?:[0-9][0-9]?\.?[0-9]?[0-9]?[0-9]?/;
    var FORMAT_DEFAULT = "MM/dd/yyyy hh:mm:ss.fffffffff tt";
    var FORMAT_ISO = "yyyy-MM-dd HH:mm:ss.fffffffff";
    var HOURS;
    function getValueDigit(date, format, locale) {
        if (locale === void 0) { locale = "en-us"; }
        var values = [];
        for (var i = 0; i < format.length; i++) {
            var value = void 0;
            if (format[i] === DateTimeFormat.tt) {
                value = date.getHours() >= 12 ? "PM" : "AM";
            }
            else if (format[i] === DateTimeFormat.yy) {
                value = date.getFullYear().toString().slice(2, 4);
            }
            else if (format[i] === DateTimeFormat.hh) {
                var hours = date.getHours();
                value = hours >= 13 ?
                    (hours - 12).toString() :
                    (hours === 0 ? 12 : hours).toString();
            }
            else if (format[i] === DateTimeFormat.MMMM) {
                value = new Intl.DateTimeFormat(locale, { month: "long" }).format(new Date(date.getEpochMillis()));
            }
            else if (format[i] === DateTimeFormat.MMM) {
                value = new Intl.DateTimeFormat(locale, { month: "short" }).format(new Date(date.getEpochMillis()));
            }
            else if (format[i] === DateTimeFormat.Www) {
                value = "W" + date.getWeek();
            }
            else {
                if (format[i].length === 3) {
                    var mili = date.getMilliseconds().toString();
                    value = addLiddingZero(4, mili);
                }
                else if (format[i].length === 6) {
                    var mili = addLiddingZero(4, date.getMilliseconds().toString());
                    var micro = addLiddingZero(4, date.getMicroseconds().toString());
                    value = mili + micro;
                }
                else if (format[i].length === 9) {
                    var mili = addLiddingZero(4, date.getMilliseconds().toString());
                    var nanosFraction = addLiddingZero(7, date.getNanosFraction().toString());
                    value = mili + nanosFraction;
                }
                else {
                    var nameDigit = getFullNameDigit(format[i]);
                    value = nameDigit === FullNameDigit.Month ?
                        (date["get" + nameDigit]() + 1).toString() :
                        (date["get" + nameDigit]()).toString();
                }
            }
            values.push(value);
        }
        return values;
    }
    function getFullNameDigit(digit) {
        if (digit === DateTimeFormat.MM) {
            return FullNameDigit.Month;
        }
        else if (digit === DateTimeFormat.dd) {
            return FullNameDigit.Date;
        }
        else if (digit === DateTimeFormat.yyyy || digit === DateTimeFormat.yy || digit === DateTimeFormat.YYYY) {
            return FullNameDigit.FullYear;
        }
        else if (digit === DateTimeFormat.HH || digit === DateTimeFormat.hh) {
            return FullNameDigit.Hours;
        }
        else if (digit === DateTimeFormat.mm) {
            return FullNameDigit.Minutes;
        }
        else if (digit === DateTimeFormat.ss) {
            return FullNameDigit.Seconds;
        }
        return FullNameDigit.Milliseconds;
    }
    function padStart(numberSymbol, word) {
        while (numberSymbol !== 0) {
            word = "0" + word;
            numberSymbol--;
        }
        return word;
    }
    function getStringByFormat(values, format, formatString) {
        var separators = format.match(/[\/,\-,\.,\:,\,,\\,\s]/ig);
        var letters = formatString != null ? formatString.match(REGULAR_LETTERS) : null;
        var arrayFormat = format.match(REGULAR_LETTERS);
        var str = "";
        var count = 0;
        for (var i = 0; i < arrayFormat.length; i++) {
            if (values[i] != null) {
                if (arrayFormat[i].length > values[i].length) {
                    if ((arrayFormat[i].length === 3 ||
                        arrayFormat[i].length === 6 ||
                        arrayFormat[i].length === 9) &&
                        arrayFormat[i] !== DateTimeFormat.Www) {
                        var val = values[i].length < 3
                            ? padStart(3 - values[i].length, values[i])
                            : values[i];
                        str +=
                            val + padStart(arrayFormat[i].length - val.length, "");
                    }
                    else if (arrayFormat[i] === DateTimeFormat.MMM ||
                        arrayFormat[i] === DateTimeFormat.MMMM ||
                        arrayFormat[i] === DateTimeFormat.Www) {
                        str += values[i];
                    }
                    else {
                        str += padStart(arrayFormat[i].length - values[i].length, values[i]);
                    }
                }
                else {
                    str += values[i];
                }
            }
            else {
                if (arrayFormat[i] === DateTimeFormat.tt) {
                    str += letters != null ? letters[0] : HOURS > 12 ? "PM" : "AM";
                }
                else {
                    str += padStart(arrayFormat[i].length, "");
                }
            }
            if (separators != null && separators[count] != null) {
                str += separators[count];
                count++;
            }
        }
        return str;
    }
    function getEndTime(hdDate) {
        var sec = hdDate.getSeconds().toString();
        return ":" + addLiddingZero(3, sec) + " ";
    }
    function getValue(values, digit) {
        var arrayValues = [];
        for (var i = 0; i < 3; i++) {
            if (digit === DateTimeFormat.yyyy && values[i].length === 4) {
                return values[i];
            }
            else if (values[i].length !== 4) {
                arrayValues.push(values[i]);
            }
        }
        for (var _i = 0, arrayValues_1 = arrayValues; _i < arrayValues_1.length; _i++) {
            var value = arrayValues_1[_i];
            if ((digit === DateTimeFormat.dd && parseInt(value) > 12) ||
                (digit === DateTimeFormat.MM && parseInt(value) <= 12)) {
                return value;
            }
        }
        return arrayValues[arrayValues.length - 1];
    }
    function correctHours(value, digit) {
        var returnValue = value;
        if (digit === DateTimeFormat.HH && parseInt(value) < 12) {
            returnValue = (parseInt(value) + 12).toString();
        }
        else if (digit === DateTimeFormat.hh && parseInt(value) > 12) {
            returnValue = (parseInt(value) - 12).toString();
        }
        if (returnValue.length === 1) {
            return ("0" + returnValue);
        }
        else {
            return returnValue;
        }
    }
    function convertDate(values, format) {
        var createdValues = [];
        var letters = values.match(REGULAR_LETTERS);
        var separator = values.match(/[\/,\-,\.,\\]/);
        var arrayValues = values.match(/\d+/ig);
        var count = 0;
        for (var i = 0; i < format.length; i++) {
            if (separator != null) {
                if (format[0] === DateTimeFormat.yyyy || arrayValues[0].length === 4) {
                    if (format[i] === DateTimeFormat.dd || format[i] === DateTimeFormat.MM || format[i] === DateTimeFormat.yyyy || format[i] === DateTimeFormat.yy) {
                        createdValues.push(getValue(arrayValues, format[i]));
                        count++;
                    }
                }
                else {
                    if (separator[0] === "." || separator[0] === "-" || separator[0] === ",") {
                        if (format[i] === DateTimeFormat.dd) {
                            createdValues.push(arrayValues[0]);
                            count++;
                        }
                        else if (format[i] === DateTimeFormat.MM) {
                            createdValues.push(arrayValues[1]);
                            count++;
                        }
                        else if (format[i] === DateTimeFormat.yyyy) {
                            createdValues.push(getValue(arrayValues, format[i]));
                            count++;
                        }
                        else if (format[i] === DateTimeFormat.yy) {
                            createdValues.push(arrayValues[2]);
                            count++;
                        }
                    }
                    else {
                        if (format[i] === DateTimeFormat.dd || format[i] === DateTimeFormat.MM || format[i] === DateTimeFormat.yyyy || format[i] === DateTimeFormat.yy) {
                            createdValues.push(getValue(arrayValues, format[i]));
                            count++;
                        }
                        else if (format[i] === DateTimeFormat.yy) {
                            createdValues.push(arrayValues[2]);
                            count++;
                        }
                    }
                }
            }
            if (!isNaN(parseInt(arrayValues[count]))) {
                if (format[i] === DateTimeFormat.HH) {
                    HOURS = parseInt(arrayValues[count]);
                    if (letters != null && letters[0] === "PM") {
                        createdValues.push(correctHours(arrayValues[count], format[i]));
                    }
                    else {
                        createdValues.push(arrayValues[count]);
                    }
                    count++;
                }
                else if (format[i] === DateTimeFormat.hh) {
                    HOURS = parseInt(arrayValues[count]);
                    createdValues.push(correctHours(arrayValues[count], format[i]));
                    count++;
                }
                else if (format[i] === DateTimeFormat.mm) {
                    createdValues.push(arrayValues[count]);
                    count++;
                }
                else if (format[i] === DateTimeFormat.ss) {
                    createdValues.push(arrayValues[count]);
                    count++;
                }
                else if (format[i].length === 3 || format[i].length === 6 || format[i].length === 9) {
                    createdValues.push(arrayValues[count].slice(0, format[i].length));
                    count++;
                }
            }
        }
        return createdValues;
    }
    function addLiddingZero(limit, digit) {
        return digit.length < limit ? padStart(limit - 1 - digit.length, digit) : digit;
    }

    var HdDate = (function () {
        function HdDate(values, month, day, hours, min, sec, mili, micro, nano) {
            this.nanoSeconds = 0;
            if (typeof values === "number" && month == null) {
                this.date = new Date(values);
            }
            else if (values instanceof Array) {
                this.date = new Date(values[0]);
                this.nanoSeconds = values[1];
            }
            else if (typeof values === "string") {
                var date = values.match(REGULAR_ISO);
                if (date != null) {
                    this.date = new Date(date[0] + "Z");
                    var length_1 = values[values.length - 1] === "Z" ? values.length - 1 : values.length;
                    var nanoStr = values.substring(date[0].length, length_1);
                    var nano_1 = +nanoStr;
                    this.nanoSeconds = nanoStr.length < 4 ? nano_1 * 1000 : nano_1;
                }
            }
            else if (values instanceof HdDate) {
                this.date = new Date(values.getEpochMillis());
                this.nanoSeconds = values.nanoSeconds;
            }
            else if (arguments.length > 1) {
                this.date = new Date(values, month, day, hours, min, sec, mili);
                if (micro != null) {
                    this.nanoSeconds = micro * DENOMINATOR;
                }
                if (nano != null) {
                    this.nanoSeconds += nano;
                }
            }
            if (this.date == null) {
                this.date = new Date();
            }
        }
        HdDate.prototype.getDay = function () {
            return this.date.getDay();
        };
        HdDate.prototype.getDate = function () {
            return this.date.getDate();
        };
        HdDate.prototype.getEpochMillis = function () {
            return this.date.getTime();
        };
        HdDate.prototype.getFullYear = function () {
            return this.date.getFullYear();
        };
        HdDate.prototype.getHours = function () {
            return this.date.getHours();
        };
        HdDate.prototype.getMicroseconds = function () {
            return Math.floor(this.nanoSeconds / DENOMINATOR);
        };
        HdDate.prototype.getMilliseconds = function () {
            return this.date.getMilliseconds();
        };
        HdDate.prototype.getMinutes = function () {
            return this.date.getMinutes();
        };
        HdDate.prototype.getMonth = function () {
            return this.date.getMonth();
        };
        HdDate.prototype.getNanoseconds = function () {
            return this.nanoSeconds - Math.floor(this.nanoSeconds / DENOMINATOR) * DENOMINATOR;
        };
        HdDate.prototype.getNanosFraction = function () {
            return this.nanoSeconds;
        };
        HdDate.prototype.getSeconds = function () {
            return this.date.getSeconds();
        };
        HdDate.prototype.getTimezoneOffset = function () {
            return this.date.getTimezoneOffset();
        };
        HdDate.prototype.getUTCDate = function () {
            return this.date.getUTCDate();
        };
        HdDate.prototype.getUTCDay = function () {
            return this.date.getUTCDay();
        };
        HdDate.prototype.getUTCFullYear = function () {
            return this.date.getUTCFullYear();
        };
        HdDate.prototype.getUTCHours = function () {
            return this.date.getUTCHours();
        };
        HdDate.prototype.getUTCMicroseconds = function () {
            return this.getMicroseconds();
        };
        HdDate.prototype.getUTCMilliseconds = function () {
            return this.date.getUTCMilliseconds();
        };
        HdDate.prototype.getUTCMinutes = function () {
            return this.date.getUTCMinutes();
        };
        HdDate.prototype.getUTCMonth = function () {
            return this.date.getUTCMonth();
        };
        HdDate.prototype.getUTCNanoseconds = function () {
            return this.getNanoseconds();
        };
        HdDate.prototype.getUTCSeconds = function () {
            return this.date.getUTCSeconds();
        };
        HdDate.prototype.getWeek = function () {
            var date = new HdDate(this);
            date.setHours(0);
            date.setMinutes(0);
            date.setSeconds(0);
            date.setMilliseconds(0);
            date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
            var week1 = new Date(date.getFullYear(), 0, 4);
            return 1 + Math.round(((date.getEpochMillis() - week1.getTime()) / 86400000
                - 3 + (week1.getDay() + 6) % 7) / 7);
        };
        HdDate.prototype.setDate = function (date) {
            this.date.setDate(date);
        };
        HdDate.prototype.setEpochMillis = function (value) {
            this.date = new Date(value);
        };
        HdDate.prototype.setFullYear = function (year) {
            this.date.setFullYear(year);
        };
        HdDate.prototype.setHours = function (hours) {
            this.date.setHours(hours);
        };
        HdDate.prototype.setMicroseconds = function (value) {
            this.nanoSeconds = this.getNanoseconds() + value * DENOMINATOR;
        };
        HdDate.prototype.setMilliseconds = function (ms) {
            this.date.setMilliseconds(ms);
        };
        HdDate.prototype.setMinutes = function (min) {
            this.date.setMinutes(min);
        };
        HdDate.prototype.setMonth = function (month) {
            this.date.setMonth(month);
        };
        HdDate.prototype.setNanoseconds = function (value) {
            this.nanoSeconds = value + Math.floor(this.nanoSeconds / DENOMINATOR) * DENOMINATOR;
        };
        HdDate.prototype.setNanosFraction = function (value) {
            this.nanoSeconds = value;
        };
        HdDate.prototype.setSeconds = function (sec) {
            this.date.setSeconds(sec);
        };
        HdDate.prototype.setUTCDate = function (date) {
            this.date.setUTCDate(date);
        };
        HdDate.prototype.setUTCFullYear = function (year) {
            this.date.setUTCFullYear(year);
        };
        HdDate.prototype.setUTCMicroseconds = function (value) {
            this.setMicroseconds(value);
        };
        HdDate.prototype.setUTCHours = function (hours) {
            this.date.setUTCHours(hours);
        };
        HdDate.prototype.setUTCMilliseconds = function (ms) {
            this.date.setUTCMilliseconds(ms);
        };
        HdDate.prototype.setUTCMinutes = function (min) {
            this.date.setUTCMinutes(min);
        };
        HdDate.prototype.setUTCMonth = function (month) {
            this.date.setUTCMonth(month);
        };
        HdDate.prototype.setUTCNanoseconds = function (value) {
            this.setNanoseconds(value);
        };
        HdDate.prototype.setUTCSeconds = function (sec) {
            this.date.setUTCSeconds(sec);
        };
        HdDate.prototype.toDateString = function () {
            return this.date.toDateString();
        };
        HdDate.prototype.toHdTimeString = function () {
            var time = getEndTime(this);
            var timeString = this.date.toTimeString();
            var index = timeString.indexOf(time);
            var HdTimeString = timeString.substring(0, index + 3);
            var nanoFr = this.getNanosFraction().toString();
            var mili = this.getMilliseconds().toString();
            return HdTimeString + "." + padStart(3 - mili.length, mili) + padStart(6 - nanoFr.length, nanoFr) + timeString.substring(index + 3, timeString.length);
        };
        HdDate.prototype.toHdISOString = function () {
            var ISOString = this.date.toISOString();
            var HdISOString = ISOString;
            var index = ISOString.indexOf("Z");
            if (index > 0) {
                HdISOString = ISOString.substring(0, index);
            }
            var nanoFr = this.getNanosFraction().toString();
            return "" + HdISOString + padStart(6 - nanoFr.length, nanoFr) + "Z";
        };
        HdDate.prototype.toHdLocaleString = function () {
            var time = getEndTime(this);
            var localString = this.date.toLocaleString();
            var index = localString.indexOf(time);
            var HdLocaleString = localString.substring(0, index + 3);
            var nanoFr = this.getNanosFraction().toString();
            var mili = this.getMilliseconds().toString();
            return HdLocaleString + "." + padStart(3 - mili.length, mili) + padStart(6 - nanoFr.length, nanoFr) + localString.substring(index + 3, localString.length);
        };
        HdDate.prototype.toHdLocaleTimeString = function () {
            var time = getEndTime(this);
            var timeString = this.date.toLocaleTimeString();
            var index = timeString.indexOf(time);
            var HdLocaleTimeString = timeString.substring(0, index + 3);
            var nanoFr = this.getNanosFraction().toString();
            var mili = this.getMilliseconds().toString();
            return HdLocaleTimeString + "." + padStart(3 - mili.length, mili) + padStart(6 - nanoFr.length, nanoFr) + timeString.substring(index + 3, timeString.length);
        };
        HdDate.prototype.toHdString = function () {
            var time = getEndTime(this);
            var timeString = this.date.toString();
            var index = timeString.indexOf(time);
            var HdString = timeString.substring(0, index + 3);
            var nanoFr = this.getNanosFraction().toString();
            var mili = this.getMilliseconds().toString();
            return HdString + "." + padStart(3 - mili.length, mili) + padStart(6 - nanoFr.length, nanoFr) + timeString.substring(index + 3, timeString.length);
        };
        HdDate.prototype.toISOString = function () {
            return this.date.toISOString();
        };
        HdDate.prototype.toJSON = function () {
            return this.date.toJSON();
        };
        HdDate.prototype.toLocaleDateString = function () {
            return this.date.toLocaleDateString();
        };
        HdDate.prototype.toLocaleFormat = function (format, locale) {
            var values = getValueDigit(this, format.match(REGULAR_LETTERS));
            return getStringByFormat(values, format, locale);
        };
        HdDate.prototype.toLocaleString = function () {
            return this.date.toLocaleString();
        };
        HdDate.prototype.toLocaleTimeString = function () {
            return this.date.toLocaleTimeString();
        };
        HdDate.prototype.toString = function () {
            return this.date.toString();
        };
        HdDate.prototype.toTimeString = function () {
            return this.date.toTimeString();
        };
        HdDate.prototype.toUTCString = function () {
            return this.date.toUTCString();
        };
        HdDate.prototype.valueOf = function () {
            return this.toHdISOString();
        };
        HdDate.prototype.parseIso = function (isoFormatString) {
            var values = convertDate(isoFormatString, FORMAT_ISO.match(REGULAR_LETTERS));
            var str = getStringByFormat(values, FORMAT_ISO);
            var index = str.indexOf(" ");
            return str.substring(0, index) + "T" + str.substring(index + 1, str.length) + "Z";
        };
        HdDate.prototype.parseFormat = function (format, formatString) {
            var values = convertDate(formatString, format.match(REGULAR_LETTERS));
            return getStringByFormat(values, format, formatString);
        };
        HdDate.prototype.tryParse = function (arbitraryString) {
            var values = convertDate(arbitraryString, FORMAT_DEFAULT.match(REGULAR_LETTERS));
            return getStringByFormat(values, FORMAT_DEFAULT, arbitraryString);
        };
        HdDate.prototype.lt = function (hdDate) {
            return (this.date.getTime() === hdDate.getEpochMillis() && this.nanoSeconds < hdDate.getNanosFraction())
                || this.date.getTime() < hdDate.getEpochMillis();
        };
        HdDate.prototype.lte = function (hdDate) {
            return this.lt(hdDate) || this.eq(hdDate);
        };
        HdDate.prototype.gt = function (hdDate) {
            return (this.date.getTime() === hdDate.getEpochMillis() && this.nanoSeconds > hdDate.getNanosFraction())
                || this.date.getTime() > hdDate.getEpochMillis();
        };
        HdDate.prototype.gte = function (hdDate) {
            return this.gt(hdDate) || this.eq(hdDate);
        };
        HdDate.prototype.eq = function (hdDate) {
            return this.date.getTime() === hdDate.getEpochMillis() && this.nanoSeconds === hdDate.getNanosFraction();
        };
        return HdDate;
    }());

    exports.HdDate = HdDate;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
