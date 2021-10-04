package com.epam.deltix.tbwg.security.jwt;

import com.epam.deltix.tbwg.security.TokenService;
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
