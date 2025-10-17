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

import dev.langchain4j.data.embedding.Embedding;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.azure.AzureOpenAiEmbeddingModel;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.model.output.Response;

import java.util.ArrayList;
import java.util.List;

public class PerUserAzureEmbeddingModel implements EmbeddingModel {

    private final String endpoint;
    private final String deploymentName;
    private final UserAiApiKeyProvider keyProvider;

    public PerUserAzureEmbeddingModel(String endpoint,
                                      String deploymentName,
                                      UserAiApiKeyProvider keyProvider) {
        this.endpoint = endpoint;
        this.deploymentName = deploymentName;
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

        EmbeddingModel model = AzureOpenAiEmbeddingModel.builder()
                .endpoint(endpoint)
                .deploymentName(deploymentName)
                .apiKey(keyProvider.resolve(username))
                .build();
        return model.embedAll(effectiveSegments);
    }
}
