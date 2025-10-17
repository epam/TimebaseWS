/*
 * Copyright 2025 EPAM Systems, Inc
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
package com.epam.deltix.tbwg.webapp.services.genai.models;

import com.epam.deltix.tbwg.webapp.services.authorization.TbwgUser;
import com.epam.deltix.tbwg.webapp.services.authorization.SettingsAuthorizationProvider;
import com.epam.deltix.tbwg.webapp.settings.AiApiSettings;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.stereotype.Service;

@Service
@ConditionalOnBean(AiApiSettings.class)
public class UserAiApiKeyProvider {

    private final SettingsAuthorizationProvider usersProvider;
    private final AiApiSettings globalSettings;

    public UserAiApiKeyProvider(SettingsAuthorizationProvider usersProvider,
                                AiApiSettings globalSettings) {
        this.usersProvider = usersProvider;
        this.globalSettings = globalSettings;
    }

    public String resolve(String username) {
        String cfgKey = globalSettings.findUserKey(username);
        if (cfgKey != null && !cfgKey.isBlank()) {
            return cfgKey;
        }

        if (username != null && !username.isBlank()) {
            TbwgUser user = usersProvider.getUser(username);
            if (user != null && user.getAiApiKey() != null && !user.getAiApiKey().isBlank()) {
                return user.getAiApiKey();
            }
        }
        throw new IllegalStateException("No AI API key configured for user: " + username);
    }
}
