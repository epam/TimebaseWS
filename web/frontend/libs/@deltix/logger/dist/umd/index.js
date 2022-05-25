(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('globalthis')) :
    typeof define === 'function' && define.amd ? define(['exports', 'globalthis'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.Logger = {}, global.globalThis));
}(this, (function (exports, globalThis) { 'use strict';

    function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

    var globalThis__default = /*#__PURE__*/_interopDefaultLegacy(globalThis);

    var global = globalThis__default['default']();

    var STYLES = {
        error: 'color:red;font-weight:700',
        debug: 'font-weight:700',
        info: 'color:cyan;font-weight:700',
        trace: 'color:gray;font-weight:700',
        warn: 'color:orange;font-weight:700',
    };
    var PRIORITY = {
        trace: 0,
        debug: 1,
        info: 2,
        warn: 3,
        error: 4,
    };

    var processMsg = function (msg) {
        if (msg instanceof Error) {
            return msg.message + "\r\n" + msg.stack + "\r\n";
        }
        return msg;
    };
    var consoleAppender = function (time, level, ns, messages) {
        setTimeout(function () {
            var print = [
                '%s %c[%s]%c %s',
                time,
                STYLES[level],
                level,
                '',
                ns ? (Array.isArray(ns) ? ns.join(' ') : ns) + " " : '',
            ].concat(messages.map(processMsg));
            console.log.apply(console, print);
        });
    };

    var enabled = function (level, ns) {
        if (ns === void 0) { ns = ''; }
        var limits = global.deltixLogLevel;
        if (limits == null) {
            return true;
        }
        var limit = limits[ns || ''];
        if (limit == null || PRIORITY[level] == null) {
            return true;
        }
        return PRIORITY[level] >= PRIORITY[limit];
    };
    var getTime = function () {
        return new Date().toISOString();
    };
    var log = function (level, ns, messages) {
        if (!enabled(level, ns)) {
            return;
        }
        var time = getTime();
        var nsStr = Array.isArray(ns) ? ns.join(' ') : ns;
        var appenders = global.deltixLogAppenders;
        if (Array.isArray(appenders) && appenders.length) {
            for (var i = 0; i < appenders.length; i++) {
                appenders[i](time, level, nsStr, messages);
            }
        }
        else {
            consoleAppender(time, level, nsStr, messages);
        }
    };

    var __assign = (undefined && undefined.__assign) || function () {
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
    var setLevelInternal = function (level, ns) {
        var _a;
        if (ns === void 0) { ns = ''; }
        return (global.deltixLogLevel = __assign(__assign({}, global.deltixLogLevel), (_a = {}, _a[ns] = level, _a)));
    };
    var setLevel = function (level) {
        return setLevelInternal(level);
    };
    var error = function () {
        var messages = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            messages[_i] = arguments[_i];
        }
        return log('error', void 0, messages);
    };
    var warn = function () {
        var messages = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            messages[_i] = arguments[_i];
        }
        return log('warn', void 0, messages);
    };
    var debug = function () {
        var messages = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            messages[_i] = arguments[_i];
        }
        return log('debug', void 0, messages);
    };
    var trace = function () {
        var messages = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            messages[_i] = arguments[_i];
        }
        return log('trace', void 0, messages);
    };
    var info = function () {
        var messages = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            messages[_i] = arguments[_i];
        }
        return log('info', void 0, messages);
    };
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
    var setAppenders = function (appenders) {
        global.deltixLogAppenders = appenders;
    };

    exports.debug = debug;
    exports.error = error;
    exports.info = info;
    exports.namespace = namespace;
    exports.setAppenders = setAppenders;
    exports.setLevel = setLevel;
    exports.trace = trace;
    exports.warn = warn;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
