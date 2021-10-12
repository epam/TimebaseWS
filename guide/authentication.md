# TimeBase Web Administrator Authentication

TimeBase Web Administrator supports two types of authentication: built-in OAuth2 & SSO. **One of those types must be enabled to run the application.**

## Client Web Application Authentication Flow 

![](/img/tb_auth.svg)

1. Authentication service provider identification check is made upon each application start.
2. Browser local storage is checked to have a Refresh Token for the current user.
3. If Refresh Token exists, Silent Token Update is performed to obtain a new Access Token.
4. If Silent Token Update fails for any reason, the user will be logged out and redirected to a Login page.

## OAuth2

To enable built-in authentication, you need to add the following security block to your `application.yaml` configuration file. We recommend using this authentication method for test purposes.

```yaml
security:
  oauth2:
    provider:
    providerType: BUILT_IN_OAUTH
    clientId: web
    tokenEndpoint: /oauth/token
    clientId: web
    secret: <BCrypt_encoded_secret>
    authorizedGrantTypes:
    - password
    - refresh_token
    users: # list of users with its authorities
    - username: <username>
      password: <BCrypt_encoded_password>
      authorities: [TB_ALLOW_READ, TB_ALLOW_WRITE]
    scopes:
    - trust
    accessTokenValiditySeconds: 300 # 5 min
    refreshTokenValiditySeconds: 86400 # one day
    privateKey: |
    -----BEGIN RSA PRIVATE KEY-----
    <RSA private key>
    -----END RSA PRIVATE KEY----- |
    publicKey: |
    <RSA public key>
```

### ORY Hydra

To enable SSO with [ORY Hydra](https://www.ory.sh/hydra/) add the following blocks to your `application.yaml` configuration file. 

```yaml

spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri:  # Issuer URI

...

security:
  oauth2:
    provider:
      providerType: SSO
      name: hydra
      clientId: <client_id> # Your client ID
      validateIssuer: false
      userInfo:
        enable: true

```

### Auth0

In this section we describe how to configure TimeBase Web Admin Authentication with [Auth0](https://auth0.com/) authentication service provider.

#### Auth0 Settings 

![](/img/auth0.png)

![](/img/auth0_2.png)

1. In **Applications** create Single Page Application
2. For the application you have just created configure the following settings:
  + Allowed Callback URLs: `<tbwa_base_url>/assets/sign-in.html`, `<tbwa_base_url>/assets/silent-auth.html`
  + Allowed Logout URLs: `<tbwa_base_url>//assets/sign-in.html`
  + Allowed Web Origins: `<tbwa_base_url>`
  + Allowed Origins (CORS): `<tbwa_base_url>`
  + Disable Refresh Token Rotation
  + Disable Absolute Expiration in Refresh Token Expiration
  + Disable Inactivity Expiration in Refresh Token Expiration
3. In **Applications** go to **APIs** and create a new API
  + Set your application Client ID as API_Audience value
4. In **User Management** under **Users** create a new user
5. In **Tenant Settings** under **Advanced Settings** disable **Refresh Token Revocation Deletes Grant**

#### TimeBase Web Admin Settings 

Add the following variables to TimeBase chart in TimeBase Web Admin section: 

```yaml
  SPRING_SECURITY_OAUTH2_RESOURCESERVER_JWT_ISSUER-URI: https://<your_domain>.auth0.com/
  SECURITY_OAUTH2_PROVIDER_VALIDATEISSUER: true
  SECURITY_OAUTH2_PROVIDER_USERINFO_ENABLE: true
  SECURITY_OAUTH2_PROVIDER_CLIENTID: <client_id>
  SECURITY_OAUTH2_PROVIDER_CLIENTSECRET: <secret>
  SECURITY_OAUTH2_PROVIDER_PROVIDERTYPE: SSO
  SECURITY_OAUTH2_PROVIDER_NAME: auth0
  SECURITY_OAUTH2_PROVIDER_AUDIENCE: <api_audience>
  SECURITY_OAUTH2_PROVIDER_CONFIGURL: https://<your_domain>.auth0.com/.well-known/openid-configuration
  SECURITY_OAUTH2_PROVIDER_LOGOUTURL: https://<your_domain>.auth0.com/logout
  SECURITY_OAUTH2_USERS_0_USERNAME: "<username>"
```
