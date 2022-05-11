# Web Authentication 

TimeBase Web Administrator supports two types of authentication: built-in OAuth2 & SSO. **One of those types must be enabled to run the application - refer to [configuration]().**

## Authentication Types 

### SSO

![](/img/tb_auth.svg)

1. Authentication service provider identification check is made upon each application start.
2. Browser local storage is checked to have a Refresh Token for the current user.
3. If Refresh Token exists, Silent Token Update is performed to obtain a new Access Token.
4. If Silent Token Update fails for any reason, the user will be logged out and redirected to a Login page.

#### ORY Hydra

---

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

#### Auth0 

Refer to [Auth0 Configuration](https://github.com/epam/TimebaseWS/tree/main/guide/authentication/auth0.md) 


### Built-In OAuth2

In this case the Web Application performs the roles of the authentication service provider. 

![](/img/tb_auth2.svg)


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


