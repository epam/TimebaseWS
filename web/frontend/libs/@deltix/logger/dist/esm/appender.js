import { STYLES } from './configuration';
var processMsg = function (msg) {
    if (msg instanceof Error) {
        return msg.message + "\r\n" + msg.stack + "\r\n";
    }
    return msg;
};
export var consoleAppender = function (time, level, ns, messages) {
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
