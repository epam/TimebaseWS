/*
 * Copyright 2023 EPAM Systems, Inc
 *
 * See the NOTICE file distributed with this work for additional information
 * regarding copyright ownership. Licensed under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

package com.epam.deltix.tbwg.webapp.services.authorization;

import com.epam.deltix.gflog.api.Log;
import com.epam.deltix.gflog.api.LogFactory;
import com.epam.deltix.spring.apikeys.ApiKeyInfoProvider;
import com.epam.deltix.tbwg.webapp.model.authorization.ApiKeyDto;
import com.epam.deltix.tbwg.webapp.model.authorization.UserDto;
import com.epam.deltix.tbwg.webapp.services.MangleService;
import com.epam.deltix.tbwg.webapp.settings.ApiKeysSettings;
import com.epam.deltix.tbwg.webapp.settings.AuthoritiesSettings;
import com.epam.deltix.tbwg.webapp.settings.ProviderType;
import com.epam.deltix.tbwg.webapp.settings.SecurityOauth2ProviderSettings;
import io.netty.util.internal.StringUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.util.stream.Collectors;

@Service
@ConditionalOnProperty(value = "security.authorization.source", havingValue = "CONFIG", matchIfMissing = true)
public class SettingsAuthorizationProvider implements AuthoritiesProvider, UsersProvider, ApiKeyInfoProvider {

    private final Random rnd = new Random();

    private char nextCharAlphaNumeric() {
        return (char) (0x30 + rnd.nextInt(0x5A - 0x30 + 1));
    }

    private String getRandomAlphaNumeric(int size) {
        StringBuilder sb = new StringBuilder(size);
        for (int i = 0; i < size; i++) {
            sb.append(nextCharAlphaNumeric());
        }

        return sb.toString();
    }

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

                String pass = user.getPassword();
                if (providerType == ProviderType.BUILT_IN_OAUTH && StringUtil.isNullOrEmpty(user.getPassword())) {
                    pass = getRandomAlphaNumeric(16);
                    new BCryptPasswordEncoder().encode(pass);
                    LOGGER.warn("Generating random password for user (%s): %s").with(user.getUsername()).with(pass);
                }
                users.put(
                    user.getUsername(),
                    new TbwgUser(
                        user.getUsername(),
                        providerType == ProviderType.BUILT_IN_OAUTH ? pass : "",
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

    @Override
    public TbwgApiKey getApiKey(String key) {
        return apiKeys.get(key);
    }
}
