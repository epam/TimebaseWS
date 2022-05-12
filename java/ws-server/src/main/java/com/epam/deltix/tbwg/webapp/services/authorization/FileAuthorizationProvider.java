/*
 * Copyright 2021 EPAM Systems, Inc
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

import com.fasterxml.jackson.databind.ObjectMapper;
import com.epam.deltix.gflog.api.Log;
import com.epam.deltix.gflog.api.LogFactory;
import com.epam.deltix.spring.apikeys.ApiKeyInfoProvider;
import com.epam.deltix.tbwg.webapp.model.authorization.ApiKeyDto;
import com.epam.deltix.tbwg.webapp.model.authorization.UserDto;
import com.epam.deltix.tbwg.webapp.services.MangleService;
import com.epam.deltix.tbwg.webapp.settings.FileAuthorizationSettings;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@ConditionalOnProperty(value = "security.authorization.source", havingValue = "FILE")
public class FileAuthorizationProvider implements AuthoritiesProvider, UsersProvider, ApiKeyInfoProvider {
    private static final Log LOGGER = LogFactory.getLog(FileAuthorizationProvider.class);

    private final File file;
    private final MangleService mangleService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private final Map<String, TbwgUser> users = new HashMap<>();
    private final Map<String, TbwgApiKey> apiKeys = new HashMap<>();

    private static class UsersFileContent {
        private List<UserDto> users;
        private List<ApiKeyDto> apiKeys;

        public List<UserDto> getUsers() {
            return users;
        }

        public void setUsers(List<UserDto> users) {
            this.users = users;
        }

        public List<ApiKeyDto> getApiKeys() {
            return apiKeys;
        }

        public void setApiKeys(List<ApiKeyDto> apiKeys) {
            this.apiKeys = apiKeys;
        }
    }

    @Autowired
    public FileAuthorizationProvider(FileAuthorizationSettings fileAuthorizationSettings,
                                     MangleService mangleService)
    {
        this.file = new File(fileAuthorizationSettings.getPath());
        this.mangleService = mangleService;
        reloadFile();
    }

    @Scheduled(fixedDelayString = "${security.authorization.file-source.refresh-interval-ms:60000}")
    public void reload() {
        reloadFile();
    }

    private synchronized void reloadFile() {
        try {
            UsersFileContent fileContent = objectMapper.readValue(file, UsersFileContent.class);

            users.clear();
            apiKeys.clear();

            List<UserDto> usersList = fileContent.getUsers();
            if (usersList != null) {
                usersList.forEach(user -> {
                    users.put(
                        user.getUsername(),
                        new TbwgUser(
                            user.getUsername(), user.getPassword(), buildAuthorities(user.getAuthorities())
                        )
                    );
                });
            }

            List<ApiKeyDto> apiKeysList = fileContent.getApiKeys();
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
        } catch (IOException e) {
            throw new RuntimeException(e);
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
    public synchronized List<GrantedAuthority> getAuthorities(String username) {
        TbwgUser user = users.get(username);
        if (user != null) {
            return new ArrayList<>(user.getAuthorities());
        }

        return new ArrayList<>();
    }

    @Override
    public synchronized TbwgUser getUser(String username) {
        return users.get(username);
    }

    @Override
    public synchronized List<TbwgUser> getUsers() {
        return new ArrayList<>(users.values());
    }

    @Override
    public synchronized TbwgApiKey getApiKey(String key) {
        return apiKeys.get(key);
    }
}
