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

package com.epam.deltix.tbwg.webapp.security.jwt;

import com.epam.deltix.gflog.api.Log;
import com.epam.deltix.gflog.api.LogFactory;
import com.epam.deltix.tbwg.webapp.settings.SecurityOauth2ProviderSettings;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimNames;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;

import java.util.*;
import java.util.stream.Collectors;

abstract class JwtAbstractExtractor implements JwtExtractor {

    private static final Log LOGGER = LogFactory.getLog(JwtAbstractExtractor.class);

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
        Collection<GrantedAuthority> authorities = jwtGrantedAuthoritiesConverter.convert(jwt);
        authorities.addAll(getPermissions(jwt, settings.getPermissionsClaim()));
        return authorities;
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

    private List<GrantedAuthority> getPermissions(Jwt jwt, String permissionsClaimPath) {
        try {
            return getPermissions(jwt.getClaims(), permissionsClaimPath).stream()
                .map(SimpleGrantedAuthority::new)
                .collect(Collectors.toList());
        } catch (Exception e) {
            LOGGER.error().append(e.getMessage()).commit();
        }

        return new ArrayList<>();
    }

    private static List<String> getPermissions(Map<String, Object> claimsMap, String permissionsClaimPath) {
        if (permissionsClaimPath == null || permissionsClaimPath.isEmpty()) {
            return new ArrayList<>();
        }

        if (claimsMap == null) {
            throw new IllegalArgumentException("claims map must not be null");
        }

        String[] claimAndKey = permissionsClaimPath.split("\\.");
        //We suppose that the first item in authoritiesClaimPath is claim
        //We suppose that the last item in authoritiesClaimPath is key
        String lastKey = claimAndKey[claimAndKey.length - 1];
        for (int i = 0; i < claimAndKey.length - 1; i++) {
            String claimKey = claimAndKey[i];
            try {
                claimsMap = checkAndCastToMap(claimsMap.get(claimKey));
            } catch (Exception e) {
                throw new IllegalStateException("Can't parse claim id = " + i + " in claimsMap for key = " + claimKey + " because : claim " + e.getMessage());
            }
        }

        try {
            return checkAndCastToStringsList(claimsMap.get(lastKey));
        } catch (Exception e) {
            throw new IllegalStateException("Can't parse last claim in claimsMap for key = " + lastKey + " because : value " + e.getMessage());
        }
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> checkAndCastToMap(Object o) {
        if (o == null) {
            throw new IllegalStateException("is null");
        }
        if (!(o instanceof Map)) {
            throw new IllegalStateException("is not a map");
        }

        return (Map<String, Object>) o;
    }

    private static List<String> checkAndCastToStringsList(Object o) {
        if (o == null) {
            throw new IllegalStateException("is null");
        }

        if (!(o instanceof List<?>)) {
            throw new IllegalStateException("is not a list");
        }

        return ((List<?>) o).stream().map(Object::toString).collect(Collectors.toList());
    }


}
