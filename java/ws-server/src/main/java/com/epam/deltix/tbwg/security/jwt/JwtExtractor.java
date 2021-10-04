package com.epam.deltix.tbwg.security.jwt;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;

import java.util.Collection;
import java.util.Map;

public interface JwtExtractor {

    Map<String, Object> extractAttributes(Jwt jwt);

    Collection<GrantedAuthority> extractAuthorities(Jwt jwt);

    String extractUsername(Jwt jwt);

}
