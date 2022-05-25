import { Big } from 'big.js';
export var equalDecimal = function (value1, value2) {
    if (value1 == null && value2 == null) {
        return true;
    }
    if (value1 == null || value2 == null) {
        return false;
    }
    return value1.eq(value2);
};
export var minDecimal = function (d1, d2) { return (d1.lte(d2) ? d1 : d2); };
export var maxDecimal = function (d1, d2) { return (d1.gte(d2) ? d1 : d2); };
export var compareDecimals = function (value1, value2) {
    if (value1 == null && value2 == null) {
        return 0;
    }
    if (value1 == null) {
        return 1;
    }
    if (value2 == null) {
        return -1;
    }
    if (!(value1 instanceof Big)) {
        value1 = new Big(value1);
    }
    if (!(value2 instanceof Big)) {
        value2 = new Big(value2);
    }
    if (value1.gt(value2)) {
        return 1;
    }
    if (value1.lt(value2)) {
        return -1;
    }
    return 0;
};
