"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.silentAuth = void 0;
var appauth_1 = require("@openid/appauth");
var delay_1 = require("./delay");
var errors_1 = require("./errors");
var location_like_1 = require("./location-like");
var storage_backend_1 = require("./storage-backend");
var timeout_1 = require("./timeout");
var silentAuth = function (_a) {
    var authorizationServiceConfig = _a.authorizationServiceConfig, clientId = _a.clientId, redirectUrl = _a.redirectUrl, scope = _a.scope, extraAuthParams = _a.extraAuthParams, _b = _a.requestorFactory, requestorFactory = _b === void 0 ? appauth_1.FetchRequestor : _b, _c = _a.timeout, timeout = _c === void 0 ? 30 * 1000 : _c, _d = _a.locationFactory, locationFactory = _d === void 0 ? location_like_1.FrameLocationLike : _d, _e = _a.cryptoFactory, cryptoFactory = _e === void 0 ? appauth_1.DefaultCrypto : _e, signal = _a.signal;
    return __awaiter(void 0, void 0, void 0, function () {
        var requestor, location, storage, crypto, tokenResponse, complete, handler_1, notifier, request_1, response_1, tokenRequest, tokenHandler, e_1;
        var _f;
        return __generator(this, function (_g) {
            switch (_g.label) {
                case 0:
                    requestor = new requestorFactory();
                    location = new locationFactory();
                    storage = new storage_backend_1.TempStorageBackend();
                    crypto = new cryptoFactory();
                    complete = false;
                    _g.label = 1;
                case 1:
                    _g.trys.push([1, 5, 6, 7]);
                    handler_1 = new appauth_1.RedirectRequestHandler(storage, void 0, location);
                    notifier = new appauth_1.AuthorizationNotifier();
                    handler_1.setAuthorizationNotifier(notifier);
                    notifier.setAuthorizationListener(function (requestObj, responseObj, error) {
                        if (error) {
                            complete = true;
                            if (error.error === 'timeout') {
                                throw new errors_1.TimeoutError();
                            }
                            else {
                                throw new Error(error.errorDescription);
                            }
                        }
                        if (responseObj) {
                            complete = true;
                        }
                        request_1 = requestObj;
                        response_1 = responseObj;
                    });
                    handler_1.performAuthorizationRequest(authorizationServiceConfig, new appauth_1.AuthorizationRequest({
                        redirect_uri: redirectUrl,
                        response_type: 'code',
                        client_id: clientId,
                        scope: scope,
                        state: crypto.generateRandom(32),
                        extras: extraAuthParams,
                    }));
                    return [4 /*yield*/, (0, delay_1.delay)(50)];
                case 2:
                    _g.sent();
                    if (signal === null || signal === void 0 ? void 0 : signal.aborted) {
                        throw new Error('Aborted');
                    }
                    return [4 /*yield*/, Promise.race([
                            (0, timeout_1.timeoutAsync)(timeout),
                            (function () { return __awaiter(void 0, void 0, void 0, function () {
                                var t, _a;
                                return __generator(this, function (_b) {
                                    switch (_b.label) {
                                        case 0: return [4 /*yield*/, location.ready];
                                        case 1:
                                            _b.sent(); // ready after redirects
                                            t = Math.max(100, timeout / 1000);
                                            _b.label = 2;
                                        case 2:
                                            if (!!complete) return [3 /*break*/, 8];
                                            if (signal === null || signal === void 0 ? void 0 : signal.aborted) {
                                                throw new Error('Aborted');
                                            }
                                            _b.label = 3;
                                        case 3:
                                            _b.trys.push([3, 5, , 6]);
                                            return [4 /*yield*/, handler_1.completeAuthorizationRequestIfPossible()];
                                        case 4:
                                            _b.sent();
                                            if (response_1) {
                                                complete = true;
                                                return [3 /*break*/, 8];
                                            }
                                            return [3 /*break*/, 6];
                                        case 5:
                                            _a = _b.sent();
                                            return [3 /*break*/, 6];
                                        case 6: return [4 /*yield*/, (0, delay_1.delay)(t)];
                                        case 7:
                                            _b.sent();
                                            return [3 /*break*/, 2];
                                        case 8: return [2 /*return*/];
                                    }
                                });
                            }); })(),
                        ])];
                case 3:
                    _g.sent();
                    if (response_1 == null) {
                        throw new errors_1.NoResponseError();
                    }
                    if (signal === null || signal === void 0 ? void 0 : signal.aborted) {
                        throw new Error('Aborted');
                    }
                    tokenRequest = new appauth_1.TokenRequest({
                        client_id: clientId,
                        redirect_uri: redirectUrl,
                        grant_type: appauth_1.GRANT_TYPE_AUTHORIZATION_CODE,
                        code: response_1.code,
                        refresh_token: undefined,
                        extras: {
                            code_verifier: (_f = request_1 === null || request_1 === void 0 ? void 0 : request_1.internal) === null || _f === void 0 ? void 0 : _f.code_verifier,
                        },
                    });
                    tokenHandler = new appauth_1.BaseTokenRequestHandler(requestor);
                    return [4 /*yield*/, tokenHandler.performTokenRequest(authorizationServiceConfig, tokenRequest)];
                case 4:
                    tokenResponse = _g.sent();
                    return [3 /*break*/, 7];
                case 5:
                    e_1 = _g.sent();
                    throw e_1;
                case 6:
                    complete = true;
                    storage.clear();
                    location === null || location === void 0 ? void 0 : location.destroy();
                    return [7 /*endfinally*/];
                case 7: return [2 /*return*/, tokenResponse];
            }
        });
    });
};
exports.silentAuth = silentAuth;
