package com.epam.deltix.tbwg.settings;

import org.springframework.boot.autoconfigure.condition.AnyNestedCondition;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;

public class OAuthConfig extends AnyNestedCondition {
    public OAuthConfig() {
        super(ConfigurationPhase.PARSE_CONFIGURATION);
    }


    @ConditionalOnProperty(value = "security.oauth2.provider.providerType", havingValue = "EXTERNAL_OAUTH")
    static class ExternalOAuth {
    }

    @ConditionalOnProperty(value = "security.oauth2.provider.providerType", havingValue = "BUILT_IN_OAUTH")
    static class BuiltInOAuth {
    }
}
