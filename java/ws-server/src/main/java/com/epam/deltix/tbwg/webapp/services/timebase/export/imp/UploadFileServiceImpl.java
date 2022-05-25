/*
 * Copyright 2021 EPAM Systems, Inc
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
package com.epam.deltix.tbwg.webapp.services.timebase.export.imp;

import com.epam.deltix.tbwg.webapp.services.timebase.export.ExportService;
import com.epam.deltix.gflog.api.Log;
import com.epam.deltix.gflog.api.LogFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;
import javax.annotation.PreDestroy;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Collectors;

@Service
public class UploadFileServiceImpl implements UploadFileService {

    private static final Log LOGGER = LogFactory.getLog(UploadFileServiceImpl.class);

    private final static String UPLOAD_FILE_POSTFIX = ExportService.MSG_FORMAT + ".upload";

    private final static AtomicLong ID_GENERATOR = new AtomicLong(System.currentTimeMillis());

    private final Map<Long, ImportFile> uploads = new HashMap<>();

    @Value("${import.directory:#{null}}")
    private File directory;

    @Value("${import.directorySizeMb:1024}")
    private long size;

    @Value("${import.max-uploads:10}")
    private int maxUploads;

    @Value("${import.stale-import-timeout-ms:65000}")
    private int staleImportTimeMs;

    private long freeSize;

    @PostConstruct
    public void init() throws IOException {
        if (directory == null) {
            directory = Files.createTempDirectory("webadmin").toFile();
        }
        freeSize = 1024 * 1024 * size;
        cleanDirectory();
    }

    @PreDestroy
    public void deinit() {
        closeAllUploads();
        cleanDirectory();
    }

    @Scheduled(fixedDelay = 30000)
    public void reload() {
        invalidateStaleImports();
    }

    @Override
    public ImportFile newUploadProcess(String fileName, long size, ImportSettings settings) {
        long id = ID_GENERATOR.incrementAndGet();
        try {
            ImportFile importFile = createUploadFileProcess(id, fileName, size, settings);
            addUploadProcess(id, importFile);
            return importFile;
        } catch (Throwable t) {
            freeUpload(id);
            throw t;
        }
    }

    @Override
    public ImportFile uploadProcess(long id) {
        return getUploadProcess(id);
    }

    @Override
    public void freeUpload(long id) {
        removeUploadProcess(id);
    }

    @Override
    public synchronized boolean isFreedUpload(long id) {
        return !uploads.containsKey(id);
    }

    private ImportFile createUploadFileProcess(long id, String fileName, long size, ImportSettings settings) {
        return new DiskImportFile(directory, id + UPLOAD_FILE_POSTFIX, id, fileName, size, settings);
    }

    private synchronized void addUploadProcess(long id, ImportFile importFile) {
        if (uploads.size() >= maxUploads) {
            LOGGER.error().append("Number of import requests over the limit ").append(maxUploads).append(".")
                .append(maxUploads).append(" IMPORT processes are currently running.")
                .commit();
            throw new RuntimeException("Max number of imports exceeded (" + maxUploads + ")");
        }

        commitDiskSize(importFile.fileSize());
        uploads.put(id, importFile);
    }

    private synchronized void invalidateStaleImports() {
        long currentTime = System.currentTimeMillis();
        uploads.values().stream()
            .filter(i -> currentTime - i.changeTime() > staleImportTimeMs)
            .map(ImportFile::id).collect(Collectors.toList())
            .forEach(this::removeUploadProcess);
    }

    private synchronized ImportFile getUploadProcess(long id) {
        return uploads.get(id);
    }

    private synchronized void removeUploadProcess(long id) {
        ImportFile importFile = uploads.remove(id);
        if (importFile != null) {
            releaseDiskSize(importFile.fileSize());
            importFile.close();
        }
    }

    private synchronized void closeAllUploads() {
        List<Long> ids = new ArrayList<>(uploads.keySet());
        ids.forEach(id -> {
            try {
                removeUploadProcess(id);
            } catch (Throwable t) {
                LOGGER.error().append("Failed to close upload with id ").append(id).append(t).commit();
            }
        });
    }

    private void commitDiskSize(long size) {
        if (freeSize - size < 0) {
            throw new RuntimeException("Not enough disk size for the file");
        }

        freeSize -= size;
    }

    private void releaseDiskSize(long size) {
        freeSize += size;
    }

    private void cleanDirectory() {
        File[] files = directory.listFiles((dir, name) -> name.toLowerCase().endsWith(UPLOAD_FILE_POSTFIX));
        if (files != null) {
            for (File file : files) {
                file.delete();
            }
        }
    }

}
