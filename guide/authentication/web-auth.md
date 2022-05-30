# Web Authentication 

TimeBase Web Administrator supports two types of authentication: [built-in OAuth2](#built-in-authentication-configuration) & [SSO](#sso-configuration). **One of those types must be enabled to run the application.**

## Built-In Authentication Configuration

In this case the Web Application performs the roles of the authentication service provider. 

![](/img/tb_auth2.svg)

Built-In Authentication is enabled by default in the [standard configuration](https://github.com/epam/TimebaseWS/blob/main/java/ws-server/src/main/resources/application.yaml) of the application. 

> Refer to [Configuration](https://github.com/epam/TimebaseWS/blob/main/guide/configuration.md) to learn how to configure the application.

## SSO Configuration

![](/img/tb_auth.svg)

1. Authentication service provider identification check is made upon each application start.
2. Browser local storage is checked to have a Refresh Token for the current user.
3. If Refresh Token exists, Silent Token Update is performed to obtain a new Access Token.
4. If Silent Token Update fails for any reason, the user will be logged out and redirected to a Login page.

### ORY Hydra

To enable SSO with [ORY Hydra](https://www.ory.sh/hydra/), add the following configuration. 

> Refer to [Configuration](https://github.com/epam/TimebaseWS/blob/main/guide/configuration.md) to learn how to configure the application.

```yaml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: <service provider uri>

security:
  oauth2:
    provider:
      providerType: SSO
      name: hydra
      clientId: <client_id>
      validateIssuer: false
      userInfo:
        enable: true
```

### Amazon Cognito 

To enable SSO with [Amazon Cognito](https://aws.amazon.com/cognito/?nc1=h_ls), add the following configuration. 

> Refer to [Configuration](https://github.com/epam/TimebaseWS/blob/main/guide/configuration.md) to learn how to configure the application.

```yaml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: <service provider uri>

security:
  oauth2:
    provider:
      providerType: SSO
      name: cognito
      clientId: <client_id>
      audience: <audience>
      configUrl: <service provider config url>
      logoutUrl: <service provider logout url>
      usernameClaim: username
      validateIssuer: true
```

### Keycloak

To enable SSO with [Keycloak](https://www.keycloak.org/), add the following configuration. 

> Refer to [Configuration](https://github.com/epam/TimebaseWS/blob/main/guide/configuration.md) to learn how to configure the application.

```yaml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: <service provider uri>

security:
  oauth2:
    provider:
      provider-type: SSO
      name: keycloak
      clientId: <client_id>
      usernameClaim: preferred_username
      validateIssuer: false
      validateClientId: true
```

### Auth0

To enable SSO with [Auth0](https://auth0.com/), add the following configuration. 

> Refer to [Configuration](https://github.com/epam/TimebaseWS/blob/main/guide/configuration.md) to learn how to configure the application.

```yaml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: <service provider uri>

security:
  oauth2:
    provider:
      providerType: SSO
      name: auth0
      clientId: <client_id>
      audience: <audience url>
      configUrl: <configuration url>
      logoutUrl: <logout url>
```

Refer to [Auth0 Configuration](https://github.com/epam/TimebaseWS/tree/main/guide/authentication/auth0.md) to learn how to configure Auth0.

## Samples 

* [REST JS](https://github.com/epam/TimebaseWS/blob/main-1.0/samples/js/simpleRest_TokenAuth.js) 
* [WS JS](https://github.com/epam/TimebaseWS/blob/main-1.0/samples/js/simpleWs_TokenAuth.js) 
* [REST Python](https://github.com/epam/TimebaseWS/tree/main-1.0/samples/python/simple_rest_client.py) 
* [WS Python](https://github.com/epam/TimebaseWS/tree/main-1.0/samples/python/simple_ws_client.py) 