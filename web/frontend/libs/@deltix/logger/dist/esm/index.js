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
import { global } from './global';
import { log } from './log';
var setLevelInternal = function (level, ns) {
    var _a;
    if (ns === void 0) { ns = ''; }
    return (global.deltixLogLevel = __assign(__assign({}, global.deltixLogLevel), (_a = {}, _a[ns] = level, _a)));
};
export var setLevel = function (level) {
    return setLevelInternal(level);
};
export var error = function () {
    var messages = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        messages[_i] = arguments[_i];
    }
    return log('error', void 0, messages);
};
export var warn = function () {
    var messages = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        messages[_i] = arguments[_i];
    }
    return log('warn', void 0, messages);
};
export var debug = function () {
    var messages = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        messages[_i] = arguments[_i];
    }
    return log('debug', void 0, messages);
};
export var trace = function () {
    var messages = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        messages[_i] = arguments[_i];
    }
    return log('trace', void 0, messages);
};
export var info = function () {
    var messages = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        messages[_i] = arguments[_i];
    }
    return log('info', void 0, messages);
};
var NS = {};
export var namespace = function (name) {
    if (!NS[name]) {
        var ns_1 = "[" + name + "]";
        NS[name] = {
            debug: function () {
                var messages = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    messages[_i] = arguments[_i];
                }
                return log('debug', ns_1, messages);
            },
            error: function () {
                var messages = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    messages[_i] = arguments[_i];
                }
                return log('error', ns_1, messages);
            },
            info: function () {
                var messages = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    messages[_i] = arguments[_i];
                }
                return log('info', ns_1, messages);
            },
            trace: function () {
                var messages = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    messages[_i] = arguments[_i];
                }
                return log('trace', ns_1, messages);
            },
            warn: function () {
                var messages = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    messages[_i] = arguments[_i];
                }
                return log('warn', ns_1, messages);
            },
            setLevel: function (level) { return setLevelInternal(level, ns_1); },
        };
    }
    return NS[name];
};
export var setAppenders = function (appenders) {
    global.deltixLogAppenders = appenders;
};
