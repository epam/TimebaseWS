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

import com.epam.deltix.tbwg.webapp.services.authorization.AuthoritiesProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.Map;

@Component
public class JwtAuthenticationConverterImpl implements Converter<Jwt, AbstractAuthenticationToken> {

    private final JwtExtractor jwtExtractor;
    private final AuthoritiesProvider authoritiesProvider;

    @Autowired
    public JwtAuthenticationConverterImpl(JwtExtractor jwtExtractor, AuthoritiesProvider authoritiesProvider) {
        this.jwtExtractor = jwtExtractor;
        this.authoritiesProvider = authoritiesProvider;
    }

    @Override
    public AbstractAuthenticationToken convert(Jwt jwt) {
        String name = jwtExtractor.extractUsername(jwt);
        Map<String, Object> attributes = jwtExtractor.extractAttributes(jwt);
        Collection<GrantedAuthority> authorities = jwtExtractor.extractAuthorities(jwt);
        authorities.addAll(authoritiesProvider.getAuthorities(name));

        return new JwtAuthenticationToken(
            Jwt.withTokenValue(jwt.getTokenValue())
                .claims((c) -> c.putAll(attributes))
                .headers((h) -> h.putAll(jwt.getHeaders()))
                .build(),
            authorities,
            name
        );
    }

}
