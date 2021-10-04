package com.epam.deltix.tbwg.security.jwt;

import com.epam.deltix.tbwg.services.authorization.AuthoritiesProvider;
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
