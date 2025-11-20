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

import com.epam.deltix.tbwg.webapp.settings.AiApiSettings;
import dev.langchain4j.model.chat.StreamingChatModel;
import dev.langchain4j.model.chat.request.ChatRequest;
import dev.langchain4j.model.chat.request.ChatRequestParameters;
import dev.langchain4j.model.chat.response.StreamingChatResponseHandler;
import dev.langchain4j.model.openaiofficial.OpenAiOfficialStreamingChatModel;

public class PerUserOpenAiOfficialStreamingChatModel implements StreamingChatModel {

    private final AiApiSettings settings;
    private final UserAiApiKeyProvider keyProvider;
    private final ChatRequestParameters defaultParams;

    public PerUserOpenAiOfficialStreamingChatModel(AiApiSettings settings,
                                                   UserAiApiKeyProvider keyProvider) {
        this.settings = settings;
        this.keyProvider = keyProvider;
        this.defaultParams = PerUserChatMaker
        .defaultOpenAiOfficialParams(settings.chatModelNameForParams());
    }

    @Override
    public ChatRequestParameters defaultRequestParameters() {
        return defaultParams;
    }

    @Override
    public void doChat(ChatRequest chatRequest, StreamingChatResponseHandler handler) {
        var pr = PerUserChatMaker.prepare(chatRequest);
        String username = pr.username();
        ChatRequest effectiveRequest = pr.request();

        StreamingChatModel model = createDelegate(username);

        model.doChat(effectiveRequest, handler);
    }

    private StreamingChatModel createDelegate(String username) {
        OpenAiOfficialStreamingChatModel.Builder builder = OpenAiOfficialStreamingChatModel.builder()
                .apiKey(keyProvider.resolve(username));

        String endpoint = settings.getEndpointUrl();
        if (endpoint != null && !endpoint.isBlank()) {
            builder.baseUrl(endpoint);
        }

        String deployment = settings.requireDeploymentName();
        switch (settings.providerOrDefault()) {
            case OPENAI -> builder.modelName(deployment);
            case AZURE -> builder.isAzure(true)
                    .modelName(deployment)
                    .azureDeploymentName(deployment);
            case AZURE_LEGACY -> builder.isAzure(true)
                    .azureDeploymentName(deployment)
                    .modelName("");
            case GITHUB -> builder.isGitHubModels(true)
                    .modelName(deployment);
        }

        return builder.build();
    }
}
