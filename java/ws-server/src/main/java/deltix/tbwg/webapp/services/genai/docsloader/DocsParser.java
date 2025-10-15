package deltix.tbwg.webapp.services.genai.docsloader;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.Reader;
import java.util.*;

public final class DocsParser {
    public static final class Parsed {
        private final Map<String, Object> frontMatter;
        private final String body;

        Parsed(Map<String, Object> fm, String body) {
            this.frontMatter = fm;
            this.body = body;
        }

        public Map<String, Object> getFrontMatter() {
            return frontMatter;
        }

        public String getBody() {
            return body;
        }
    }

    public Parsed parse(Reader reader) throws IOException {
        BufferedReader br = new BufferedReader(reader);
        br.mark(8192);

        String first = br.readLine();
        if (first == null) {
            return new Parsed(Collections.emptyMap(), "");
        }

        Map<String, Object> meta;
        StringBuilder body = new StringBuilder();

        if ("---".equals(first.trim())) {
            meta = readDelimitedFrontMatter(br);
        } else {
            br.reset();
            meta = readUndelimitedFrontMatter(br, body);
            if (!meta.isEmpty()) {
                return new Parsed(meta, body.toString());
            }
        }

        String line;
        while ((line = br.readLine()) != null) {
            body.append(line).append('\n');
        }
        return new Parsed(meta, body.toString());
    }

    private Map<String, Object> readDelimitedFrontMatter(BufferedReader br) throws IOException {
        List<String> lines = new ArrayList<>();
        String line;
        while ((line = br.readLine()) != null) {
            if ("---".equals(line.trim())) {
                break;
            }
            lines.add(line);
        }
        return parseKeyValues(lines);
    }

    private Map<String, Object> readUndelimitedFrontMatter(BufferedReader br, StringBuilder body) throws IOException {
        List<String> candidate = new ArrayList<>();
        List<String> buffer = new ArrayList<>();
        String line;
        boolean firstContentChecked = false;
        while ((line = br.readLine()) != null) {
            String trimmed = line.trim();

            if (!firstContentChecked) {
                firstContentChecked = true;
                if (!looksLikeKeyValue(trimmed)) {
                    buffer.add(line);
                    drain(br, buffer);
                    body.append(String.join("\n", buffer)).append('\n');
                    return Collections.emptyMap();
                }
            }

            if (trimmed.isEmpty() || trimmed.startsWith("```")) {
                break;
            }

            if (looksLikeKeyValue(trimmed)) {
                candidate.add(line);
            } else {
                // Not a key-value -> revert: all goes to body
                buffer.addAll(candidate);
                buffer.add(line);
                drain(br, buffer);
                body.append(String.join("\n", buffer)).append('\n');
                return Collections.emptyMap();
            }
        }

        if (line != null) {
            buffer.add(line);
            drain(br, buffer);
            body.append(String.join("\n", buffer)).append('\n');
        }

        return parseKeyValues(candidate);
    }

    private void drain(BufferedReader br, List<String> buffer) throws IOException {
        String l;
        while ((l = br.readLine()) != null) {
            buffer.add(l);
        }
    }

    private boolean looksLikeKeyValue(String line) {
        if (line.isEmpty()) return false;
        int idx = line.indexOf(':');
        if (idx <= 0) return false;
        String key = line.substring(0, idx).trim();
        if (key.isEmpty()) return false;
        return key.matches("[A-Za-z0-9_.-]+");
    }

    private Map<String, Object> parseKeyValues(List<String> lines) {
        Map<String, Object> map = new LinkedHashMap<>();
        for (String raw : lines) {
            int idx = raw.indexOf(':');
            if (idx < 0) continue;
            String key = raw.substring(0, idx).trim();
            String value = raw.substring(idx + 1).trim();
            if (value.startsWith("[")) {
                map.put(key, parseList(value));
            } else {
                value = stripQuotes(value);
                map.put(key, value);
            }
        }
        return map;
    }

    private List<String> parseList(String v) {
        int start = v.indexOf('[');
        int end = v.lastIndexOf(']');
        if (start < 0 || end < 0 || end <= start) return List.of(v);
        String inner = v.substring(start + 1, end).trim();
        if (inner.isEmpty()) return List.of();
        String[] parts = inner.split(",");
        List<String> out = new ArrayList<>(parts.length);
        for (String p : parts) {
            String s = stripQuotes(p.trim());
            if (!s.isEmpty()) out.add(s);
        }
        return out;
    }

    private String stripQuotes(String s) {
        if ((s.startsWith("\"") && s.endsWith("\"")) ||
                (s.startsWith("'") && s.endsWith("'"))) {
            return s.substring(1, s.length() - 1);
        }
        return s;
    }
}
