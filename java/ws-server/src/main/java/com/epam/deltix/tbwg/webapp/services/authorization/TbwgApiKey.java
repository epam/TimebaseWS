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

import com.epam.deltix.spring.apikeys.ApiKeyInfo;

import java.util.List;

public class TbwgApiKey implements ApiKeyInfo {

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

    @Override
    public String getApiKeyName() {
        return apiKeyName;
    }

    @Override
    public String getApiKey() {
        return apiKey;
    }

    @Override
    public TbwgUser getUser() {
        return user;
    }

    @Override
    public List<String> getAuthorities() {
        return authorities;
    }
}
