"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FrameLocationLike = void 0;
var FrameLocationLike = /** @class */ (function () {
    function FrameLocationLike() {
        var _this = this;
        this.resolve = null;
        this.reject = null;
        this.readiness = new Promise(function (resolve, reject) {
            _this.resolve = resolve;
            _this.reject = reject;
        });
    }
    Object.defineProperty(FrameLocationLike.prototype, "loc", {
        get: function () {
            var _a, _b;
            return (_b = (_a = this.frame) === null || _a === void 0 ? void 0 : _a.contentWindow) === null || _b === void 0 ? void 0 : _b.location;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(FrameLocationLike.prototype, "hash", {
        get: function () {
            var _a, _b;
            try {
                return ((_a = this.loc) === null || _a === void 0 ? void 0 : _a.hash) || ((_b = this.loc) === null || _b === void 0 ? void 0 : _b.search) || '';
            }
            catch (_c) {
                return '';
            }
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(FrameLocationLike.prototype, "host", {
        get: function () {
            var _a, _b;
            try {
                return (_b = (_a = this.loc) === null || _a === void 0 ? void 0 : _a.host) !== null && _b !== void 0 ? _b : '';
            }
            catch (_c) {
                return '';
            }
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(FrameLocationLike.prototype, "origin", {
        get: function () {
            var _a, _b;
            try {
                return (_b = (_a = this.loc) === null || _a === void 0 ? void 0 : _a.origin) !== null && _b !== void 0 ? _b : '';
            }
            catch (_c) {
                return '';
            }
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(FrameLocationLike.prototype, "hostname", {
        get: function () {
            var _a, _b;
            try {
                return (_b = (_a = this.loc) === null || _a === void 0 ? void 0 : _a.hostname) !== null && _b !== void 0 ? _b : '';
            }
            catch (_c) {
                return '';
            }
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(FrameLocationLike.prototype, "pathname", {
        get: function () {
            var _a, _b;
            try {
                return (_b = (_a = this.loc) === null || _a === void 0 ? void 0 : _a.pathname) !== null && _b !== void 0 ? _b : '';
            }
            catch (_c) {
                return '';
            }
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(FrameLocationLike.prototype, "port", {
        get: function () {
            var _a, _b;
            try {
                return (_b = (_a = this.loc) === null || _a === void 0 ? void 0 : _a.port) !== null && _b !== void 0 ? _b : '';
            }
            catch (_c) {
                return '';
            }
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(FrameLocationLike.prototype, "protocol", {
        get: function () {
            var _a, _b;
            try {
                return (_b = (_a = this.loc) === null || _a === void 0 ? void 0 : _a.protocol) !== null && _b !== void 0 ? _b : '';
            }
            catch (_c) {
                return '';
            }
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(FrameLocationLike.prototype, "search", {
        get: function () {
            var _a, _b;
            try {
                return (_b = (_a = this.loc) === null || _a === void 0 ? void 0 : _a.search) !== null && _b !== void 0 ? _b : '';
            }
            catch (_c) {
                return '';
            }
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(FrameLocationLike.prototype, "ready", {
        get: function () {
            return this.readiness;
        },
        enumerable: false,
        configurable: true
    });
    FrameLocationLike.prototype.assign = function (url) {
        var frame = globalThis.document.createElement('iframe');
        frame.style.display = 'none';
        frame.src = url;
        frame.onload = this.resolve;
        frame.onerror = this.reject;
        frame.onabort = this.reject;
        this.frame = frame;
        globalThis.document.body.appendChild(frame);
    };
    FrameLocationLike.prototype.destroy = function () {
        var _a, _b;
        (_a = this.reject) === null || _a === void 0 ? void 0 : _a.call(this);
        this.resolve = null;
        this.reject = null;
        (_b = this.frame) === null || _b === void 0 ? void 0 : _b.remove();
    };
    return FrameLocationLike;
}());
exports.FrameLocationLike = FrameLocationLike;
