"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.consoleAppender = void 0;
var configuration_1 = require("./configuration");
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
            configuration_1.STYLES[level],
            level,
            '',
            ns ? (Array.isArray(ns) ? ns.join(' ') : ns) + " " : '',
        ].concat(messages.map(processMsg));
        console.log.apply(console, print);
    });
};
exports.consoleAppender = consoleAppender;
