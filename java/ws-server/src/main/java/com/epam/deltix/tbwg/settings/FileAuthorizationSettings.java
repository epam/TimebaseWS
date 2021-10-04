package com.epam.deltix.tbwg.settings;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "security.authorization.file-source")
public class FileAuthorizationSettings {
    private String path;
    private int refreshIntervalMs;

    public String getPath() {
        return path;
    }

    public void setPath(String path) {
        this.path = path;
    }

    public int getRefreshIntervalMs() {
        return refreshIntervalMs;
    }

    public void setRefreshIntervalMs(int refreshIntervalMs) {
        this.refreshIntervalMs = refreshIntervalMs;
    }
}
