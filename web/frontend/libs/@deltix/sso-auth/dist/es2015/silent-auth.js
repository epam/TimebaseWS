var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { AuthorizationNotifier, AuthorizationRequest, BaseTokenRequestHandler, DefaultCrypto, FetchRequestor, GRANT_TYPE_AUTHORIZATION_CODE, RedirectRequestHandler, TokenRequest, } from '@openid/appauth';
import { delay } from './delay';
import { NoResponseError, TimeoutError } from './errors';
import { FrameLocationLike } from './location-like';
import { TempStorageBackend } from './storage-backend';
import { timeoutAsync } from './timeout';
export const silentAuth = ({ authorizationServiceConfig, clientId, redirectUrl, scope, extraAuthParams, requestorFactory = FetchRequestor, timeout = 30 * 1000, locationFactory = FrameLocationLike, cryptoFactory = DefaultCrypto, signal, }) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const requestor = new requestorFactory();
    const location = new locationFactory();
    const storage = new TempStorageBackend();
    const crypto = new cryptoFactory();
    let tokenResponse;
    let complete = false;
    try {
        const handler = new RedirectRequestHandler(storage, void 0, location);
        const notifier = new AuthorizationNotifier();
        handler.setAuthorizationNotifier(notifier);
        let request;
        let response;
        notifier.setAuthorizationListener((requestObj, responseObj, error) => {
            if (error) {
                complete = true;
                if (error.error === 'timeout') {
                    throw new TimeoutError();
                }
                else {
                    throw new Error(error.errorDescription);
                }
            }
            if (responseObj) {
                complete = true;
            }
            request = requestObj;
            response = responseObj;
        });
        handler.performAuthorizationRequest(authorizationServiceConfig, new AuthorizationRequest({
            redirect_uri: redirectUrl,
            response_type: 'code',
            client_id: clientId,
            scope,
            state: crypto.generateRandom(32),
            extras: extraAuthParams,
        }));
        yield delay(50);
        if (signal === null || signal === void 0 ? void 0 : signal.aborted) {
            throw new Error('Aborted');
        }
        yield Promise.race([
            timeoutAsync(timeout),
            (() => __awaiter(void 0, void 0, void 0, function* () {
                yield location.ready; // ready after redirects
                const t = Math.max(100, timeout / 1000);
                // wait for redirection to back
                while (!complete) {
                    if (signal === null || signal === void 0 ? void 0 : signal.aborted) {
                        throw new Error('Aborted');
                    }
                    try {
                        yield handler.completeAuthorizationRequestIfPossible();
                        if (response) {
                            complete = true;
                            break;
                        }
                    }
                    catch (_b) { }
                    yield delay(t);
                }
                return;
            }))(),
        ]);
        if (response == null) {
            throw new NoResponseError();
        }
        if (signal === null || signal === void 0 ? void 0 : signal.aborted) {
            throw new Error('Aborted');
        }
        const tokenRequest = new TokenRequest({
            client_id: clientId,
            redirect_uri: redirectUrl,
            grant_type: GRANT_TYPE_AUTHORIZATION_CODE,
            code: response.code,
            refresh_token: undefined,
            extras: {
                code_verifier: (_a = request === null || request === void 0 ? void 0 : request.internal) === null || _a === void 0 ? void 0 : _a.code_verifier,
            },
        });
        const tokenHandler = new BaseTokenRequestHandler(requestor);
        tokenResponse = yield tokenHandler.performTokenRequest(authorizationServiceConfig, tokenRequest);
    }
    catch (e) {
        throw e;
    }
    finally {
        complete = true;
        storage.clear();
        location === null || location === void 0 ? void 0 : location.destroy();
    }
    return tokenResponse;
});
