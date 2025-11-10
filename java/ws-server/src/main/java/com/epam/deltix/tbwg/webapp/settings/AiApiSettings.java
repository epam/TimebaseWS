/*
 * Copyright 2024 EPAM Systems, Inc
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
package com.epam.deltix.tbwg.webapp.settings;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@ConfigurationProperties(prefix = "ai-api")
@Getter
@Setter
@ToString(exclude = {"keys"})
@ConditionalOnExpression("${ai-api.enabled:false}")
public class AiApiSettings {
    private boolean enabled;
    private String endpointUrl;
    private List<UserKey> keys;
    private Provider provider = Provider.AZURE_LEGACY;
    private String deploymentName;
    private String embeddingDeploymentName;
    private int maxAttempts;

    public enum Provider {
        OPENAI,
        AZURE,
        AZURE_LEGACY,
        GITHUB
    }

    @Getter
    @Setter
    public static class UserKey {
        private String username;
        private String key;
    }

    public Provider providerOrDefault() {
        return provider == null ? Provider.AZURE_LEGACY : provider;
    }

    public String chatModelNameForParams() {
        return providerOrDefault() == Provider.AZURE_LEGACY ? "" : deploymentName;
    }

    public String embeddingModelNameForParams() {
        return providerOrDefault() == Provider.AZURE_LEGACY ? "" : embeddingDeploymentName;
    }

    public String requireDeploymentName() {
        return requireNonBlank(deploymentName, "ai-api.deploymentName");
    }

    public String requireEmbeddingDeploymentName() {
        return requireNonBlank(embeddingDeploymentName, "ai-api.embeddingDeploymentName");
    }

    private static String requireNonBlank(String value, String property) {
        if (value == null || value.isBlank()) {
            throw new IllegalStateException(property + " must be provided for the selected ai-api.provider");
        }
        return value;
    }

    public String findUserKey(String username) {
        if (username == null || keys == null) return null;
        return keys.stream()
                .filter(k -> username.equalsIgnoreCase(k.getUsername()))
                .map(UserKey::getKey)
                .filter(v -> v != null && !v.isBlank())
                .findFirst()
                .orElse(null);
    }
}
