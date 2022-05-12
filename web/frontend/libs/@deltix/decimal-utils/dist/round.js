import { Big } from 'big.js';
import { ONE, ONE_TENTH, ZERO } from './utils';
export var roundDecimal = function (value, precision, roundMode) {
    if (value == null) {
        return null;
    }
    if (precision == null) {
        return value;
    }
    precision = new Big(precision);
    if (precision.eq(ZERO)) {
        return ZERO;
    }
    return value.div(precision).round(0, roundMode).times(precision);
};
export var roundDecimalBy = function (value, precision, roundMode) {
    if (value == null) {
        return null;
    }
    if (precision == null) {
        return value;
    }
    var p = new Big(precision);
    if (p.eq(ZERO)) {
        return value.round(0, roundMode);
    }
    if (p.mod(ONE).eq(ZERO)) {
        p = ONE_TENTH.pow(+precision);
    }
    return value.div(p).round(0, roundMode).times(p);
};
