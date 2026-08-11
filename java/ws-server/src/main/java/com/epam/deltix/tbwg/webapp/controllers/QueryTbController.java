/*
 * Copyright 2026 EPAM Systems, Inc
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
package com.epam.deltix.tbwg.webapp.controllers;

import com.epam.deltix.gflog.api.Log;
import com.epam.deltix.gflog.api.LogFactory;
import com.epam.deltix.qsrv.hf.tickdb.pub.DXTickStream;
import com.epam.deltix.tbwg.webapp.model.input.QueryRequest;
import com.epam.deltix.tbwg.webapp.services.timebase.TimebaseRegistry;
import com.epam.deltix.tbwg.webapp.services.timebase.TimebaseService;
import com.epam.deltix.tbwg.webapp.services.timebase.base.SchemaManipulationService;
import com.epam.deltix.tbwg.webapp.services.view.utils.QueryInfo;
import com.epam.deltix.util.lang.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

import java.util.List;


@RestController
@RequestMapping("/api/v0")
@CrossOrigin
public class QueryTbController {

    private static final Log LOGGER = LogFactory.getLog(QueryTbController.class);

    private final TimebaseRegistry registry;
    private final SchemaManipulationService schemaManipulationService;

    @Autowired
    public QueryTbController(TimebaseRegistry registry,
                             SchemaManipulationService schemaManipulationService) {
        this.registry = registry;
        this.schemaManipulationService = schemaManipulationService;
    }

    @PreAuthorize("hasAnyAuthority('TB_ALLOW_READ', 'TB_ALLOW_WRITE')")
    @PostMapping(value = "/checkQueryTb", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<QueryTbResolutionResult> checkQueryTb(
            @Valid @RequestBody QueryRequest select,
            @RequestParam(required = false) String tb) {

        if (select == null || StringUtils.isEmpty(select.query)) {
            return ResponseEntity.badRequest().build();
        }

        TimebaseService currentTb = registry.resolve(tb);

        try {
            schemaManipulationService.describe(currentTb, select, false);
            return ResponseEntity.ok(new QueryTbResolutionResult(currentTb.getId(), false, null, null));
        } catch (Exception describeError) {
            LOGGER.info().append("describe failed on tb=").append(currentTb.getId())
                    .append(": ").append(describeError.getMessage()).commit();
        }

        List<String> queryStreams = new QueryInfo(select.query).sourceStreams();

        if (queryStreams.isEmpty()) {
            return ResponseEntity.ok(new QueryTbResolutionResult(
                    currentTb.getId(), false, null, "Query references no source streams"
            ));
        }

        for (TimebaseService candidate : registry.getAll()) {
            if (candidate.getId().equals(currentTb.getId())) {
                continue;
            }
            if (!allStreamsExist(candidate, queryStreams)) {
                continue;
            }
            try {
                schemaManipulationService.describe(candidate, select, false);
                LOGGER.info().append("Streams ").append(queryStreams.toString())
                        .append(" resolved via tb=").append(candidate.getId()).commit();
                return ResponseEntity.ok(
                        new QueryTbResolutionResult(candidate.getId(), true, queryStreams, null)
                );
            } catch (Exception e) {
                LOGGER.info().append("describe failed on candidate tb=").append(candidate.getId())
                        .append(": ").append(e.getMessage()).commit();
            }
        }

        return ResponseEntity.ok(new QueryTbResolutionResult(
                currentTb.getId(), false, null,
                "Streams " + queryStreams + " not found in any other TimeBase instance"
        ));
    }

    private boolean allStreamsExist(TimebaseService tbSvc, List<String> streamKeys) {
        for (String key : streamKeys) {
            DXTickStream stream = tbSvc.getStream(key);
            if (stream == null) {
                return false;
            }
        }
        return true;
    }

    public static class QueryTbResolutionResult {

        public final String tbId;

        public final boolean changed;

        public final List<String> streams;

        public final String error;

        public QueryTbResolutionResult(String tbId, boolean changed, List<String> streams, String error) {
            this.tbId = tbId;
            this.changed = changed;
            this.streams = streams;
            this.error = error;
        }
    }
}
