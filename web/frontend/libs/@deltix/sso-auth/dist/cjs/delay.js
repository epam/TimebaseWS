"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.delay = void 0;
var delay = function (delay) {
    return new Promise(function (resolve) { return setTimeout(resolve, delay); });
};
exports.delay = delay;
