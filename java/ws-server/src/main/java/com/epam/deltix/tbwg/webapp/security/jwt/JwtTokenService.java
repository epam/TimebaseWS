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

import com.epam.deltix.tbwg.webapp.security.TokenService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(value = "security.oauth2.provider.providerType", havingValue = "SSO", matchIfMissing = true)
public class JwtTokenService implements TokenService {

    private final JwtDecoder jwtDecoder;
    private final JwtAuthenticationConverterImpl authenticationConverter;

    @Autowired
    public JwtTokenService(JwtDecoder jwtDecoder, JwtAuthenticationConverterImpl authenticationConverter) {
        this.jwtDecoder = jwtDecoder;
        this.authenticationConverter = authenticationConverter;
    }

    @Override
    public Authentication extract(String token) {
        Jwt jwt;
        try {
            jwt = this.jwtDecoder.decode(token);
        } catch (JwtException failed) {
            throw new RuntimeException("Invalid token");
        }

        return authenticationConverter.convert(jwt);
    }

}
