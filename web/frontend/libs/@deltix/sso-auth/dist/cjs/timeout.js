"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.timeoutAsync = void 0;
var errors_1 = require("./errors");
var timeoutAsync = function (t) {
    return new Promise(function (resolve, reject) {
        setTimeout(function () {
            reject(new errors_1.TimeoutError());
        }, t);
    });
};
exports.timeoutAsync = timeoutAsync;
