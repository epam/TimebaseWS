package com.epam.deltix.tbwg.settings;

import com.epam.deltix.tbwg.model.authorization.ApiKeyDto;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@ConfigurationProperties(prefix = "security.api-keys-provider")
public class ApiKeysSettings {

    private List<ApiKeyDto> apiKeys;

    public List<ApiKeyDto> getApiKeys() {
        return apiKeys;
    }

    public void setApiKeys(List<ApiKeyDto> apiKeys) {
        this.apiKeys = apiKeys;
    }

}
