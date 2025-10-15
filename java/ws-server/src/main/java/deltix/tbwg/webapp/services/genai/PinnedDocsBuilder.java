package deltix.tbwg.webapp.services.genai;

import com.epam.deltix.gflog.api.Log;
import com.epam.deltix.gflog.api.LogFactory;
import deltix.tbwg.webapp.services.genai.models.PerUserChatMaker;
import deltix.tbwg.webapp.settings.AiApiSettings;
import dev.langchain4j.rag.content.Content;
import dev.langchain4j.rag.content.retriever.ContentRetriever;
import dev.langchain4j.rag.query.Query;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.Collectors;

@Component
@ConditionalOnBean(AiApiSettings.class)
public class PinnedDocsBuilder {

    private static final Log LOG = LogFactory.getLog(PinnedDocsBuilder.class);
    private static final int PIN_CHAR_BUDGET = 16_000;

    private final ContentRetriever retriever;

    public PinnedDocsBuilder(ContentRetriever retriever) {
        this.retriever = retriever;
    }

    public String build(String username, String overview,
                        List<String> planTags, String userIntent) {
        if (planTags == null || planTags.isEmpty()) {
            return minimalPinned(overview);
        }
        String baseQuery = userIntent + ", tags: " + String.join(" ", planTags);
        String retrievalQuery = PerUserChatMaker.wrapUserInput(username, baseQuery);
        List<Content> retrieved;
        try {
            retrieved = retriever.retrieve(Query.from(retrievalQuery));
        } catch (Throwable t) {
            LOG.warn("Retriever error: %s").with(t.toString());
            return minimalPinned(overview);
        }
        if (retrieved.isEmpty()) return minimalPinned(overview);

        Set<String> tagSet = planTags.stream()
                .map(s -> s.toUpperCase(Locale.ROOT))
                .collect(Collectors.toSet());
        List<Content> filtered = retrieved.stream().filter(c -> {
            Map<String, Object> md = safeMeta(c);
            Object tagsObj = md.get("tags");
            if (tagsObj == null) return false;
            String upper = tagsObj.toString().toUpperCase(Locale.ROOT);
            return tagSet.stream().anyMatch(upper::contains);
        }).toList();

        List<Content> use = filtered.isEmpty() ? retrieved : filtered;

        StringBuilder sb = new StringBuilder("### QQL Spec Segments\n");
        int budget = 0;
        Set<String> seen = new HashSet<>();

        for (Content c : use) {
            String text = c.textSegment().text();
            if (text == null || text.isBlank()) continue;
            Map<String, Object> md = safeMeta(c);
            String file = Objects.toString(md.get("fileName"), "unknown");
            String sect = Objects.toString(md.get("sectionId"),
                    Objects.toString(md.get("partIndex"), "0"));
            String key = file + "#" + sect;
            if (!seen.add(key)) continue;
            String header = "#### Section " + key + "\n";
            int add = header.length() + text.length() + 2;
            if (budget + add > PIN_CHAR_BUDGET) break;
            sb.append(header).append(text.trim()).append("\n\n");
            budget += add;
        }

        return seen.isEmpty() ? minimalPinned(overview) : sb.toString();
    }

    private Map<String, Object> safeMeta(Content c) {
        try {
            return c.textSegment().metadata().toMap();
        } catch (Throwable t) {
            return Map.of();
        }
    }

    private String minimalPinned(String overview) {
        if (overview == null) return "";
        String upper = overview.toUpperCase(Locale.ROOT);
        StringBuilder sb = new StringBuilder();
        for (String tag : List.of("CLAUSE_ORDER", "CORE")) {
            int idx = upper.indexOf(tag);
            if (idx >= 0) {
                int end = Math.min(overview.length(), idx + 1200);
                sb.append("### Extract ").append(tag).append("\n")
                        .append(overview, idx, end).append("\n\n");
            }
        }
        return sb.isEmpty() ? overview : sb.toString();
    }
}
