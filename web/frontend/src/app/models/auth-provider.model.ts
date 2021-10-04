import { ProviderType } from './provider.type';

export class AuthProviderModel {
  // audience: string;
  // client_id: string;
  // config_url: string;
  // jwks_uri: string;
  // logout_url: string;
  // provider: string;

  provider_type: ProviderType;
  jwks_uri: string;
  config_url: string;
  client_id: string;
  logout_url: string;
  oauth_server: string;
  token_endpoint: string;
  name: string;
  audience: string;

  constructor(obj: AuthProviderModel | {}) {
    Object.assign(this, obj);
  }

  get custom_provider(): boolean {
    return this.provider_type && this.provider_type !== 'SSO';
  }
}
