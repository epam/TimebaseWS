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