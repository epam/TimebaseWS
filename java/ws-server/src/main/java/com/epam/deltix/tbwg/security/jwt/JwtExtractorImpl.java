package com.epam.deltix.tbwg.security.jwt;

import com.epam.deltix.tbwg.settings.SecurityOauth2ProviderSettings;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(value = "security.oauth2.provider.userInfo.enable", havingValue = "false", matchIfMissing = true)
@Lazy
public class JwtExtractorImpl extends JwtAbstractExtractor implements JwtExtractor {

    @Autowired
    public JwtExtractorImpl(SecurityOauth2ProviderSettings settings) {
        super(settings);
    }

}
