"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.log = void 0;
var appender_1 = require("./appender");
var configuration_1 = require("./configuration");
var global_1 = require("./global");
var enabled = function (level, ns) {
    if (ns === void 0) { ns = ''; }
    var limits = global_1.global.deltixLogLevel;
    if (limits == null) {
        return true;
    }
    var limit = limits[ns || ''];
    if (limit == null || configuration_1.PRIORITY[level] == null) {
        return true;
    }
    return configuration_1.PRIORITY[level] >= configuration_1.PRIORITY[limit];
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
    var appenders = global_1.global.deltixLogAppenders;
    if (Array.isArray(appenders) && appenders.length) {
        for (var i = 0; i < appenders.length; i++) {
            appenders[i](time, level, nsStr, messages);
        }
    }
    else {
        appender_1.consoleAppender(time, level, nsStr, messages);
    }
};
exports.log = log;
