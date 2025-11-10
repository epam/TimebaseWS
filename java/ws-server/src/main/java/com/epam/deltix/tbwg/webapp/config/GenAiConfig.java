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
package com.epam.deltix.tbwg.webapp.config;

import com.epam.deltix.tbwg.webapp.services.genai.GenAiHelperService;
import com.epam.deltix.tbwg.webapp.services.genai.models.*;
import com.epam.deltix.tbwg.webapp.services.genai.docsloader.MarkdownCodeAwareSplitter;
import com.epam.deltix.tbwg.webapp.services.genai.docsloader.MarkdownDocsLoader;
import com.epam.deltix.tbwg.webapp.settings.AiApiSettings;
import dev.langchain4j.data.document.Document;
import dev.langchain4j.data.document.DocumentSplitter;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.chat.ChatModel;
import dev.langchain4j.model.chat.StreamingChatModel;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.rag.content.retriever.ContentRetriever;
import dev.langchain4j.rag.content.retriever.EmbeddingStoreContentRetriever;
import dev.langchain4j.service.AiServices;
import dev.langchain4j.store.embedding.EmbeddingStore;
import dev.langchain4j.store.embedding.EmbeddingStoreIngestor;
import dev.langchain4j.store.embedding.inmemory.InMemoryEmbeddingStore;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.core.io.support.ResourcePatternResolver;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;
import java.util.List;

@Configuration
@ConditionalOnBean(AiApiSettings.class)
public class GenAiConfig {

    private static final String CLASSPATH_EMB_PATH = "classpath:qql_gen/qql-docs-embeddings.json";
    private static final String FALLBACK_EMB_FILE = "qql-docs-embeddings.json";

    @Bean
    public ChatModel perUserChatModel(AiApiSettings settings,
                                      UserAiApiKeyProvider keyProvider) {
        return new PerUserOpenAiOfficialChatModel(settings, keyProvider);
    }

    @Bean
    public StreamingChatModel perUserStreamingChatModel(AiApiSettings settings,
                                                        UserAiApiKeyProvider keyProvider) {
        return new PerUserOpenAiOfficialStreamingChatModel(settings, keyProvider);
    }

    @Bean
    public EmbeddingModel perUserEmbeddingModel(AiApiSettings settings,
                                                UserAiApiKeyProvider keyProvider) {
        return new PerUserOpenAiOfficialEmbeddingModel(settings, keyProvider);
    }

    @Bean
    public GenAiHelperService genAiHelperService(ChatModel model, StreamingChatModel streamingModel) {
        return AiServices.builder(GenAiHelperService.class)
                .chatModel(model)
                .streamingChatModel(streamingModel)
                .build();
    }

    @Bean
    public MarkdownDocsLoader markdownDocsLoader(ResourcePatternResolver resolver) {
        return new MarkdownDocsLoader(resolver);
    }

    @Bean
    public List<Document> qqlAllSectionDocs(MarkdownDocsLoader loader) throws IOException {
        return loader.load();
    }

    @Bean
    EmbeddingStore<TextSegment> embeddingStore(EmbeddingModel embeddingModel,
                                               MarkdownDocsLoader loader,
                                               ResourceLoader resourceLoader) throws IOException {
        Resource res = resourceLoader.getResource(CLASSPATH_EMB_PATH);
        if (res.exists()) {
            try (InputStream in = res.getInputStream()) {
                var tmp = Files.createTempFile("qql-docs-embeddings", ".json");
                Files.copy(in, tmp, StandardCopyOption.REPLACE_EXISTING);
                return InMemoryEmbeddingStore.fromFile(tmp.toString());
            }
        }

        try {
            return InMemoryEmbeddingStore.fromFile(FALLBACK_EMB_FILE);
        } catch (RuntimeException ignore) {
            // Rebuild the embeddings
        }

        InMemoryEmbeddingStore<TextSegment> store = new InMemoryEmbeddingStore<>();
        List<Document> documents = loader.load();
        if (documents.isEmpty())
            return store;
        DocumentSplitter splitter = MarkdownCodeAwareSplitter.defaultSplitter();
        EmbeddingStoreIngestor ingestor = EmbeddingStoreIngestor.builder()
                .documentSplitter(splitter)
                .embeddingModel(embeddingModel)
                .embeddingStore(store)
                .build();
        documents.set(0, Document.from(
                PerUserChatMaker.wrapUserInput("regenerateEmbeddings",
                        documents.get(0).text())));
        ingestor.ingest(documents);
        store.serializeToFile(FALLBACK_EMB_FILE);

        return store;
    }

    @Bean
    ContentRetriever contentRetriever(EmbeddingStore<TextSegment> embeddingStore,
                                      EmbeddingModel embeddingModel) {
        return EmbeddingStoreContentRetriever.builder()
                .embeddingStore(embeddingStore)
                .embeddingModel(embeddingModel)
                .maxResults(25)
                .minScore(0.55)
                .build();
    }
}
