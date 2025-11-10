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
package com.epam.deltix.tbwg.webapp.services.genai;

import com.epam.deltix.gflog.api.Log;
import com.epam.deltix.gflog.api.LogFactory;
import com.epam.deltix.tbwg.webapp.services.timebase.TimebaseService;
import com.google.common.io.Resources;
import com.epam.deltix.qsrv.hf.pub.md.RecordClassDescriptor;
import com.epam.deltix.qsrv.hf.pub.md.RecordClassSet;
import com.epam.deltix.qsrv.hf.tickdb.comm.client.TickDBClient;
import com.epam.deltix.qsrv.hf.tickdb.pub.DXTickStream;
import com.epam.deltix.tbwg.webapp.model.genai.QqlGenMessage;
import com.epam.deltix.tbwg.webapp.services.genai.models.PerUserChatMaker;
import com.epam.deltix.tbwg.webapp.services.genai.plan.PlanTagParser;
import com.epam.deltix.tbwg.webapp.settings.AiApiSettings;
import com.epam.deltix.tbwg.webapp.websockets.subscription.SubscriptionChannel;
import dev.langchain4j.model.chat.response.ChatResponse;
import dev.langchain4j.model.chat.response.PartialResponse;
import dev.langchain4j.model.chat.response.PartialResponseContext;
import dev.langchain4j.service.Result;
import dev.langchain4j.service.TokenStream;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@ConditionalOnBean(AiApiSettings.class)
public class GenAiService {

    private static final Log LOG = LogFactory.getLog(GenAiService.class);
    private static final boolean USE_FULL_DESCRIPTION = true;
    private static final int MAX_TAGS = 12;
    private static final Duration STREAM_TIMEOUT = Duration.ofMinutes(5);

    private final GenAiHelperService genAiHelperService;
    private final PinnedDocsBuilder pinnedBuilder;
    private final QueryCompiler compiler;
    private final TimebaseService timebaseService;
    private final int maxAttempts;

    private static final ExecutorService EXEC = Executors.newCachedThreadPool();

    private record Context(AtomicBoolean stopped) {}
    private final Map<SubscriptionChannel, Context> active = new ConcurrentHashMap<>();

    public GenAiService(GenAiHelperService genAiHelperService,
                        PinnedDocsBuilder pinnedBuilder,
                        QueryCompiler compiler,
                        TimebaseService timebaseService,
                        AiApiSettings settings) {
        this.genAiHelperService = genAiHelperService;
        this.pinnedBuilder = pinnedBuilder;
        this.compiler = compiler;
        this.timebaseService = timebaseService;
        this.maxAttempts = settings.getMaxAttempts();
    }

    public void subscribe(String username, String userInput,
                          String rawStreamKeys, SubscriptionChannel channel) {
        if (active.containsKey(channel)) {
            channel.sendError(new IllegalStateException("Already subscribed"));
            return;
        }
        Set<String> streamKeys = parseStreamKeys(rawStreamKeys);
        Context ctx = new Context(new AtomicBoolean(false));
        active.put(channel, ctx);
        EXEC.submit(() -> orchestrate(username, userInput, streamKeys, channel, ctx));
    }

    public void unsubscribe(SubscriptionChannel channel) {
        Context ctx = active.remove(channel);
        if (ctx != null) {
            ctx.stopped().set(true);
            channel.sendMessage(QqlGenMessage.builder("CANCELLED").finalEvent(true).build());
        }
    }

    private void orchestrate(String username, String intent, Set<String> streamKeys,
                             SubscriptionChannel ch, Context ctx) {
        try {
            if (ctx.stopped().get()) return;

            String overview = loadOverview();
            String schema = schemaDescription(streamKeys);
            send(ch, QqlGenMessage.builder("PLANNING_START"));

            List<String> tags;
            String planRaw;
            try {
                String userInput = PerUserChatMaker.wrapUserInput(username, intent);
                Result<String> planRes = genAiHelperService.planQql(schema, overview, userInput);
                planRaw = planRes.content() == null ? "" : planRes.content().trim();
                send(ch, QqlGenMessage.builder("PLANNING_DONE").data(planRaw));
                tags = PlanTagParser.extractTags(planRaw);
                if (tags.size() > MAX_TAGS) tags = tags.subList(0, MAX_TAGS);
                send(ch, QqlGenMessage.builder("TAGS").data(tags.toString()));
                LOG.info("Planning produced %s tags, token usage: %s")
                        .with(tags.size())
                        .with(planRes.tokenUsage());
            } catch (Throwable t) {
                LOG.warn("Planning failed: %s").with(t.toString());
                send(ch, QqlGenMessage.builder("PLANNING_FAILED").error(t.getMessage()));
                tags = List.of();
            }

            if (ctx.stopped().get()) return;

            String pinned = pinnedBuilder.build(username, overview, tags, intent);
            send(ch, QqlGenMessage.builder("DOCS_RETRIEVED").data(summaryPinned(pinned)));

            iterativeGenerate(username, schema, pinned, intent, ch, ctx);

        } catch (Throwable t) {
            LOG.warn("GenAI orchestration error: %s").with(t.toString());
            if (!ctx.stopped().get()) {
                send(ch, QqlGenMessage.builder("ERROR").error(t.getMessage()).finalEvent(true));
            }
        } finally {
            active.remove(ch);
        }
    }

    private void iterativeGenerate(String username, String schema, String pinned,
                                   String intent, SubscriptionChannel ch, Context ctx) {
        String prompt = intent;
        String lastQuery = "";
        String lastError = null;

        for (int attempt = 1; attempt <= maxAttempts && !ctx.stopped().get(); attempt++) {
            send(ch, QqlGenMessage.builder("ATTEMPT_START")
                    .attempt(attempt).maxAttempts(maxAttempts).data(prompt));

            StringBuilder streamed = new StringBuilder();
            CountDownLatch latch = new CountDownLatch(1);

            String wrappedPrompt = PerUserChatMaker.wrapUserInput(username, prompt);
            TokenStream ts = genAiHelperService.genQql(schema, pinned, wrappedPrompt)
                    .onPartialResponseWithContext((PartialResponse partResp, PartialResponseContext partCtx) -> {
                        if (ctx.stopped().get()) {
                            partCtx.streamingHandle().cancel();
                            latch.countDown();
                            LOG.info("Generation cancelled by user.");
                            return;
                        }

                        String part = partResp.text();
                        if (part != null && !part.isEmpty()) {
                            streamed.append(part);
                            send(ch, QqlGenMessage.builder("PART")
                                    .data(part));
                        }
                    })
                    .onCompleteResponse((ChatResponse resp) -> {
                        latch.countDown();
                        LOG.info("Generation complete, token usage: %s").with(resp.tokenUsage());
                    })
                    .onError((Throwable e) -> {
                        if (!ctx.stopped().get())
                            send(ch, QqlGenMessage.builder("ERROR")
                                    .error(e.getMessage()).finalEvent(true));
                        latch.countDown();
                    });
            ts.start();
            try {
                if (!latch.await(STREAM_TIMEOUT.toMillis(), TimeUnit.MILLISECONDS)) {
                    send(ch, QqlGenMessage.builder("ERROR").error("Generation timeout").finalEvent(true));
                    return;
                }
            } catch (InterruptedException ie) {
                Thread.currentThread().interrupt();
                send(ch, QqlGenMessage.builder("ERROR").error("Interrupted").finalEvent(true));
                return;
            }
            if (ctx.stopped().get()) return;

            lastQuery = streamed.toString().trim();
            String compileErr = compiler.compile(lastQuery);

            if (compileErr.isEmpty()) {
                send(ch, QqlGenMessage.builder("ATTEMPT_COMPILE_OK")
                        .attempt(attempt).maxAttempts(maxAttempts)
                        .data(lastQuery));
                send(ch, QqlGenMessage.builder("FINAL_SUCCESS")
                        .data(lastQuery).finalEvent(true));
                return;
            } else {
                lastError = compileErr;
                send(ch, QqlGenMessage.builder("ATTEMPT_COMPILE_ERROR")
                        .attempt(attempt).maxAttempts(maxAttempts)
                        .data(lastQuery).error(compileErr));
                LOG.warn("Attempt: %s, compile error: %s, query: \n%s").with(attempt)
                        .with(compileErr).with(lastQuery);
                if (attempt == maxAttempts) break;
                prompt = repairPrompt(intent, lastQuery, compileErr);
            }
        }

        if (!ctx.stopped().get()) {
            send(ch, QqlGenMessage.builder("FINAL_FAILURE")
                    .data(lastQuery)
                    .error(lastError)
                    .finalEvent(true));
        }
    }

    private void send(SubscriptionChannel ch, QqlGenMessage.Builder b) {
        ch.sendMessage(b.build());
    }

    private static String loadOverview() {
        try {
            return Resources.toString(
                    Resources.getResource("qql_gen/overview.md"),
                    StandardCharsets.UTF_8);
        } catch (Throwable t) {
            LOG.warn("Overview load failed: %s").with(t.toString());
            return "Overview unavailable.";
        }
    }

    private String schemaDescription(Set<String> streamKeys) {
        if (streamKeys == null || streamKeys.isEmpty()) return "No streams selected.";
        StringBuilder b = new StringBuilder();
        TickDBClient tb = (TickDBClient) timebaseService.getConnection();
        for (String key : streamKeys) {
            DXTickStream s = tb.getStream(key);
            if (s == null) {
                LOG.warn("Missing stream: %s").with(key);
                continue;
            }
            b.append("Stream ").append(key).append(":\n");
            if (USE_FULL_DESCRIPTION) {
                b.append(s.describe()).append("\n\n");
            } else {
                describeBasic(s, b);
            }
        }
        return b.toString();
    }

    private static void describeBasic(DXTickStream stream, StringBuilder b) {
        RecordClassSet rcs = stream.getStreamOptions().getMetaData();
        for (RecordClassDescriptor cd : rcs.getContentClasses()) {
            b.append("  - Message ").append(cd.getName()).append(": ");
            boolean first = true;
            RecordClassDescriptor cur = cd;
            while (cur != null) {
                for (var f : cur.getFields()) {
                    if (!first) b.append(", ");
                    b.append(f.getName());
                    first = false;
                }
                cur = cur.getParent();
            }
            b.append("\n");
        }
        b.append("\n\n");
    }

    private static String repairPrompt(String intent, String prev, String err) {
        return "User intent:\n" + intent +
                "\n\nPrevious QQL (fix minimally):\n" + prev +
                "\n\nCompiler error:\n" + err +
                "\n\nOutput ONLY corrected QQL.";
    }

    private static String summaryPinned(String pinned) {
        if (pinned == null) return "No pinned docs.";
        return "Pinned size=" + pinned.length();
    }

    private static Set<String> parseStreamKeys(String raw) {
        if (raw == null || raw.isBlank()) return Collections.emptySet();
        return Stream.of(raw.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toSet());
    }
}
