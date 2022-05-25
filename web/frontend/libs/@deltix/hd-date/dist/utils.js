import { DateTimeFormat, FullNameDigit } from "./types";
export var DENOMINATOR = 1000;
export var REGULAR_LETTERS = /[A-Za-z]+/ig;
export var REGULAR_ISO = /[0-9]{4}\-[0-9][0-9]?\-[0-9][0-9]?[T]?[0-9][0-9]?:[0-9][0-9]?:[0-9][0-9]?\.?[0-9]?[0-9]?[0-9]?/;
export var REGULAR_TIME = "[0-9][0-9]?\:[0-9][0-9]?\:[0-9][0-9]?";
export var REGULAR_DATE = "[A-Za-z]{3}\,? [A-Za-z]{3} [0-9]{2} [0-9]{4}?";
export var REGULAR_LOCAL_DATE = "[0-9]+\/[0-9]+\/[0-9]{4}";
export var REGULAR_UTC_DATE = "[A-Za-z]{3}, [0-9]{2} [A-Za-z]{3} [0-9]{4}";
export var FORMAT_DEFAULT = "MM/dd/yyyy hh:mm:ss.fffffffff tt";
export var FORMAT_ISO = "yyyy-MM-dd HH:mm:ss.fffffffff";
var HOURS;
export function getValueDigit(date, format, locale) {
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
export function getFullNameDigit(digit) {
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
export function padStart(numberSymbol, word) {
    while (numberSymbol !== 0) {
        word = "0" + word;
        numberSymbol--;
    }
    return word;
}
export function getStringByFormat(values, format, formatString) {
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
export function getEndTime(hdDate) {
    var sec = hdDate.getSeconds().toString();
    return ":" + addLiddingZero(3, sec) + " ";
}
export function setValue(digit, value, date) {
    if (digit.length >= 3 && digit.length !== 4) {
        if (digit.length === 3) {
            date.setMilliseconds(value);
        }
        else if (digit.length === 6 || digit.length === 9) {
            var mili = value.toString().slice(0, 3);
            var nanoFr = value.toString().slice(3, value.toString().length);
            if (mili !== "") {
                date.setMilliseconds(Number(mili));
            }
            if (nanoFr !== "") {
                if (nanoFr.length < 4) {
                    date.setNanosFraction(Number(nanoFr) * 1000);
                }
                else {
                    date.setNanosFraction(Number(nanoFr));
                }
            }
        }
    }
    else {
        var nameDigit = getFullNameDigit(digit);
        if (nameDigit != null) {
            if (nameDigit === FullNameDigit.Month) {
                date["set" + nameDigit](value - 1);
            }
            else {
                date["set" + nameDigit](value);
            }
        }
    }
}
export function checkData(digit, value, hdDate) {
    var nameDigit = getFullNameDigit(digit);
    if ((nameDigit === FullNameDigit.Month && hdDate["get" + nameDigit]() + 1 !== parseInt(value)) ||
        (nameDigit === FullNameDigit.Date && hdDate["get" + nameDigit]() !== parseInt(value))) {
        return false;
    }
    return true;
}
export function getValue(values, digit) {
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
export function correctHours(value, digit) {
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
export function convertDate(values, format) {
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

//# sourceMappingURL=utils.js.map
