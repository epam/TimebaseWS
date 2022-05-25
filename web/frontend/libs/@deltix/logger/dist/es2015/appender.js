import { STYLES } from './configuration';
const processMsg = (msg) => {
    if (msg instanceof Error) {
        return `${msg.message}\r\n${msg.stack}\r\n`;
    }
    return msg;
};
export const consoleAppender = (time, level, ns, messages) => {
    setTimeout(() => {
        const print = [
            '%s %c[%s]%c %s',
            time,
            STYLES[level],
            level,
            '',
            ns ? `${Array.isArray(ns) ? ns.join(' ') : ns} ` : '',
        ].concat(messages.map(processMsg));
        console.log.apply(console, print);
    });
};
