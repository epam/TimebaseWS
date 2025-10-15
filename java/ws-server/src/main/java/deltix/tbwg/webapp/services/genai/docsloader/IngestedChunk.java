package deltix.tbwg.webapp.services.genai.docsloader;

import java.util.Map;

public record IngestedChunk(
        String text,
        Map<String, Object> metadata
) {}
