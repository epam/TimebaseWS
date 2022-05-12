import { Big } from 'big.js';
import { pretty } from './pretty';
import { roundDecimalBy } from './round';
import { ABBREVIATION_SUFFIXES, negate, THOUSAND, ZERO } from './utils';
export var abbreviateDecimal = function (value, options) {
    var _a, _b;
    if (!value) {
        return void 0;
    }
    var targetPrecision = (_a = options === null || options === void 0 ? void 0 : options.precision) !== null && _a !== void 0 ? _a : 2;
    var negative = value.lt(ZERO);
    var abs = negative ? value.abs() : value;
    var roundMode = (_b = options === null || options === void 0 ? void 0 : options.roundMode) !== null && _b !== void 0 ? _b : 0;
    if (abs.gte(THOUSAND)) {
        var suffixNum = Math.floor((abs.toFixed(0).length - 1) / 3);
        var shortValue = ZERO;
        if (options === null || options === void 0 ? void 0 : options.short) {
            for (var precision = 2; precision >= 1; precision--) {
                shortValue = new Big((suffixNum !== 0
                    ? abs.div(Math.pow(1000, suffixNum))
                    : abs).toPrecision(precision));
                var dotLessShortValue = shortValue
                    .toFixed()
                    .replace(/[^a-zA-Z 0-9]+/g, '');
                if (dotLessShortValue.length <= 2) {
                    break;
                }
            }
            if (!shortValue.mod(1).eq(ZERO)) {
                shortValue = new Big(shortValue.toFixed(1));
            }
        }
        else {
            shortValue = (suffixNum !== 0 ? abs.div(Math.pow(1000, suffixNum)) : abs).round(targetPrecision, roundMode);
        }
        if (negative) {
            shortValue = negate(shortValue);
        }
        return "" + pretty(shortValue, options) + ABBREVIATION_SUFFIXES[suffixNum];
    }
    if (targetPrecision != null) {
        value = roundDecimalBy(value, targetPrecision, roundMode);
    }
    return pretty(value, options);
};
