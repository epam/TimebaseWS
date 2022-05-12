var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
import { abbreviateDecimal } from './abbreviate';
import { pretty } from './pretty';
import { roundDecimal } from './round';
export var baseFormatOptions = Object.freeze({
    decimal: '.',
    thousands: '\u00A0',
});
export var formatDecimal = function (value, options) {
    if (options === void 0) { options = baseFormatOptions; }
    if (!value) {
        return void 0;
    }
    if (options !== baseFormatOptions) {
        options = __assign(__assign({}, baseFormatOptions), options);
    }
    var rounded = roundDecimal(value, options === null || options === void 0 ? void 0 : options.precision, options === null || options === void 0 ? void 0 : options.roundMode);
    if (options === null || options === void 0 ? void 0 : options.abbreviate) {
        return abbreviateDecimal(rounded, options);
    }
    return pretty(rounded, options);
};
