
# Auth0 Settings 

In this section we describe how to configure TimeBase Web Admin Authentication with [Auth0](https://auth0.com/) authentication service provider.

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

##### TimeBase Web Admin Settings 

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

