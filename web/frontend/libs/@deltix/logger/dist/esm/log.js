import { consoleAppender } from './appender';
import { PRIORITY } from './configuration';
import { global } from './global';
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
export var log = function (level, ns, messages) {
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
