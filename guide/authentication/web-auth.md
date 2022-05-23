# Web Authentication 

TimeBase Web Administrator supports two types of authentication: [built-in OAuth2](#built-in-authentication-configuration) & [SSO](#sso-configuration). **One of those types must be enabled to run the application.**

## Built-In Authentication Configuration

In this case the Web Application performs the roles of the authentication service provider. 

![](/img/tb_auth2.svg)

To enable built-in authentication, you need to add the following security block to your `application.yaml` configuration file. We recommend using this authentication method for test purposes.

```yaml
  oauth2:
    provider:
      providerType: BUILT_IN_OAUTH
      clientId: web
      oauthServer: http://localhost:8099
      getTokenEndpoint: /oauth/token
      checkTokenEndpoint: /oauth/check
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

## SSO Configuration

![](/img/tb_auth.svg)

1. Authentication service provider identification check is made upon each application start.
2. Browser local storage is checked to have a Refresh Token for the current user.
3. If Refresh Token exists, Silent Token Update is performed to obtain a new Access Token.
4. If Silent Token Update fails for any reason, the user will be logged out and redirected to a Login page.

### ORY Hydra

To enable SSO with [ORY Hydra](https://www.ory.sh/hydra/) add the following blocks to your `application.yaml` configuration file. 

```yaml

spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: Service provider URI

security:
  oauth2:
    provider:
      providerType: SSO
      name: hydra
      clientId: <client_id>
      validateIssuer: false
      userInfo:
        enable: true
    users:
      - username: <username>
        authorities: [TB_ALLOW_READ, TB_ALLOW_WRITE]
      - username: <username>
        authorities: [TB_ALLOW_READ]
```

### Amazon Cognito 

To enable SSO with [Amazon Cognito](https://aws.amazon.com/cognito/?nc1=h_ls) add the following blocks to your `application.yaml` configuration file. 

```yaml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: Service provider URI
security:
  oauth2:
    provider:
      providerType: SSO
      name: cognito
      clientId: <client_id>
      audience: <audience>
      configUrl: Service provider config URL
      logoutUrl: Service provider logout URL
      usernameClaim: username
      validateIssuer: true
    users:
      - username: <username>
        authorities: [TB_ALLOW_READ, TB_ALLOW_WRITE]
      - username: <username>
        authorities: [TB_ALLOW_READ]
```

### Keycloak

To enable SSO with [Keycloak](https://www.keycloak.org/) add the following blocks to your `application.yaml` configuration file. 

```yaml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: Service provider URI
...
security:
  oauth2:
    provider:
      provider-type: SSO
      name: keycloak
      clientId: client ID
      usernameClaim: preferred_username
      validateIssuer: false
      validateClientId: true
    groups:
      - name: <username>
        authorities: [TB_ALLOW_READ, TB_ALLOW_WRITE]
    users:
      - username: <username>
        authorities: [TB_ALLOW_READ, TB_ALLOW_WRITE]

```

### Auth0

To enable SSO with [Auth0](https://auth0.com/) add the following blocks to your `application.yaml` configuration file. 

```yaml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: Service provider URI
security:
  oauth2:
    provider:
      providerType: SSO
      name: auth0
      clientId: client ID
      audience: audience URL
      configUrl: configuration URL
      logoutUrl: logout URL
```

Refer to [Auth0 Configuration](https://github.com/epam/TimebaseWS/tree/main/guide/authentication/auth0.md) to learn how to configure Auth0.

## Samples 

* [REST JS](https://github.com/epam/TimebaseWS/blob/main-1.0/samples/js/simpleRest_TokenAuth.js) 
* [WS JS](https://github.com/epam/TimebaseWS/blob/main-1.0/samples/js/simpleWs_TokenAuth.js) 
* [REST Python](https://github.com/epam/TimebaseWS/tree/main-1.0/samples/python/simple_rest_client.py) 
* [WS Python](https://github.com/epam/TimebaseWS/tree/main-1.0/samples/python/simple_ws_client.py) 