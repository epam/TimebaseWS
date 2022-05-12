import { consoleAppender } from './appender';
import { PRIORITY } from './configuration';
import { global } from './global';
const enabled = (level, ns = '') => {
    const limits = global.deltixLogLevel;
    if (limits == null) {
        return true;
    }
    const limit = limits[ns || ''];
    if (limit == null || PRIORITY[level] == null) {
        return true;
    }
    return PRIORITY[level] >= PRIORITY[limit];
};
const getTime = () => {
    return new Date().toISOString();
};
export const log = (level, ns, messages) => {
    if (!enabled(level, ns)) {
        return;
    }
    const time = getTime();
    const nsStr = Array.isArray(ns) ? ns.join(' ') : ns;
    const appenders = global.deltixLogAppenders;
    if (Array.isArray(appenders) && appenders.length) {
        for (let i = 0; i < appenders.length; i++) {
            appenders[i](time, level, nsStr, messages);
        }
    }
    else {
        consoleAppender(time, level, nsStr, messages);
    }
};
