import { AuthorizationNotifier, AuthorizationRequest, BaseTokenRequestHandler, DefaultCrypto, FetchRequestor, GRANT_TYPE_AUTHORIZATION_CODE, RedirectRequestHandler, TokenRequest, } from '@openid/appauth';
import { delay } from './delay';
import { NoResponseError, TimeoutError } from './errors';
import { FrameLocationLike } from './location-like';
import { TempStorageBackend } from './storage-backend';
import { timeoutAsync } from './timeout';
export const silentAuth = async ({ authorizationServiceConfig, clientId, redirectUrl, scope, extraAuthParams, requestorFactory = FetchRequestor, timeout = 30 * 1000, locationFactory = FrameLocationLike, cryptoFactory = DefaultCrypto, signal, }) => {
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
        await delay(50);
        if (signal?.aborted) {
            throw new Error('Aborted');
        }
        await Promise.race([
            timeoutAsync(timeout),
            (async () => {
                await location.ready; // ready after redirects
                const t = Math.max(100, timeout / 1000);
                // wait for redirection to back
                while (!complete) {
                    if (signal?.aborted) {
                        throw new Error('Aborted');
                    }
                    try {
                        await handler.completeAuthorizationRequestIfPossible();
                        if (response) {
                            complete = true;
                            break;
                        }
                    }
                    catch { }
                    await delay(t);
                }
                return;
            })(),
        ]);
        if (response == null) {
            throw new NoResponseError();
        }
        if (signal?.aborted) {
            throw new Error('Aborted');
        }
        const tokenRequest = new TokenRequest({
            client_id: clientId,
            redirect_uri: redirectUrl,
            grant_type: GRANT_TYPE_AUTHORIZATION_CODE,
            code: response.code,
            refresh_token: undefined,
            extras: {
                code_verifier: request?.internal?.code_verifier,
            },
        });
        const tokenHandler = new BaseTokenRequestHandler(requestor);
        tokenResponse = await tokenHandler.performTokenRequest(authorizationServiceConfig, tokenRequest);
    }
    catch (e) {
        throw e;
    }
    finally {
        complete = true;
        storage.clear();
        location?.destroy();
    }
    return tokenResponse;
};
