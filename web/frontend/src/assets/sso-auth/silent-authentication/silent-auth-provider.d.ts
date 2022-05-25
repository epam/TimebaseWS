import {AuthorizationServiceConfiguration, Requestor, TokenResponse} from '@openid/appauth';
import {AuthFlow, SilentAuthErrorJson} from './types';

export interface SilentAuthParams {
  flow: AuthFlow;
  clientId: string;
  scope: string;
  redirectUrl: string;
  authorizationServiceConfig: AuthorizationServiceConfiguration;
  extraAuthParams?: {
    [key: string]: string;
  };
  timeout?: number;
  requestor?: Requestor;
  prompt?: OpenidPrompt;
  callback: (resp: TokenResponse) => void;
  failureCallback: (error?: SilentAuthErrorJson) => void;
}

export declare type OpenidPrompt = 'none' | 'login' | 'consent' | string;

export declare class SilentAuthProvider {
  private readonly clientId;
  private readonly scope;
  private readonly redirectUrl;
  private readonly authorizationServiceConfig;
  private readonly failureCallback;
  private readonly callback;
  private readonly timeout;
  private readonly extraAuthParams;
  private readonly flow;
  private timeoutId;
  private iFrame;
  private messageType;
  private bindedIframeResponseHandler;
  private prompt;
  private readonly timeoutError;
  private readonly requestor;
  private readonly authorizationEndPointUrl;
  private createIFrame;
  private buildUrl;
  private getResponseType;
  private setAuthWaitingTimeout;
  private onTimeout;
  private iframeResponseHandler;
  private isValidMessage;
  private getMessageBody;
  private isErrorMsg;
  private continueAuthByFlow;
  private continueImplicitFlowAuth;
  private continueCodeFlowAuth;
  private destroy;

  constructor(params: SilentAuthParams);

  getToken(): void;
}
