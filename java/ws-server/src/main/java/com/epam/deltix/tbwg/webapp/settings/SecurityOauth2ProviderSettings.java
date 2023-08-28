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
package com.epam.deltix.tbwg.webapp.settings;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "security.oauth2.provider")
public class SecurityOauth2ProviderSettings {

    private String name;
    private ProviderType providerType;
    private String jwksUrl;
    private String configUrl;
    private String clientId;
    private String clientSecret;
    private String audience;
    private String logoutUrl;
    private String usernameClaim;
    private String permissionsClaim;
    private String oauthServer;
    private String getTokenEndPoint;
    private String checkTokenEndpoint;
    private boolean validateIssuer = true;

    private UserInfoSettings userInfo;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getJwksUrl() {
        return jwksUrl;
    }

    public void setJwksUrl(String jwksUrl) {
        this.jwksUrl = jwksUrl;
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

    public String getUsernameClaim() {
        return usernameClaim;
    }

    public void setUsernameClaim(String usernameClaim) {
        this.usernameClaim = usernameClaim;
    }

    public String getPermissionsClaim() {
        return permissionsClaim;
    }

    public void setPermissionsClaim(String permissionsClaim) {
        this.permissionsClaim = permissionsClaim;
    }

    public UserInfoSettings getUserInfo() {
        return userInfo;
    }

    public void setUserInfo(UserInfoSettings userInfo) {
        this.userInfo = userInfo;
    }

    public boolean isValidateIssuer() {
        return validateIssuer;
    }

    public void setValidateIssuer(boolean validateIssuer) {
        this.validateIssuer = validateIssuer;
    }

    public String getOauthServer() {
        return oauthServer;
    }

    public void setOauthServer(String oauthServer) {
        this.oauthServer = oauthServer;
    }

    public ProviderType getProviderType() {
        return providerType;
    }

    public void setProviderType(ProviderType providerType) {
        this.providerType = providerType;
    }

    public String getGetTokenEndPoint() {
        return getTokenEndPoint;
    }

    public void setGetTokenEndPoint(String getTokenEndPoint) {
        this.getTokenEndPoint = getTokenEndPoint;
    }

    public String getCheckTokenEndpoint() {
        return checkTokenEndpoint;
    }

    public void setCheckTokenEndpoint(String checkTokenEndpoint) {
        this.checkTokenEndpoint = checkTokenEndpoint;
    }

    public String getClientSecret() {
        return clientSecret;
    }

    public void setClientSecret(String clientSecret) {
        this.clientSecret = clientSecret;
    }
}
