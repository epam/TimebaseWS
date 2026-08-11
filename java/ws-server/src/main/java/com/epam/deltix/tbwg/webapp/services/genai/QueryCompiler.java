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
import com.epam.deltix.qsrv.hf.tickdb.comm.client.TickDBClient;
import com.epam.deltix.tbwg.webapp.services.timebase.TimebaseService;
import com.epam.deltix.tbwg.webapp.settings.AiApiSettings;
import com.epam.deltix.util.parsers.CompilationException;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.stereotype.Component;

import java.util.ArrayList;

@Component
@ConditionalOnBean(AiApiSettings.class)
public class QueryCompiler {
    private static final Log LOG = LogFactory.getLog(QueryCompiler.class);

    public String compile(String query, TimebaseService service) {
        if (query == null || query.isBlank()) return "Empty query";
        try {
            TickDBClient tb = (TickDBClient) service.getConnection();
            tb.compileQuery(query, new ArrayList<>());
            return "";
        } catch (CompilationException ce) {
            LOG.warn("Compile fail: %s").with(ce.getMessage());
            return ce.getMessage();
        } catch (Throwable t) {
            LOG.warn("Unexpected compile error: %s").with(t.toString());
            return "Internal compiler error";
        }
    }
}