import { negate, ZERO } from './utils';
var trimEnd = function (str, delimiter) {
    if (delimiter === void 0) { delimiter = '0'; }
    var newLength = str.length;
    while (str[newLength - 1] && str[newLength - 1] === delimiter) {
        newLength--;
    }
    return str.substr(0, newLength);
};
export var pretty = function (value, options) {
    if (!value) {
        return void 0;
    }
    var negative = false;
    if (value.lt(ZERO)) {
        negative = true;
        value = negate(value);
    }
    var _a = value.toFixed().split('.'), int = _a[0], decimal = _a[1];
    var buf = [];
    var thousandsDelimiter = options === null || options === void 0 ? void 0 : options.thousands;
    var str;
    if (int.length > 3) {
        for (var i = int.length - 1, j = 0; i >= 0; i--, j++) {
            if (thousandsDelimiter && j > 0 && j % 3 === 0) {
                buf.unshift(thousandsDelimiter);
            }
            buf.unshift(int[i]);
        }
        str = buf.join('');
    }
    else {
        str = int;
    }
    if (decimal) {
        var d = options === null || options === void 0 ? void 0 : options.decimal;
        var t = !(options === null || options === void 0 ? void 0 : options.trailingZero) ? trimEnd(decimal) : decimal;
        str = t.length ? str + (d == null ? '.' : d) + decimal : str;
    }
    return negative ? '-' + str : str;
};
