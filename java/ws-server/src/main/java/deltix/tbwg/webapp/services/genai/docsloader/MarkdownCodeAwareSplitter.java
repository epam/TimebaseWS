package deltix.tbwg.webapp.services.genai.docsloader;

import dev.langchain4j.data.document.Document;
import dev.langchain4j.data.document.DocumentSplitter;
import dev.langchain4j.data.document.Metadata;
import dev.langchain4j.data.segment.TextSegment;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class MarkdownCodeAwareSplitter implements DocumentSplitter {

    private final int maxChars;
    private final int softMinBeforeSplit;
    private final int minChunk;
    private final boolean addPartIndex;

    public MarkdownCodeAwareSplitter(int maxChars, int softMinBeforeSplit, int minChunk, boolean addPartIndex) {
        this.maxChars = maxChars;
        this.softMinBeforeSplit = softMinBeforeSplit;
        this.minChunk = minChunk;
        this.addPartIndex = addPartIndex;
    }

    public static MarkdownCodeAwareSplitter defaultSplitter() {
        return new MarkdownCodeAwareSplitter(2000, 1200, 200, true);
    }

    @Override
    public List<TextSegment> split(Document document) {
        String content = document.text();
        if (content == null || content.isBlank()) return List.of();
        if (content.length() <= maxChars * 1.15) {
            Metadata md = copyMetadata(document.metadata());
            return List.of(TextSegment.from(content, md));
        }

        String[] lines = content.split("\n", -1);
        List<TextSegment> parts = new ArrayList<>();
        StringBuilder current = new StringBuilder();
        StringBuilder carryParagraph = new StringBuilder();
        boolean inCode = false;
        String fence = null;
        int partIndex = 0;

        for (String line : lines) {
            String trimmed = line.trim();
            boolean fenceLine = isFenceLine(trimmed);

            if (fenceLine) {
                if (!inCode) {
                    if (carryParagraph.isEmpty()) {
                        moveTrailingParagraph(current, carryParagraph);
                    }
                    inCode = true;
                    fence = trimmed.substring(0, 3);
                } else if (trimmed.startsWith(fence)) {
                    inCode = false;
                    fence = null;
                }
            }

            if (!inCode) {
                boolean boundary = isHeading(trimmed) || isSectionMarker(trimmed);
                int projected = current.length() + carryParagraph.length() + line.length() + 1;
                if ((projected > maxChars && current.length() >= softMinBeforeSplit) ||
                        (boundary && current.length() >= softMinBeforeSplit)) {
                    flushPart(document, parts, current, partIndex++);
                    if (!carryParagraph.isEmpty()) {
                        current.append(carryParagraph);
                        carryParagraph.setLength(0);
                    }
                }
            }

            if (!carryParagraph.isEmpty() && inCode && current.isEmpty()) {
                current.append(carryParagraph);
                carryParagraph.setLength(0);
            }

            current.append(line).append('\n');

            if (!inCode) {
                if (trimmed.isEmpty()) {
                    carryParagraph.setLength(0);
                } else {
                    if (carryParagraph.length() > 2000) carryParagraph.setLength(0);
                    carryParagraph.append(line).append('\n');
                }
            }
        }

        if (!current.isEmpty()) {
            flushPart(document, parts, current, partIndex);
        }

        if (parts.size() == 1 && addPartIndex) {
            Metadata md = copyMetadata(document.metadata());
            parts.clear();
            parts.add(TextSegment.from(content, md));
        }
        return parts;
    }

    private void flushPart(Document original, List<TextSegment> parts,
                           StringBuilder current, int index) {
        if (current.isEmpty()) return;
        if (current.length() < minChunk && !parts.isEmpty()) {
            TextSegment last = parts.remove(parts.size() - 1);
            String merged = last.text() + current;
            Metadata md = copyMetadata(last.metadata());
            parts.add(TextSegment.from(merged, md));
            current.setLength(0);
            return;
        }
        Metadata md = copyMetadata(original.metadata());
        if (addPartIndex) md.put("partIndex", index);
        parts.add(TextSegment.from(current.toString(), md));
        current.setLength(0);
    }

    private boolean isFenceLine(String trimmed) {
        if (trimmed.length() < 3) return false;
        return trimmed.startsWith("```") || trimmed.startsWith("~~~");
    }

    private boolean isHeading(String trimmed) {
        return trimmed.startsWith("# ");
    }

    private boolean isSectionMarker(String trimmed) {
        return trimmed.startsWith("[[SECTION:");
    }

    private void moveTrailingParagraph(StringBuilder current, StringBuilder out) {
        int lastBlank = current.lastIndexOf("\n\n");
        if (lastBlank >= 0) {
            String para = current.substring(lastBlank + 2);
            if (!para.isBlank() && para.length() < 600) {
                out.append(para);
                current.setLength(lastBlank + 2);
            }
        }
    }

    private Metadata copyMetadata(Metadata original) {
        Metadata m = new Metadata();
        if (original == null) return m;
        Map<String, Object> map;
        try {
            map = original.toMap();
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
            else if (v != null) m.put(k, String.valueOf(v));
        }
        return m;
    }
}
