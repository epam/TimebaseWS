export class FrameLocationLike {
    constructor() {
        this.resolve = null;
        this.reject = null;
        this.readiness = new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
        });
    }
    get loc() {
        var _a, _b;
        return (_b = (_a = this.frame) === null || _a === void 0 ? void 0 : _a.contentWindow) === null || _b === void 0 ? void 0 : _b.location;
    }
    get hash() {
        var _a, _b;
        try {
            return ((_a = this.loc) === null || _a === void 0 ? void 0 : _a.hash) || ((_b = this.loc) === null || _b === void 0 ? void 0 : _b.search) || '';
        }
        catch (_c) {
            return '';
        }
    }
    get host() {
        var _a, _b;
        try {
            return (_b = (_a = this.loc) === null || _a === void 0 ? void 0 : _a.host) !== null && _b !== void 0 ? _b : '';
        }
        catch (_c) {
            return '';
        }
    }
    get origin() {
        var _a, _b;
        try {
            return (_b = (_a = this.loc) === null || _a === void 0 ? void 0 : _a.origin) !== null && _b !== void 0 ? _b : '';
        }
        catch (_c) {
            return '';
        }
    }
    get hostname() {
        var _a, _b;
        try {
            return (_b = (_a = this.loc) === null || _a === void 0 ? void 0 : _a.hostname) !== null && _b !== void 0 ? _b : '';
        }
        catch (_c) {
            return '';
        }
    }
    get pathname() {
        var _a, _b;
        try {
            return (_b = (_a = this.loc) === null || _a === void 0 ? void 0 : _a.pathname) !== null && _b !== void 0 ? _b : '';
        }
        catch (_c) {
            return '';
        }
    }
    get port() {
        var _a, _b;
        try {
            return (_b = (_a = this.loc) === null || _a === void 0 ? void 0 : _a.port) !== null && _b !== void 0 ? _b : '';
        }
        catch (_c) {
            return '';
        }
    }
    get protocol() {
        var _a, _b;
        try {
            return (_b = (_a = this.loc) === null || _a === void 0 ? void 0 : _a.protocol) !== null && _b !== void 0 ? _b : '';
        }
        catch (_c) {
            return '';
        }
    }
    get search() {
        var _a, _b;
        try {
            return (_b = (_a = this.loc) === null || _a === void 0 ? void 0 : _a.search) !== null && _b !== void 0 ? _b : '';
        }
        catch (_c) {
            return '';
        }
    }
    get ready() {
        return this.readiness;
    }
    assign(url) {
        const frame = globalThis.document.createElement('iframe');
        frame.style.display = 'none';
        frame.src = url;
        frame.onload = this.resolve;
        frame.onerror = this.reject;
        frame.onabort = this.reject;
        this.frame = frame;
        globalThis.document.body.appendChild(frame);
    }
    destroy() {
        var _a, _b;
        (_a = this.reject) === null || _a === void 0 ? void 0 : _a.call(this);
        this.resolve = null;
        this.reject = null;
        (_b = this.frame) === null || _b === void 0 ? void 0 : _b.remove();
    }
}
