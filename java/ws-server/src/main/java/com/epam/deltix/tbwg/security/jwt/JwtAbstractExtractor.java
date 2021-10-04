package com.epam.deltix.tbwg.security.jwt;

import com.epam.deltix.tbwg.settings.SecurityOauth2ProviderSettings;
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
