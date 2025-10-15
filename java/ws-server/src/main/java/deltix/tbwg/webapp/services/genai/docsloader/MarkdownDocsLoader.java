package deltix.tbwg.webapp.services.genai.docsloader;

import deltix.tbwg.webapp.services.genai.docsloader.DocsParser.Parsed;
import dev.langchain4j.data.document.Document;
import dev.langchain4j.data.document.Metadata;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.ResourcePatternResolver;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

public class MarkdownDocsLoader {

    private static final Pattern FIRST_H1 = Pattern.compile("^#\\s+(.+)$", Pattern.MULTILINE);
    private final ResourcePatternResolver resolver;
    private final DocsParser parser = new DocsParser();

    public MarkdownDocsLoader(ResourcePatternResolver resolver) {
        this.resolver = resolver;
    }

    public List<Document> load() throws IOException {
        Resource[] resources = resolver.getResources("classpath*:qql_gen/*.md");
        List<Document> docs = new ArrayList<>();
        for (Resource r : resources) {
            String filename = Objects.requireNonNull(r.getFilename());
            try (BufferedReader br = new BufferedReader(
                    new InputStreamReader(r.getInputStream(), StandardCharsets.UTF_8))) {

                Parsed parsed = parser.parse(br);
                String body = parsed.getBody();
                if (body == null || body.isBlank()) continue;

                Map<String, Object> fm = parsed.getFrontMatter();

                Metadata baseMeta = new Metadata();
                baseMeta.put("source", "qql_gen");
                baseMeta.put("fileName", filename);

                String title = extractTitle(fm, body, filename);
                baseMeta.put("title", title);

                Object tagsRaw = fm.get("tags");
                if (tagsRaw != null) {
                    String tagsValue = normalizeToTagString(tagsRaw);
                    if (!tagsValue.isBlank()) {
                        baseMeta.put("tags", tagsValue);
                    }
                }

                for (Map.Entry<String, Object> e : fm.entrySet()) {
                    String key = e.getKey();
                    if ("tags".equals(key) || baseMeta.containsKey(key)) continue;
                    putValue(baseMeta, key, e.getValue());
                }

                docs.addAll(MarkdownSectionExtractor.extract(body, baseMeta));
            }
        }
        return docs;
    }

    private String extractTitle(Map<String, Object> fm, String body, String filename) {
        Object t = fm.get("title");
        if (t instanceof String s && !s.isBlank()) return s;
        Matcher m = FIRST_H1.matcher(body);
        if (m.find()) return m.group(1).trim();
        int dot = filename.lastIndexOf('.');
        String base = dot > 0 ? filename.substring(0, dot) : filename;
        return base.replace('_', ' ');
    }

    private String normalizeToTagString(Object value) {
        if (value instanceof Collection<?> c) {
            return c.stream()
                    .map(Objects::toString)
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .collect(Collectors.joining(", "));
        } else if (value instanceof String s) {
            if (s.startsWith("[") && s.endsWith("]")) {
                String inner = s.substring(1, s.length() - 1).trim();
                if (inner.isEmpty()) return "";
                return Arrays.stream(inner.split(","))
                        .map(String::trim)
                        .filter(x -> !x.isEmpty())
                        .collect(Collectors.joining(", "));
            }
            return s;
        }
        return value.toString();
    }

    private void putValue(Metadata md, String key, Object value) {
        if (value == null) return;
        if (value instanceof String s) md.put(key, s);
        else if (value instanceof Integer i) md.put(key, i);
        else if (value instanceof Long l) md.put(key, l);
        else if (value instanceof Float f) md.put(key, f);
        else if (value instanceof Double d) md.put(key, d);
        else if (value instanceof UUID u) md.put(key, u);
        else if (value instanceof Boolean b) md.put(key, b.toString());
        else if (value instanceof Number n) {
            double dv = n.doubleValue();
            long lv = n.longValue();
            if (Math.abs(dv - lv) < 1e-9) md.put(key, lv);
            else md.put(key, dv);
        } else if (value instanceof Collection<?> c) {
            String joined = c.stream()
                    .map(Objects::toString)
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .collect(Collectors.joining(", "));
            if (!joined.isEmpty()) md.put(key, joined);
        } else {
            md.put(key, value.toString());
        }
    }
}
