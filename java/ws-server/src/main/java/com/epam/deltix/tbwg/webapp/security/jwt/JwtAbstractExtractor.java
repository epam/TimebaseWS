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
package com.epam.deltix.tbwg.webapp.security.jwt;

import com.epam.deltix.tbwg.webapp.settings.SecurityOauth2ProviderSettings;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimNames;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;

import java.util.Collection;
import java.util.Map;

abstract class JwtAbstractExtractor implements JwtExtractor {

    protected final SecurityOauth2ProviderSettings settings;
    protected final Converter<Jwt, Collection<GrantedAuthority>> jwtGrantedAuthoritiesConverter = new JwtGrantedAuthoritiesConverter();

    JwtAbstractExtractor(SecurityOauth2ProviderSettings settings) {
        this.settings = settings;
    }

    @Override
    public Map<String, Object> extractAttributes(Jwt jwt) {
        return jwt.getClaims();
    }

    @Override
    public Collection<GrantedAuthority> extractAuthorities(Jwt jwt) {
        return jwtGrantedAuthoritiesConverter.convert(jwt);
    }

    @Override
    public String extractUsername(Jwt jwt) {
        String usernameClaim = settings.getUsernameClaim();
        if (usernameClaim == null || usernameClaim.isEmpty()) {
            usernameClaim = JwtClaimNames.SUB;
        }

        Object username = jwt.getClaims().get(usernameClaim);
        return username != null ? (String) username : null;
    }
}
