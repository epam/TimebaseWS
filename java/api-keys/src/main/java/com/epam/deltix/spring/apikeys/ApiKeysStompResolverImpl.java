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
package com.epam.deltix.spring.apikeys;

import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.security.core.Authentication;

public class ApiKeysStompResolverImpl implements ApiKeysStompResolver {

    private final ApiKeysAuthenticationService apiKeysAuthenticationService;

    public ApiKeysStompResolverImpl(ApiKeysAuthenticationService apiKeysAuthenticationService) {
        this.apiKeysAuthenticationService = apiKeysAuthenticationService;
    }

    @Override
    public Authentication authenticate(StompHeaderAccessor accessor) {
        String apiKey = accessor.getFirstNativeHeader(ApiKeysAuthenticationService.API_KEY_HEADER);
        String signature = accessor.getFirstNativeHeader(ApiKeysAuthenticationService.SIGNATURE_HEADER);

        if (apiKey != null && signature != null) {
            String payloadHeaderValue = accessor.getFirstNativeHeader(ApiKeysAuthenticationService.PAYLOAD_HEADER);
            String payload = "CONNECT" +
                ApiKeysAuthenticationService.PAYLOAD_HEADER + "=" + payloadHeaderValue + "&" +
                ApiKeysAuthenticationService.API_KEY_HEADER + "=" + apiKey;

            return apiKeysAuthenticationService.authenticate(
                apiKey, payload, signature, "not supported"
            );
        }

        return null;
    }
}
