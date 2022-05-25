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

import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.stream.Collectors;

public abstract class AbstractApiKeysAuthenticationService implements ApiKeysAuthenticationService {

    @Override
    public Authentication authenticate(String key, String payload, String signature, String nonce) {
        ApiKeyInfo apiKey = authenticateInternal(key, signature, payload, nonce);
        if (apiKey != null) {
            return new ApiKeyAuthenticationToken(
                apiKey.getApiKeyName(), apiKey.getUser(),
                apiKey.getAuthorities() != null ?
                    apiKey.getAuthorities().stream().map(SimpleGrantedAuthority::new)
                        .collect(Collectors.toList()) :
                    apiKey.getUser().getAuthorities()
            );
        }

        return null;
    }

    protected abstract ApiKeyInfo authenticateInternal(String key, String signature, String payload, String nonce);

}
