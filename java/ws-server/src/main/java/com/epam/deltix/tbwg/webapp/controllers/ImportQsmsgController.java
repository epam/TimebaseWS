/*
 * Copyright 2023 EPAM Systems, Inc
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

import com.epam.deltix.tbwg.webapp.config.WebSocketConfig;
import com.epam.deltix.tbwg.webapp.model.input.ImportRequest;
import com.epam.deltix.tbwg.webapp.model.input.PeriodicityRequest;
import com.epam.deltix.tbwg.webapp.services.timebase.export.imp.ImportService;
import com.epam.deltix.tbwg.webapp.services.timebase.export.imp.QmsgImportSettings;
import com.epam.deltix.tbwg.webapp.websockets.subscription.Subscription;
import com.epam.deltix.tbwg.webapp.websockets.subscription.SubscriptionChannel;
import com.epam.deltix.tbwg.webapp.websockets.subscription.SubscriptionController;
import com.epam.deltix.tbwg.webapp.websockets.subscription.SubscriptionControllerRegistry;
import com.epam.deltix.util.time.Interval;
import com.epam.deltix.util.time.Periodicity;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import javax.validation.Valid;
import java.io.IOException;

/**
 * Default controller for REST API
 */
@RestController
@RequestMapping("/api/v0")
public class ImportQsmsgController implements SubscriptionController {

    private final ImportService importService;

    @Autowired
    public ImportQsmsgController(SubscriptionControllerRegistry registry, ImportService importService) {
        registry.register(WebSocketConfig.IMPORT_QSMSG_TOPIC, this);
        this.importService = importService;
    }

    @PreAuthorize("hasAuthority('TB_ALLOW_WRITE')")
    @RequestMapping(value = "/initImport", method = {RequestMethod.POST})
    public long initImport(@Valid @RequestBody ImportRequest importRequest) {
        return importService.initImport(
                importRequest.fileName, importRequest.fileSize,
                new QmsgImportSettings(
                        importRequest.stream, importRequest.description,
                        importRequest.symbols, null,
                        importRequest.from != null ? importRequest.from.toEpochMilli() : Long.MIN_VALUE,
                        importRequest.to != null ? importRequest.to.toEpochMilli() : Long.MAX_VALUE,
                        getPeriodicity(importRequest.periodicity),
                        importRequest.fileBySymbol,
                        importRequest.writeMode
                )
        );
    }

    private Periodicity getPeriodicity(PeriodicityRequest periodicityRequest) {
        Periodicity periodicity = Periodicity.mkIrregular();
        if (periodicityRequest != null) {
            if (periodicityRequest.type == Periodicity.Type.STATIC) {
                periodicity = Periodicity.mkStatic();
            } else if (periodicityRequest.type == Periodicity.Type.REGULAR) {
                periodicity = Periodicity.mkRegular(
                        Interval.create(periodicityRequest.value, periodicityRequest.unit)
                );
            }
        }

        return periodicity;
    }

    @PreAuthorize("hasAuthority('TB_ALLOW_WRITE')")
    @RequestMapping(value = "/importChunk/{id}", method = {RequestMethod.POST})
    public void importMessages(@PathVariable long id,
                               @RequestParam MultipartFile file,
                               @RequestParam long offset) throws IOException {
        importService.uploadChunk(id, file.getInputStream(), offset, file.getSize());
    }

    @PreAuthorize("hasAuthority('TB_ALLOW_WRITE')")
    @RequestMapping(value = "/cancelImport/{id}", method = {RequestMethod.POST})
    public void importCancel(@PathVariable long id) {
        importService.cancelImport(id);
    }

    @Override
    public Subscription onSubscribe(SimpMessageHeaderAccessor header, SubscriptionChannel channel) {
        String destination = header.getDestination();
        if (destination == null){
            throw new RuntimeException(
                    String.format("Can't find destination on subscribe with sessionId = %s and subscriptionId = %s",
                            header.getSessionId(), header.getSubscriptionId()));
        }
        long id = extractId(destination);
        importService.startImport(id, channel);
        return () -> importService.cancelImport(id);
    }

    private long extractId(String destination) {
        String controlString = WebSocketConfig.IMPORT_QSMSG_TOPIC + "/";
        String url = destination.substring(0, destination.indexOf('?'));
        int id = url.indexOf(controlString);
        if (id < 0) {
            throw new RuntimeException("Can't extract import id from destination: " + url);
        }
        try {
            String strId = url.substring(id + controlString.length());
            return Long.parseLong(strId);
        } catch (NumberFormatException e) {
            throw new RuntimeException("Can't extract import id from destination: " + url);
        }
    }
}
