import { AuthorizationServiceConfiguration, Crypto, Requestor, TokenResponse } from '@openid/appauth';
import { ILocationLike } from './location-like';
export type OpenidPrompt = 'none' | 'login' | 'consent' | string;
export type IExtraAuthParams = {
    prompt?: OpenidPrompt;
    audience?: string;
} & Record<string, string>;
export interface ISilentAuthOptions {
    clientId: string;
    scope: string;
    redirectUrl: string;
    authorizationServiceConfig: AuthorizationServiceConfiguration;
    extraAuthParams?: IExtraAuthParams;
    timeout?: number;
    signal?: AbortSignal;
    requestorFactory?: new () => Requestor;
    locationFactory?: new () => ILocationLike;
    cryptoFactory?: new () => Crypto;
}
export declare const silentAuth: ({ authorizationServiceConfig, clientId, redirectUrl, scope, extraAuthParams, requestorFactory, timeout, locationFactory, cryptoFactory, signal, }: ISilentAuthOptions) => Promise<TokenResponse>;
