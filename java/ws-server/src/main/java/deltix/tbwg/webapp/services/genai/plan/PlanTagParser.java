package deltix.tbwg.webapp.services.genai.plan;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public final class PlanTagParser {
    private static final Pattern BRACKETS = Pattern.compile("\\[(.+?)]");

    public static List<String> extractTags(String raw) {
        if (raw == null) return List.of();
        Matcher m = BRACKETS.matcher(raw);
        if (!m.find()) return List.of();
        String inside = m.group(1);
        String[] parts = inside.split("[,;]");
        List<String> out = new ArrayList<>(parts.length);
        for (String p : parts) {
            String t = p.trim();
            if (!t.isEmpty()) {
                out.add(t.toUpperCase().replace(' ', '_'));
            }
        }
        return out;
    }

    private PlanTagParser() {}
}
