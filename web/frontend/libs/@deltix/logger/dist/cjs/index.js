"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.setAppenders = exports.namespace = exports.info = exports.trace = exports.debug = exports.warn = exports.error = exports.setLevel = void 0;
var global_1 = require("./global");
var log_1 = require("./log");
var setLevelInternal = function (level, ns) {
    var _a;
    if (ns === void 0) { ns = ''; }
    return (global_1.global.deltixLogLevel = __assign(__assign({}, global_1.global.deltixLogLevel), (_a = {}, _a[ns] = level, _a)));
};
var setLevel = function (level) {
    return setLevelInternal(level);
};
exports.setLevel = setLevel;
var error = function () {
    var messages = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        messages[_i] = arguments[_i];
    }
    return log_1.log('error', void 0, messages);
};
exports.error = error;
var warn = function () {
    var messages = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        messages[_i] = arguments[_i];
    }
    return log_1.log('warn', void 0, messages);
};
exports.warn = warn;
var debug = function () {
    var messages = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        messages[_i] = arguments[_i];
    }
    return log_1.log('debug', void 0, messages);
};
exports.debug = debug;
var trace = function () {
    var messages = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        messages[_i] = arguments[_i];
    }
    return log_1.log('trace', void 0, messages);
};
exports.trace = trace;
var info = function () {
    var messages = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        messages[_i] = arguments[_i];
    }
    return log_1.log('info', void 0, messages);
};
exports.info = info;
var NS = {};
var namespace = function (name) {
    if (!NS[name]) {
        var ns_1 = "[" + name + "]";
        NS[name] = {
            debug: function () {
                var messages = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    messages[_i] = arguments[_i];
                }
                return log_1.log('debug', ns_1, messages);
            },
            error: function () {
                var messages = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    messages[_i] = arguments[_i];
                }
                return log_1.log('error', ns_1, messages);
            },
            info: function () {
                var messages = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    messages[_i] = arguments[_i];
                }
                return log_1.log('info', ns_1, messages);
            },
            trace: function () {
                var messages = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    messages[_i] = arguments[_i];
                }
                return log_1.log('trace', ns_1, messages);
            },
            warn: function () {
                var messages = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    messages[_i] = arguments[_i];
                }
                return log_1.log('warn', ns_1, messages);
            },
            setLevel: function (level) { return setLevelInternal(level, ns_1); },
        };
    }
    return NS[name];
};
exports.namespace = namespace;
var setAppenders = function (appenders) {
    global_1.global.deltixLogAppenders = appenders;
};
exports.setAppenders = setAppenders;
