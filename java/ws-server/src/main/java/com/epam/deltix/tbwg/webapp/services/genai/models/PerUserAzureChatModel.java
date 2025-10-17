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

import dev.langchain4j.model.azure.AzureOpenAiChatModel;
import dev.langchain4j.model.chat.ChatModel;
import dev.langchain4j.model.chat.request.ChatRequest;
import dev.langchain4j.model.chat.request.ChatRequestParameters;
import dev.langchain4j.model.chat.response.ChatResponse;

public class PerUserAzureChatModel implements ChatModel {

    private final String endpoint;
    private final String deploymentName;
    private final UserAiApiKeyProvider keyProvider;
    private final ChatRequestParameters defaultParams;

    public PerUserAzureChatModel(String endpoint,
                                 String deploymentName,
                                 UserAiApiKeyProvider keyProvider) {
        this.endpoint = endpoint;
        this.deploymentName = deploymentName;
        this.keyProvider = keyProvider;
        this.defaultParams = PerUserChatMaker.defaultParams(deploymentName);
    }

    @Override
    public ChatRequestParameters defaultRequestParameters() {
        return defaultParams;
    }

    @Override
    public ChatResponse doChat(ChatRequest chatRequest) {
        var pr = PerUserChatMaker.prepare(chatRequest);
        String username = pr.username();
        ChatRequest effectiveRequest = pr.request();

        ChatModel model = AzureOpenAiChatModel.builder()
                .endpoint(endpoint)
                .apiKey(keyProvider.resolve(username))
                .deploymentName(deploymentName)
                .build();

        return model.doChat(effectiveRequest);
    }

}
