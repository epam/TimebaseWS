"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.TempStorageBackend = void 0;
var appauth_1 = require("@openid/appauth");
var TempStorageBackend = /** @class */ (function (_super) {
    __extends(TempStorageBackend, _super);
    function TempStorageBackend() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.storage = {};
        return _this;
    }
    TempStorageBackend.prototype.getItem = function (name) {
        return Promise.resolve(this.storage[name]);
    };
    TempStorageBackend.prototype.removeItem = function (name) {
        delete this.storage[name];
        return Promise.resolve();
    };
    TempStorageBackend.prototype.clear = function () {
        this.storage = {};
        return Promise.resolve();
    };
    TempStorageBackend.prototype.setItem = function (name, value) {
        this.storage[name] = value;
        return Promise.resolve();
    };
    return TempStorageBackend;
}(appauth_1.StorageBackend));
exports.TempStorageBackend = TempStorageBackend;
