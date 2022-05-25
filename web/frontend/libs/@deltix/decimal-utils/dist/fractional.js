import { Big } from 'big.js';
var ALL_SUBFRACTIONS = new Map([
    [1, ['']],
    [2, ['', '+']],
    [4, ['', '1/4', '+', '3/4']],
    [8, ['', '1/8', '1/4', '3/8', '+', '5/8', '3/4', '7/8']],
    [
        16,
        [
            '',
            '1/16',
            '1/8',
            '3/16',
            '1/4',
            '5/16',
            '3/8',
            '7/16',
            '+',
            '9/16',
            '5/8',
            '11/16',
            '3/4',
            '13/16',
            '7/8',
            '15/16',
        ],
    ],
]);
var DECIMAL_SUBFRACTION_NUMBER = new Map([
    [2, 1],
    [4, 2],
    [8, 3],
    [16, 4],
    [32, 5],
    [64, 6],
]);
var formatterD2 = new Intl.NumberFormat('en-US', {
    minimumIntegerDigits: 2,
    useGrouping: false,
});
var FractionalNumber = (function () {
    function FractionalNumber(mainFractionFormat, subFractionFormat) {
        this.mainFractionFormat = mainFractionFormat;
        this.subFractionFormat = subFractionFormat;
        this.mainFraction = 0;
        this.subFraction = 0;
    }
    return FractionalNumber;
}());
var fractionalNumberToString = function (integer, fractionSymbol, mainFraction, subFraction) { return "" + integer + fractionSymbol + (mainFraction + subFraction); };
var float2int = function (value) { return value | 0; };
var trimEnd = function (text, charToRemove) {
    var i = 0;
    while (text[text.length - 1 - i] === charToRemove) {
        i++;
    }
    return i === 0 ? text : text.substr(0, text.length - i);
};
var fromNumber = function (value, mainFractionFormat, subFractionFormat) {
    if (isNaN(value) || !isFinite(value)) {
        var fractionalNumber = new FractionalNumber(mainFractionFormat, subFractionFormat);
        fractionalNumber.integer = value;
        return fractionalNumber;
    }
    var result = new FractionalNumber(mainFractionFormat, subFractionFormat);
    result.sign = 1;
    if (value < 0) {
        result.sign = -1;
        value *= -1;
    }
    result.integer = float2int(value);
    var fv = value - result.integer;
    var fv1 = fv * mainFractionFormat;
    result.mainFraction = float2int(fv1);
    var fv2 = fv1 - result.mainFraction;
    var fv3 = fv2 * subFractionFormat;
    result.subFraction = float2int(fv3);
    return result;
};
var toStringWithDecimalSubfraction = function (fn, mainFractionFormat, subFractionFormat) {
    if (isNaN(fn.integer) || !isFinite(fn.integer)) {
        return fn.integer.toString();
    }
    var dsfs = '';
    if (subFractionFormat !== 0) {
        var dsf = fn.subFraction / subFractionFormat;
        var count = DECIMAL_SUBFRACTION_NUMBER.get(subFractionFormat);
        if (count != null) {
            var m = Math.pow(10, count);
            var formatter = new Intl.NumberFormat('en-US', {
                minimumIntegerDigits: count,
                useGrouping: false,
            });
            dsfs = formatter.format(float2int(dsf * m));
        }
        else {
            dsfs = dsf.toString();
        }
        dsfs = trimEnd(dsfs, '0');
    }
    return "" + (fn.sign < 0 ? '-' : '') + fn.integer + "-" + formatterD2.format(fn.mainFraction) + dsfs;
};
var toFractionalNumberString = function (fn, mainFractionFormat, subFractionFormat, subFractions, padding) {
    var result = '';
    if (subFractions != null) {
        result = "" + (fn.subFraction === 0 ||
            Math.abs(fn.subFraction / fn.subFractionFormat - 0.5) < 0.0001
            ? ''
            : ' ') + subFractions[fn.subFraction];
        if (padding) {
            result = result.padEnd(1 + subFractions[subFractions.length - 1].length);
        }
    }
    else if (subFractionFormat !== 0) {
        result = " " + (fn.subFraction + '/' + subFractionFormat);
    }
    return fractionalNumberToString((fn.sign < 0 ? '-' : '') + fn.integer, '-', formatterD2.format(fn.mainFraction), result);
};
var toNumber = function (fn, mainFractionFormat, subFractionFormat) {
    if (isNaN(fn.integer) || !isFinite(fn.integer)) {
        return fn.integer;
    }
    var total = fn.integer;
    total += fn.mainFraction / mainFractionFormat;
    if (subFractionFormat !== 0) {
        total += fn.subFraction / (mainFractionFormat * subFractionFormat);
    }
    return total * fn.sign;
};
var tryParseAsFractionalNumber = function (s, mainFractionFormat, subFractionFormat) {
    if (s == null) {
        return null;
    }
    s = s.trim();
    if (s.length === 0) {
        return null;
    }
    var result = new FractionalNumber(mainFractionFormat, subFractionFormat);
    result.sign = 1;
    if (s[0] === '-') {
        result.sign = -1;
        s = s.substr(1, s.length - 1);
    }
    var indexOf = s.indexOf('-');
    var integer;
    if (indexOf === -1) {
        integer = parseInt(s, 10);
        if (isNaN(integer)) {
            return null;
        }
        result.integer = integer;
        return result;
    }
    integer = parseInt(s.substr(0, indexOf), 10);
    result.integer = integer;
    if (isNaN(integer)) {
        return null;
    }
    if (indexOf + 1 + 2 > s.length) {
        return null;
    }
    result.mainFraction = parseInt(s.substr(indexOf + 1, 2), 10);
    if (isNaN(result.mainFraction)) {
        return null;
    }
    if (result.mainFraction > mainFractionFormat) {
        return null;
    }
    if (indexOf + 2 + 1 + (s.length - indexOf - 2 - 1) > s.length) {
        return null;
    }
    var subFraction = s
        .substr(indexOf + 2 + 1, s.length - indexOf - 2 - 1)
        .trim();
    if (subFraction.indexOf('+') >= 0 || subFraction.indexOf('/') >= 0) {
        var subFractions = ALL_SUBFRACTIONS.get(subFractionFormat);
        if (subFractions) {
            result.subFraction = subFractions.indexOf(subFraction);
        }
        else {
            indexOf = subFraction.indexOf('/');
            if (indexOf === -1) {
                return null;
            }
            result.subFraction = parseInt(subFraction.substr(0, indexOf), 10);
            if (isNaN(result.subFraction)) {
                return null;
            }
        }
    }
    else {
        if (subFraction.length === 0) {
            result.subFraction = 0;
        }
        else {
            var count = DECIMAL_SUBFRACTION_NUMBER.get(subFractionFormat);
            if (!count) {
                return null;
            }
            var sf = parseInt(subFraction, 10);
            if (isNaN(sf)) {
                return null;
            }
            if (subFraction.length !== count) {
                sf = float2int(sf * Math.pow(10, count - subFraction.length));
            }
            result.subFraction = float2int((sf * subFractionFormat) / Math.pow(10, count));
        }
    }
    if (!(result.subFraction >= 0 && result.subFraction <= subFractionFormat)) {
        return null;
    }
    return result;
};
var toString = function (fn, mainFractionFormat, subFractionFormat, padding) {
    if (isNaN(fn.integer) || !isFinite(fn.integer)) {
        return fn.integer.toString();
    }
    var subfractions = ALL_SUBFRACTIONS.get(subFractionFormat);
    return toFractionalNumberString(fn, mainFractionFormat, subFractionFormat, subfractions, padding);
};
export var toFractional = function (decimal, mainFraction, subFraction) {
    if (mainFraction === void 0) { mainFraction = 32; }
    if (subFraction === void 0) { subFraction = 16; }
    if (!decimal) {
        return '';
    }
    var fractional = fromNumber(Number(decimal), mainFraction, subFraction);
    return toString(fractional, mainFraction, subFraction, false);
};
export var toFractionalDecimalSubfraction = function (decimal, mainFraction, subFraction) {
    if (mainFraction === void 0) { mainFraction = 32; }
    if (subFraction === void 0) { subFraction = 16; }
    if (!decimal) {
        return '';
    }
    var fractional = fromNumber(Number(decimal), mainFraction, subFraction);
    return toStringWithDecimalSubfraction(fractional, mainFraction, subFraction);
};
export var fromFractional = function (str, mainFraction, subFraction) {
    if (mainFraction === void 0) { mainFraction = 32; }
    if (subFraction === void 0) { subFraction = 16; }
    if (!str) {
        return null;
    }
    var fractional = tryParseAsFractionalNumber(str, mainFraction, subFraction);
    if (!fractional) {
        return null;
    }
    var value = toNumber(fractional, mainFraction, subFraction);
    return new Big(value);
};
