package deltix.tbwg.webapp.services.genai;

import dev.langchain4j.service.*;

public interface GenAiHelperService {
    @SystemMessage(fromResource = "qql_gen/planning_system_prompt.txt")
    Result<String> planQql(@V("schemaDescription") String schemaDescription,
                           @V("cheatSheet") String cheatSheet,
                           @UserMessage String userMessage);

    @SystemMessage(fromResource = "qql_gen/prompt_system.txt")
    TokenStream genQql(@V("schemaDescription") String schemaDescription,
                       @V("pinnedDocs") String pinnedDocs,
                       @UserMessage String userMessage);
}