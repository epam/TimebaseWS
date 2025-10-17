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

import dev.langchain4j.data.message.ChatMessage;
import dev.langchain4j.data.message.UserMessage;
import dev.langchain4j.model.chat.request.ChatRequest;
import dev.langchain4j.model.chat.request.ChatRequestParameters;

import java.util.ArrayList;
import java.util.List;

public class PerUserChatMaker {

    private static final String USER_MARKER_PREFIX = "__USER::";
    private static final String USER_MARKER_SUFFIX = "__\n";

    private PerUserChatMaker() {}

    public static String wrapUserInput(String username, String userInput) {
        if (username == null || username.isBlank()) {
            return userInput;
        }
        return USER_MARKER_PREFIX + username + USER_MARKER_SUFFIX +
                (userInput == null ? "" : userInput);
    }

    public static String extractUsername(String userInput) {
        if (userInput == null) {
            return null;
        }
        if (userInput.startsWith(USER_MARKER_PREFIX)) {
            int end = userInput.indexOf(USER_MARKER_SUFFIX);
            if (end > 0) {
                return userInput.substring(USER_MARKER_PREFIX.length(), end);
            }
        }
        return userInput;
    }

    public static String unwrapUserInput(String userInput) {
        if (userInput == null) {
            return null;
        }
        if (userInput.startsWith(USER_MARKER_PREFIX)) {
            int end = userInput.indexOf(USER_MARKER_SUFFIX);
            if (end > 0) {
                return userInput.substring(end + (USER_MARKER_SUFFIX).length());
            }
        }
        return userInput;
    }

    public record ProcessResult(String username, ChatRequest request) {}

    public static ProcessResult prepare(ChatRequest chatRequest) {
        if (chatRequest.messages().isEmpty()) {
            throw new IllegalArgumentException("ChatRequest must contain at least one message");
        }

        List<ChatMessage> original = chatRequest.messages();
        List<ChatMessage> newMessages = new ArrayList<>(original.size());

        String username = null;
        boolean changed = false;
        int scanLimit = Math.min(2, original.size());

        for (int i = 0; i < original.size(); i++) {
            ChatMessage m = original.get(i);
            if (!changed && i < scanLimit && m instanceof UserMessage um) {
                String raw = um.singleText();
                username = extractUsername(raw);
                String unwrapped = unwrapUserInput(raw);
                newMessages.add(new UserMessage(unwrapped));
                changed = true;
            } else {
                newMessages.add(m);
            }
        }

        ChatRequest effectiveRequest = changed
                ? ChatRequest.builder()
                .parameters(chatRequest.parameters())
                .messages(newMessages)
                .build()
                : chatRequest;

        return new ProcessResult(username, effectiveRequest);
    }

    public static ChatRequestParameters defaultParams(String modelName) {
        return ChatRequestParameters.builder().modelName(modelName).build();
    }
}
