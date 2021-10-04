package com.epam.deltix.tbwg.services.oid;

import com.epam.deltix.tbwg.settings.ProviderType;
import com.epam.deltix.tbwg.settings.SecurityOauth2ProviderSettings;
import com.epam.deltix.tbwg.settings.UserInfoSettings;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.epam.deltix.gflog.api.Log;
import com.epam.deltix.gflog.api.LogFactory;
import com.epam.deltix.tbwg.model.auth.AuthInfo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.oauth2.resource.OAuth2ResourceServerProperties;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class AuthInfoService {
    private static final Log LOGGER = LogFactory.getLog(AuthInfoService.class);

    private final OAuth2ResourceServerProperties.Jwt jwtConfig;
    private final SecurityOauth2ProviderSettings oauth2ProviderSettings;
    private final UserInfoSettings userInfoSettings;

    private final RestTemplate rest = new RestTemplate();

    private volatile String configUrl;
    private volatile String jwksUrl;
    private volatile String logoutUrl;
    private volatile String userInfoUrl;

    @Autowired
    public AuthInfoService(OAuth2ResourceServerProperties config,
                           SecurityOauth2ProviderSettings oauth2ProviderSettings,
                           UserInfoSettings userInfoSettings)
    {
        this.jwtConfig = config.getJwt();
        this.oauth2ProviderSettings = oauth2ProviderSettings;
        this.userInfoSettings = userInfoSettings;

        if (oauth2ProviderSettings.getProviderType() == ProviderType.SSO) {
            String issuerUrl = jwtConfig.getIssuerUri();
            configUrl = oauth2ProviderSettings.getConfigUrl();
            if (configUrl == null){
                if (issuerUrl == null || issuerUrl.isEmpty()) {
                    throw new RuntimeException("Config URL and Issuer Url is empty");
                }

                configUrl = issuerUrl + "/.well-known/openid-configuration";
            }

            LOGGER.info().append("OpenID config URL: ").append(configUrl).commit();
        }

        jwksUrl = oauth2ProviderSettings.getJwksUrl();
        logoutUrl = oauth2ProviderSettings.getLogoutUrl();
        userInfoUrl = userInfoSettings.getUserInfoUrl();
    }

    private void discover() {
        if (configUrl != null) {
            DiscoveryResponse response = rest(
                HttpMethod.GET, configUrl,
                new HttpEntity<>("", new HttpHeaders()), DiscoveryResponse.class
            ).getBody();

            if (response != null) {
                if (jwksUrl == null) {
                    jwksUrl = response.jwksUri;
                }
                if (logoutUrl == null) {
                    logoutUrl = response.logoutUrl;
                }
                if (userInfoUrl == null) {
                    userInfoUrl = response.userInfoUrl;
                }
            }

            LOGGER.info().append("Jwks URL: ").append(jwksUrl).commit();
            LOGGER.info().append("Logout URL: ").append(logoutUrl).commit();
            LOGGER.info().append("Userinfo URL: ").append(userInfoUrl).commit();
        }
    }

    private <T> ResponseEntity<T> rest(HttpMethod method, String url, HttpEntity<String> entity, Class<T> type) {
        LOGGER.info().append("REST ").append(method).append(" ").append(url).commit();
        ResponseEntity<T> response = rest.exchange(url, method, entity, type);
        if (response.getStatusCode() != HttpStatus.OK) {
            throw new RuntimeException("REST QUERY GET " + url + " failed.");
        }
        LOGGER.info().append("REST ").append(method).append(" ").append(url).append(" done").commit();

        return response;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private static class DiscoveryResponse {

        @JsonProperty("jwks_uri")
        private String jwksUri;

        @JsonProperty("userinfo_endpoint")
        private String userInfoUrl;

        @JsonProperty("end_session_endpoint")
        private String logoutUrl;
    }

    public AuthInfo getAuthInfo() {
        if (oauth2ProviderSettings.getProviderType() == ProviderType.SSO && (jwksUrl == null || logoutUrl == null)) {
            discover();
        }

        return new AuthInfo(
                oauth2ProviderSettings.getProviderType(),
                oauth2ProviderSettings.getName(),
                jwksUrl,
                configUrl,
                oauth2ProviderSettings.getClientId(),
                oauth2ProviderSettings.getAudience(),
                logoutUrl,
                oauth2ProviderSettings.getOauthServer(),
                oauth2ProviderSettings.getGetTokenEndPoint()
        );
    }

    public String getUserInfoUrl() {
        if (userInfoUrl == null) {
            discover();
        }

        return userInfoUrl;
    }
}
