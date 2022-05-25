/*
 * Copyright 2021 EPAM Systems, Inc
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
package com.epam.deltix.spring.apikeys.config;

import com.epam.deltix.spring.apikeys.*;
import com.epam.deltix.spring.apikeys.settings.SessionServiceSettings;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ApiKeysConfiguration {

    @Bean
    @ConditionalOnProperty(value = "security.api-keys.sessions.enabled", havingValue = "false", matchIfMissing = true)
    public ApiKeysAuthenticationService apiKeysAuthenticationService(ApiKeyInfoProvider apiKeyInfoProvider) {
        return new ApiKeysAuthenticationServiceImpl(apiKeyInfoProvider);
    }

    @Bean
    @ConditionalOnProperty(value = "security.api-keys.sessions.enabled", havingValue = "true")
    public ApiKeysAuthenticationService sessionAuthenticationService(SessionService sessionService) {
        return new SessionAuthenticationService(sessionService);
    }

    @Bean
    @ConditionalOnProperty(value = "security.api-keys.sessions.enabled", havingValue = "false", matchIfMissing = true)
    public ApiKeysStompResolver apiKeysStompResolver(ApiKeysAuthenticationService apiKeysAuthenticationService) {
        return new ApiKeysStompResolverImpl(apiKeysAuthenticationService);
    }

    @Bean
    @ConditionalOnProperty(value = "security.api-keys.sessions.enabled", havingValue = "true")
    public ApiKeysStompResolver sessionStompResolver(ApiKeysAuthenticationService apiKeysAuthenticationService) {
        return new SessionStompResolver(apiKeysAuthenticationService);
    }

    @Bean
    @ConditionalOnProperty(value = "security.api-keys.sessions.enabled", havingValue = "true")
    public SessionService sessionService(SessionServiceSettings sessionServiceSettings, SessionLoginService sessionLoginService) {
        return new SessionServiceImpl(sessionServiceSettings, sessionLoginService);
    }

}
