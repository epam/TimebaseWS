package deltix.tbwg.webapp.services.genai.docsloader;

import dev.langchain4j.data.document.Document;
import dev.langchain4j.data.document.Metadata;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public final class MarkdownSectionExtractor {

    private static final Pattern SECTION_PATTERN = Pattern.compile("^\\[\\[SECTION:([^\\]]+)]]\\s*$");
    private static final Pattern TAGS_PATTERN    = Pattern.compile("^\\[\\[TAGS:([^\\]]+)]]\\s*$");

    private MarkdownSectionExtractor() {}

    public static List<Document> extract(String body, Metadata baseMeta) {
        if (body == null || body.isBlank()) return List.of();
        List<Section> sections = parse(body);
        if (sections.isEmpty()) return List.of();

        List<Document> docs = new ArrayList<>(sections.size());
        Object existingTags = metaGet(baseMeta, "tags");

        for (Section s : sections) {
            Metadata md = copy(baseMeta);
            md.put("sectionId", s.id);
            md.put("sectionOrder", s.order);
            String merged = mergeTags(existingTags, s.tags);
            if (!merged.isBlank()) {
                md.put("tags", merged);
            }
            if (!md.containsKey("title")) {
                Object t = metaGet(baseMeta, "title");
                if (t != null) md.put("title", t.toString());
            }
            md.put("sectionTitle", s.id);
            docs.add(Document.from(s.content.toString().trim() + "\n", md));
        }
        return docs;
    }

    private static Object metaGet(Metadata md, String key) {
        if (md == null) return null;
        try {
            Map<String, Object> map = md.toMap();
            return map.get(key);
        } catch (Throwable t) {
            return null;
        }
    }

    private static String mergeTags(Object existing, List<String> sectionTags) {
        LinkedHashSet<String> set = new LinkedHashSet<>();
        if (existing != null) {
            for (String p : existing.toString().split(",")) {
                String v = normTag(p);
                if (!v.isEmpty()) set.add(v);
            }
        }
        for (String t : sectionTags) {
            String v = normTag(t);
            if (!v.isEmpty()) set.add(v);
        }
        if (set.isEmpty()) return "";
        return String.join(", ", set);
    }

    private static String normTag(String raw) {
        if (raw == null) return "";
        String s = raw.trim();
        if (s.isEmpty()) return "";
        return s.replace(' ', '_').toUpperCase(Locale.ROOT);
    }

    private static Metadata copy(Metadata in) {
        Metadata m = new Metadata();
        if (in == null) return m;
        Map<String, Object> map;
        try {
            map = in.toMap();
        } catch (Throwable t) {
            return m;
        }
        for (Map.Entry<String, Object> e : map.entrySet()) {
            Object v = e.getValue();
            String k = e.getKey();
            if (v instanceof String s) m.put(k, s);
            else if (v instanceof Integer i) m.put(k, i);
            else if (v instanceof Long l) m.put(k, l);
            else if (v instanceof Float f) m.put(k, f);
            else if (v instanceof Double d) m.put(k, d);
            else if (v instanceof Boolean b) m.put(k, b.toString());
            else if (v != null) m.put(k, v.toString());
        }
        return m;
    }

    private static List<Section> parse(String body) {
        String[] lines = body.split("\n", -1);
        List<Section> out = new ArrayList<>();
        List<String> pendingTags = new ArrayList<>();
        Section current = null;
        int order = 0;

        for (String line : lines) {
            String trimmed = line.trim();

            Matcher mTags = TAGS_PATTERN.matcher(trimmed);
            if (mTags.matches()) {
                pendingTags = parseTagList(mTags.group(1));
                continue;
            }

            Matcher mSection = SECTION_PATTERN.matcher(trimmed);
            if (mSection.matches()) {
                String id = mSection.group(1).trim();
                if (id.isEmpty()) id = "SECTION_" + order;
                current = new Section(id, order++, new ArrayList<>(pendingTags));
                pendingTags.clear();
                out.add(current);
                continue;
            }

            if (current == null) {
                current = new Section("FULL", order++, new ArrayList<>(pendingTags));
                pendingTags.clear();
                out.add(current);
            }
            current.content.append(line).append('\n');
        }

        out.removeIf(s -> s.content.toString().trim().isEmpty());
        if (out.isEmpty()) {
            Section s = new Section("FULL", 0, List.of());
            s.content.append(body);
            out.add(s);
        }
        return out;
    }

    private static List<String> parseTagList(String raw) {
        if (raw == null) return List.of();
        String inner = raw.trim();
        if (inner.isEmpty()) return List.of();
        String[] parts = inner.split("[, ]+");
        List<String> out = new ArrayList<>(parts.length);
        for (String p : parts) {
            String t = p.trim();
            if (!t.isEmpty()) out.add(t);
        }
        return out;
    }

    private static final class Section {
        final String id;
        final int order;
        final List<String> tags;
        final StringBuilder content = new StringBuilder();
        Section(String id, int order, List<String> tags) {
            this.id = id;
            this.order = order;
            this.tags = tags;
        }
    }
}
