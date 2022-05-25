import { Big } from 'big.js';
var NAN_UNDERLYING = '8935141660703064064';
var NULL_UNDERLYING = '18446744073709551488';
var POSITIVE_INFINITY_UNDERLYING = '8646911284551352320';
var NEGATIVE_INFINITY_UNDERLYING = '17870283321406128128';
export var ONE = new Big(1);
export var ZERO = new Big(0);
export var HUNDRED = new Big(100);
export var THOUSAND = new Big(1000);
export var ONE_TENTH = new Big('0.1');
export var ABBREVIATION_SUFFIXES = ['', 'K', 'M', 'B', 'T'];
export var NAN = new Big(NAN_UNDERLYING);
export var NULL = new Big(NULL_UNDERLYING);
export var POSITIVE_INFINITY = new Big(POSITIVE_INFINITY_UNDERLYING);
export var NEGATIVE_INFINITY = new Big(NEGATIVE_INFINITY_UNDERLYING);
export var negate = function (value) { return value.times(-1); };
export var decimalIsFinite = function (value) {
    return value &&
        !value.eq(NULL) &&
        !value.eq(NAN) &&
        !value.eq(POSITIVE_INFINITY) &&
        !value.eq(NEGATIVE_INFINITY);
};
export var toDecimal = function (decimal) {
    if (decimal == null) {
        return decimal;
    }
    if (decimal instanceof Big) {
        return decimal;
    }
    switch (decimal) {
        case '0':
        case 0:
            return ZERO;
        case '1':
        case 1:
            return ONE;
        case '0.1':
        case 0.1:
            return ONE_TENTH;
        case '100':
        case 100:
            return HUNDRED;
        case '1000':
        case 1000:
            return THOUSAND;
        case NAN_UNDERLYING:
            return NAN;
        case NULL_UNDERLYING:
            return NULL;
        case POSITIVE_INFINITY_UNDERLYING:
            return POSITIVE_INFINITY;
        case NEGATIVE_INFINITY_UNDERLYING:
            return NEGATIVE_INFINITY;
        default:
            return new Big(decimal);
    }
};
