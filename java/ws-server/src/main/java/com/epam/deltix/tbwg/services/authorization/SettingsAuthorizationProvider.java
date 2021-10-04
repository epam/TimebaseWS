package com.epam.deltix.tbwg.services.authorization;

import com.epam.deltix.gflog.api.Log;
import com.epam.deltix.gflog.api.LogFactory;
//import deltix.spring.apikeys.ApiKeyInfoProvider;
import com.epam.deltix.tbwg.settings.ApiKeysSettings;
import com.epam.deltix.tbwg.settings.ProviderType;
import com.epam.deltix.tbwg.model.authorization.ApiKeyDto;
import com.epam.deltix.tbwg.model.authorization.UserDto;
import com.epam.deltix.tbwg.services.MangleService;
import com.epam.deltix.tbwg.settings.AuthoritiesSettings;
import com.epam.deltix.tbwg.settings.SecurityOauth2ProviderSettings;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.util.stream.Collectors;

@Service
@ConditionalOnProperty(value = "security.authorization.source", havingValue = "CONFIG", matchIfMissing = true)
public class SettingsAuthorizationProvider implements AuthoritiesProvider, UsersProvider { // , ApiKeyInfoProvider {
    private static final Log LOGGER = LogFactory.getLog(SettingsAuthorizationProvider.class);

    private final ConcurrentMap<String, TbwgUser> users = new ConcurrentHashMap<>();
    private final ConcurrentMap<String, TbwgApiKey> apiKeys = new ConcurrentHashMap<>();

    @Autowired
    public SettingsAuthorizationProvider(SecurityOauth2ProviderSettings providerSettings,
                                         AuthoritiesSettings settings,
                                         ApiKeysSettings apiKeysSettings,
                                         MangleService mangleService)
    {
        List<UserDto> usersList = settings.getUsers();
        if (usersList != null) {
            ProviderType providerType = providerSettings.getProviderType();
            usersList.forEach(user -> {
                users.put(
                    user.getUsername(),
                    new TbwgUser(
                        user.getUsername(),
                        providerType == ProviderType.BUILT_IN_OAUTH ? user.getPassword() : "",
                        buildAuthorities(user.getAuthorities())
                    )
                );
            });
        }

        List<ApiKeyDto> apiKeysList = apiKeysSettings.getApiKeys();
        if (apiKeysList != null) {
            for (ApiKeyDto apiKey : apiKeysList) {
                TbwgUser user = users.get(apiKey.getUser());
                if (user == null) {
                    LOGGER.warn().append("Unknown User of Api Key ").append(apiKey.getName()).commit();
                } else if (apiKey.getKey() == null) {
                    LOGGER.warn().append("Unknown Key of Api Key ").append(apiKey.getName()).commit();
                } else {
                    apiKeys.put(apiKey.getName(),
                        new TbwgApiKey(apiKey.getName(),
                            mangleService.convertHashedValue(apiKey.getKey()),
                            user, apiKey.getAuthorities()
                        )
                    );
                }
            }
        }
    }

    private List<GrantedAuthority> buildAuthorities(List<String> authorities) {
        if (authorities == null) {
            return new ArrayList<>();
        }

        return authorities.stream().map(SimpleGrantedAuthority::new)
            .collect(Collectors.toList());
    }

    @Override
    public List<GrantedAuthority> getAuthorities(String username) {
        TbwgUser user = users.get(username);
        if (user != null) {
            return new ArrayList<>(user.getAuthorities());
        }

        return new ArrayList<>();
    }

    @Override
    public TbwgUser getUser(String username) {
        return users.get(username);
    }

    @Override
    public List<TbwgUser> getUsers() {
        return new ArrayList<>(users.values());
    }

    public TbwgApiKey getApiKey(String key) {
        return apiKeys.get(key);
    }
}
