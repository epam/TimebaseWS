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
import dev.langchain4j.data.embedding.Embedding;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.model.openaiofficial.OpenAiOfficialEmbeddingModel;
import dev.langchain4j.model.output.Response;

import java.util.ArrayList;
import java.util.List;

public class PerUserOpenAiOfficialEmbeddingModel implements EmbeddingModel {

    private final AiApiSettings settings;
    private final UserAiApiKeyProvider keyProvider;

    public PerUserOpenAiOfficialEmbeddingModel(AiApiSettings settings,
                                               UserAiApiKeyProvider keyProvider) {
        this.settings = settings;
        this.keyProvider = keyProvider;
    }

    @Override
    public Response<List<Embedding>> embedAll(List<TextSegment> textSegments) {
        if (textSegments == null || textSegments.isEmpty()) {
            throw new IllegalArgumentException("textSegments must not be null or empty");
        }

        String username = null;
        List<TextSegment> effectiveSegments = new ArrayList<>(textSegments.size());

        for (TextSegment segment : textSegments) {
            String segmentText = segment.text();
            if (username == null) {
                String u = PerUserChatMaker.extractUsername(segmentText);
                if (u != null) {
                    username = u;
                }
            }
            String unwrappedText = PerUserChatMaker.unwrapUserInput(segmentText);
            effectiveSegments.add(TextSegment.from(unwrappedText, segment.metadata()));
        }

        EmbeddingModel model = createDelegate(username);
        return model.embedAll(effectiveSegments);
    }

    private EmbeddingModel createDelegate(String username) {
        OpenAiOfficialEmbeddingModel.Builder builder = OpenAiOfficialEmbeddingModel.builder()
                .apiKey(keyProvider.resolve(username));

        String endpoint = settings.getEndpointUrl();
        if (endpoint != null && !endpoint.isBlank()) {
            builder.baseUrl(endpoint);
        }

        String deployment = settings.requireEmbeddingDeploymentName();
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
