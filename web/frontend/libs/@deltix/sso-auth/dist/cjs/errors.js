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
exports.NoResponseError = exports.TimeoutError = void 0;
var TimeoutError = /** @class */ (function (_super) {
    __extends(TimeoutError, _super);
    function TimeoutError() {
        return _super.call(this, 'Timeout occurs') || this;
    }
    return TimeoutError;
}(Error));
exports.TimeoutError = TimeoutError;
var NoResponseError = /** @class */ (function (_super) {
    __extends(NoResponseError, _super);
    function NoResponseError() {
        return _super.call(this, 'No response info') || this;
    }
    return NoResponseError;
}(Error));
exports.NoResponseError = NoResponseError;
