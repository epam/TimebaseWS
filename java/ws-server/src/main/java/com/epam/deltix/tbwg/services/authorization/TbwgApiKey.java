package com.epam.deltix.tbwg.services.authorization;

import java.util.List;

public class TbwgApiKey { //implements ApiKeyInfo {

    private final String apiKeyName;
    private final String apiKey;
    private final TbwgUser user;
    private final List<String> authorities;

    public TbwgApiKey(String apiKeyName, String apiKey, TbwgUser user, List<String> authorities) {
        this.apiKeyName = apiKeyName;
        this.apiKey = apiKey;
        this.user = user;
        this.authorities = authorities;
    }

    public String getApiKeyName() {
        return apiKeyName;
    }

    public String getApiKey() {
        return apiKey;
    }

    public TbwgUser getUser() {
        return user;
    }

    public List<String> getAuthorities() {
        return authorities;
    }
}
