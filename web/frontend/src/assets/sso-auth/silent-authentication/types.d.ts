import {TokenResponseJson} from '@openid/appauth';
import {ErrorType} from '@openid/appauth/src/token_response';

export interface SilentAuthErrorJson {
  error: ErrorType | 'timeout';
  error_description?: string;
  error_uri?: string;
}

export interface CodeResponseJson {
  code: string;
}

export declare type MsgBodyType = SilentAuthErrorJson | TokenResponseJson | CodeResponseJson;

export declare enum AuthFlow {
  IMPLICIT = 'IMPLICIT',
  CODE = 'CODE',
}
