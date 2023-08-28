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

import com.epam.deltix.gflog.api.Log;
import com.epam.deltix.gflog.api.LogFactory;
import com.epam.deltix.tbwg.webapp.config.WebSocketConfig;
import com.epam.deltix.tbwg.webapp.services.timebase.csvimport.*;
import com.epam.deltix.tbwg.webapp.services.timebase.exc.*;
import com.epam.deltix.tbwg.webapp.utils.TextUtils;
import com.epam.deltix.tbwg.webapp.websockets.subscription.Subscription;
import com.epam.deltix.tbwg.webapp.websockets.subscription.SubscriptionChannel;
import com.epam.deltix.tbwg.webapp.websockets.subscription.SubscriptionController;
import com.epam.deltix.tbwg.webapp.websockets.subscription.SubscriptionControllerRegistry;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

import java.io.*;
import java.util.*;

/**
 * Default controller for REST API
 */
@RestController
@RequestMapping("/api/v0/import")
public class ImportCsvController implements SubscriptionController {

    private static final Log LOGGER = LogFactory.getLog(ImportCsvController.class);

    private final CsvImportService importService;

    @Autowired
    public ImportCsvController(SubscriptionControllerRegistry registry, CsvImportService importService) {
        registry.register(WebSocketConfig.IMPORT_CSV_TOPIC, this);
        this.importService = importService;
    }

    @PreAuthorize("hasAuthority('TB_ALLOW_WRITE')")
    @PostMapping(value = "/csv/init")
    public ResponseEntity<?> initImport(@RequestParam String streamKey) throws UnknownStreamException {
        if (TextUtils.isEmpty(streamKey))
            throw new UnknownStreamException(streamKey);
        String id = importService.initImport();
        LOGGER.info().append("CSV Import initialization for stream ").append(streamKey)
                .append(". Import Id: ").append(id).commit();
        return new ResponseEntity<>(Collections.singletonList(id), HttpStatus.CREATED);
    }

    @PreAuthorize("hasAuthority('TB_ALLOW_WRITE')")
    @PostMapping(value = "/csv/preview/{id}")
    public ResponseEntity<?> addPreview(@PathVariable String id, @RequestParam MultipartFile file, boolean fullFile) {
        importService.checkId(id);
        importService.addPreview(id, file, fullFile);
        return new ResponseEntity<>(HttpStatus.CREATED);
    }

    @PreAuthorize("hasAuthority('TB_ALLOW_WRITE')")
    @DeleteMapping(value = "/csv/preview/{id}")
    public ResponseEntity<?> removePreview(@PathVariable String id, @RequestParam List<String> filesName) {
        importService.checkId(id);
        importService.removePreviews(id, filesName);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }

    @PreAuthorize("hasAuthority('TB_ALLOW_WRITE')")
    @GetMapping(value = "/csv/setting/{id}")
    public ResponseEntity<CsvImportSettings> getSetting(@PathVariable String id, @RequestParam String streamKey) {
        importService.checkId(id);
        return ResponseEntity.ok(importService.generateDefaultSettings(id, streamKey));
    }

    @PreAuthorize("hasAuthority('TB_ALLOW_WRITE')")
    @PostMapping(value = "/csv/mapping/{id}")
    public ResponseEntity<?> getMapping(@PathVariable String id, @RequestBody CsvImportGeneralSettings settings) {
        importService.checkId(id);
        return ResponseEntity.ok(importService.getMappings(id, settings));
    }

    @PreAuthorize("hasAuthority('TB_ALLOW_WRITE')")
    @GetMapping(value = "/csv/headers/{id}")
    public ResponseEntity<?> getHeaders(@PathVariable String id, @RequestParam char separator, @RequestParam String charset) {
        importService.checkId(id);
        return ResponseEntity.ok(importService.getHeadersSet(id, separator, charset));
    }

    @PreAuthorize("hasAuthority('TB_ALLOW_WRITE')")
    @PostMapping(value = "/csv/getPreview/{id}")
    public ResponseEntity<?> getPreview(@PathVariable String id, @RequestParam String fileName,
                                        @RequestBody CsvImportSettings settings) {
        importService.checkId(id);
        ImportValidatorCsv.settingsValidate(settings);
        List<String[]> preview = importService.getPreviewFileData(id, fileName, settings);
        return ResponseEntity.ok(preview);
    }

    @PreAuthorize("hasAuthority('TB_ALLOW_WRITE')")
    @PostMapping(value = "/csv/validate/mapping/{id}")
    public ResponseEntity<?> validateMapping(@PathVariable String id, @RequestBody CsvImportSettings settings) {
        importService.checkId(id);
        ImportValidatorCsv.settingsValidate(settings);
        return ResponseEntity.ok(importService.validateMapping(settings, id));
    }

    @PreAuthorize("hasAuthority('TB_ALLOW_WRITE')")
    @PostMapping(value = "/csv/validate/{id}")
    public ResponseEntity<?> validate(@PathVariable String id, @RequestParam(required = false) String fileName,
                                      @RequestBody CsvImportSettings settings) {
        importService.checkId(id);
        ImportValidatorCsv.settingsValidate(settings);
        if (fileName == null) {
            return ResponseEntity.ok(importService.validate(settings, id));
        }
        return ResponseEntity.ok(importService.validate(settings, id, fileName));
    }

    @PreAuthorize("hasAuthority('TB_ALLOW_WRITE')")
    @RequestMapping(value = "/csv/requestProcess/{id}", method = {RequestMethod.POST})
    public ResponseEntity<Long> requestProcess(@RequestParam long totalSize, @PathVariable String id,
                                               @RequestBody CsvImportSettings settings) {
        importService.checkId(id);
        ImportValidatorCsv.settingsValidate(settings);
        long processId = importService.reserveUploadProcess(id, totalSize);
        importService.saveSettings(id, settings);
        LOGGER.info().append("CSV import request created. Reserved ").append(totalSize).append(" bytes.").commit();
        return ResponseEntity.ok(processId);
    }

    @PreAuthorize("hasAuthority('TB_ALLOW_WRITE')")
    @PostMapping(value = "/csv/uploadChunk/{id}")
    public ResponseEntity<?> uploadChunk(@PathVariable String id, @RequestParam MultipartFile file,
                                         @RequestParam long fullFileSize) throws IOException {
        long processId = importService.getProcessId(id);
        long offset = importService.uploadChunk(processId, file.getInputStream(), file.getOriginalFilename());
        LOGGER.info().append("Uploaded chunk for import file ").append(file.getOriginalFilename())
                .append("; chunk size: ").append(file.getSize())
                .append("; offset: ").append(offset)
                .append("; file size: ").append(fullFileSize).commit();
        return new ResponseEntity<>(HttpStatus.OK);
    }

    @PreAuthorize("hasAuthority('TB_ALLOW_WRITE')")
    @PostMapping(value = "/cancel/{id}")
    public void importCancel(@PathVariable String id) {
        importService.cancelImport(id);
    }

    @PreAuthorize("hasAuthority('TB_ALLOW_WRITE')")
    @PostMapping(value = "/finish/{id}")
    public void importFinish(@PathVariable String id) {
        importService.finishImport(id);
    }

    @Override
    public Subscription onSubscribe(SimpMessageHeaderAccessor header, SubscriptionChannel channel) {
        String destination = header.getDestination();
        if (destination == null) {
            throw new RuntimeException(
                    String.format("Can't find destination on subscribe with sessionId = %s and subscriptionId = %s",
                            header.getSessionId(), header.getSubscriptionId()));
        }
        String id = extractId(destination);
        long processId = importService.getProcessId(id);
        CsvImportSettings settings = importService.getSettings(id);
        importService.startImport(processId, settings, channel);
        return () -> {
        };
    }

    private String extractId(String destination) {
        String controlString = WebSocketConfig.IMPORT_CSV_TOPIC + "/";
        String url = destination.substring(0, destination.indexOf('?'));
        int id = url.indexOf(controlString);
        if (id < 0) {
            throw new RuntimeException("Can't extract import id from destination: " + url);
        }
        return url.substring(id + controlString.length());
    }

    @PreAuthorize("hasAnyAuthority('TB_ALLOW_READ', 'TB_ALLOW_WRITE')")
    @GetMapping(value = "/csv/log/{id}", produces = MediaType.APPLICATION_OCTET_STREAM_VALUE)
    public ResponseEntity<StreamingResponseBody> getLogFile(@PathVariable String id) {
        return ResponseEntity.ok().contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(importService.getImportLog(id));
    }

}
