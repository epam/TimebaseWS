import { global } from './global';
import { log } from './log';
const setLevelInternal = (level, ns = '') => (global.deltixLogLevel = Object.assign(Object.assign({}, global.deltixLogLevel), { [ns]: level }));
export const setLevel = (level) => setLevelInternal(level);
export const error = (...messages) => log('error', void 0, messages);
export const warn = (...messages) => log('warn', void 0, messages);
export const debug = (...messages) => log('debug', void 0, messages);
export const trace = (...messages) => log('trace', void 0, messages);
export const info = (...messages) => log('info', void 0, messages);
const NS = {};
export const namespace = (name) => {
    if (!NS[name]) {
        const ns = `[${name}]`;
        NS[name] = {
            debug: (...messages) => log('debug', ns, messages),
            error: (...messages) => log('error', ns, messages),
            info: (...messages) => log('info', ns, messages),
            trace: (...messages) => log('trace', ns, messages),
            warn: (...messages) => log('warn', ns, messages),
            setLevel: (level) => setLevelInternal(level, ns),
        };
    }
    return NS[name];
};
export const setAppenders = (appenders) => {
    global.deltixLogAppenders = appenders;
};
