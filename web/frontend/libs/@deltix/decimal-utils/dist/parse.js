import { Big } from 'big.js';
import { ABBREVIATION_SUFFIXES, negate, ZERO } from './utils';
export var baseParseOptions = Object.freeze({
    decimal: '.',
    abbreviate: true,
});
export var parseDecimal = function (value, options) {
    if (options === void 0) { options = baseParseOptions; }
    if (!value) {
        return void 0;
    }
    if (typeof value === 'number') {
        return new Big(value);
    }
    var buf = [];
    var multiplier = 0;
    var last = value.length - 1;
    var decimalDelimiter = (options === null || options === void 0 ? void 0 : options.decimal) || '.';
    var decimalIndex;
    var negative = false;
    var abbreviate = options === null || options === void 0 ? void 0 : options.abbreviate;
    for (var i = last; i >= 0; i--) {
        var char = value[i];
        if (char === decimalDelimiter) {
            if (i === last) {
                continue;
            }
            buf.push(char);
            if (decimalIndex != null) {
                buf.splice(decimalIndex, 1);
            }
            decimalIndex = buf.length - 1;
            continue;
        }
        if (isFinite(parseInt(char, 10))) {
            buf.push(char);
        }
        else if (i === last && abbreviate) {
            var index = ABBREVIATION_SUFFIXES.indexOf(char.toUpperCase());
            if (index >= 0) {
                multiplier = index;
                continue;
            }
        }
        else if (i === 0 && char === '-') {
            negative = true;
        }
    }
    buf.reverse();
    if (!buf.length) {
        return void 0;
    }
    var big = new Big(buf.join(''));
    big = multiplier > 0 ? big.times(Math.pow(1000, multiplier)) : big;
    return negative && !big.eq(ZERO) ? negate(big) : big;
};
