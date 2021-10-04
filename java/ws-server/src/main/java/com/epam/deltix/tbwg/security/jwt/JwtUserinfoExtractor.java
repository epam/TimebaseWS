package com.epam.deltix.tbwg.security.jwt;

import com.epam.deltix.tbwg.services.oid.UserInfoService;
import com.epam.deltix.tbwg.settings.SecurityOauth2ProviderSettings;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

import java.security.InvalidParameterException;
import java.time.Instant;

@Component
@ConditionalOnProperty(value = "security.oauth2.provider.userInfo.enable", havingValue = "true")
@Lazy
public class JwtUserinfoExtractor extends JwtAbstractExtractor implements JwtExtractor {

    private final UserInfoService userInfoService;

    @Autowired
    public JwtUserinfoExtractor(SecurityOauth2ProviderSettings settings, UserInfoService userInfoService) {
        super(settings);
        this.userInfoService = userInfoService;
    }

    @Override
    public String extractUsername(Jwt jwt) {
        String usernameClaim = settings.getUsernameClaim();
        Object username = usernameClaim != null && !usernameClaim.isEmpty() ? jwt.getClaims().get(usernameClaim) : null;
        if (username != null) {
            return (String) username;
        }

        String sub = jwt.getSubject();
        if (sub == null) {
            throw new InvalidParameterException("Token must have 'sub'.");
        }
        Instant exp = jwt.getExpiresAt();
        if (exp == null) {
            throw new InvalidParameterException("Token must have 'exp'.");
        }
        long expirationTime = exp.toEpochMilli();
        return userInfoService.getUsername(jwt.getTokenValue(), sub, expirationTime);
    }
}

