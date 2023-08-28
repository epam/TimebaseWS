/*
 * Copyright 2023 EPAM Systems, Inc
 *
 * See the NOTICE file distributed with this work for additional information
 * regarding copyright ownership. Licensed under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */
package com.epam.deltix.tbwg.webapp.model.auth;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.epam.deltix.tbwg.webapp.settings.ProviderType;

/**
 * Provides authentication info.
 */
public class AuthInfo {
    /**
     * Provider type. Could be {@link ProviderType#BUILT_IN_OAUTH}, {@link ProviderType#EXTERNAL_OAUTH}
     * and {@link ProviderType#SSO}.
     */
    @JsonProperty("provider_type")
    private ProviderType providerType;

    /**
     * Provider name.
     */
    private String name;

    @JsonProperty("jwks_uri")
    private String jwksUri;

    @JsonProperty("config_url")
    private String configUrl;

    /**
     * Client ID.
     */
    @JsonProperty("client_id")
    private String clientId;

    private String audience;

    @JsonProperty("logout_url")
    private String logoutUrl;

    /**
     * Authorization server url in case of {@link ProviderType#BUILT_IN_OAUTH} or {@link ProviderType#EXTERNAL_OAUTH}
     * {@link AuthInfo#providerType}.
     */
    @JsonProperty("oauth_server")
    private String oauthServer;

    /**
     * Endpoint, that provides token on {@link AuthInfo#oauthServer} in case of {@link ProviderType#BUILT_IN_OAUTH} or
     * {@link ProviderType#EXTERNAL_OAUTH} {@link AuthInfo#providerType}.
     */
    @JsonProperty("token_endpoint")
    private String tokenEndpoint;

    public AuthInfo(ProviderType providerType, String name, String jwksUri, String configUrl, String clientId,
                    String audience, String logoutUrl, String oauthServer, String tokenEndpoint) {
        this.providerType = providerType;
        this.name = name;
        this.jwksUri = jwksUri;
        this.configUrl = configUrl;
        this.clientId = clientId;
        this.audience = audience;
        this.logoutUrl = logoutUrl;
        this.oauthServer = oauthServer;
        this.tokenEndpoint = tokenEndpoint;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getJwksUri() {
        return jwksUri;
    }

    public void setJwksUri(String jwksUri) {
        this.jwksUri = jwksUri;
    }

    public String getConfigUrl() {
        return configUrl;
    }

    public void setConfigUrl(String configUrl) {
        this.configUrl = configUrl;
    }

    public String getClientId() {
        return clientId;
    }

    public void setClientId(String clientId) {
        this.clientId = clientId;
    }

    public String getAudience() {
        return audience;
    }

    public void setAudience(String audience) {
        this.audience = audience;
    }

    public String getLogoutUrl() {
        return logoutUrl;
    }

    public void setLogoutUrl(String logoutUrl) {
        this.logoutUrl = logoutUrl;
    }

    public ProviderType getProviderType() {
        return providerType;
    }

    public void setProviderType(ProviderType providerType) {
        this.providerType = providerType;
    }

    public String getTokenEndpoint() {
        return tokenEndpoint;
    }

    public void setTokenEndpoint(String tokenEndpoint) {
        this.tokenEndpoint = tokenEndpoint;
    }
}
