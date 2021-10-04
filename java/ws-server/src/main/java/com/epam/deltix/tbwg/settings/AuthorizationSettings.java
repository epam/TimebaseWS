package com.epam.deltix.tbwg.settings;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "security.authorization")
public class AuthorizationSettings {

    enum Source {
        FILE,
        CONFIG;
    }

    private Source source;

    public Source getSource() {
        return source;
    }

    public void setSource(Source source) {
        this.source = source;
    }
}
