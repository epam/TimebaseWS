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

package com.epam.deltix.tbwg.webapp.services.timebase.export.imp;

import com.epam.deltix.gflog.api.Log;
import com.epam.deltix.gflog.api.LogFactory;
import com.epam.deltix.tbwg.webapp.services.timebase.export.ExportService;
import com.epam.deltix.tbwg.webapp.services.timebase.csvimport.DirectoryImportProcessImpl;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;
import javax.annotation.PreDestroy;
import java.io.*;
import java.nio.file.Files;
import java.text.DecimalFormat;
import java.util.*;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Collectors;

@Service
public class UploadFileServiceImpl implements UploadFileService {

    private static final Log LOGGER = LogFactory.getLog(UploadFileServiceImpl.class);

    private final static String UPLOAD_FILE_POSTFIX = ExportService.MSG_FORMAT + ".upload";

    private final static AtomicLong ID_GENERATOR = new AtomicLong(System.currentTimeMillis());

    private final Map<Long, ImportProcess> uploads = new HashMap<>();
    private final Map<Long, File> importLogs = new HashMap<>();

    @Value("${import.directory:#{null}}")
    private File directory;

    @Value("${import.directorySizeMb:1024}")
    private long size;

    @Value("${import.max-uploads:10}")
    private int maxUploads;

    @Value("${import.stale-import-timeout-ms:65000}")
    private int staleImportTimeMs;

    @Value("${import.log-file-size:1048576}") // Default value 1Mb
    private long logFileSize;
    private long totalSize;
    private long freeSize;

    @PostConstruct
    public void init() throws IOException {
        if (directory == null) {
            directory = Files.createTempDirectory("webadmin").toFile();
        }
        freeSize = totalSize = 1024 * 1024 * size;
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
    public ImportProcess newFileUploadProcess(String fileName, long size, ImportSettings settings) {
        long id = ID_GENERATOR.incrementAndGet();
        try {
            ImportProcess importProcess = createUploadFileProcess(id, fileName, size, settings);
            addUploadProcess(id, importProcess);
            return importProcess;
        } catch (Throwable t) {
            freeUpload(id);
            throw t;
        }
    }

    @Override
    public ImportProcess newDirectoryUploadProcess(long size) {
        long id = ID_GENERATOR.incrementAndGet();
        try {
            ImportProcess importProcess = createUploadDirectoryProcess(id, size);
            addUploadProcess(id, importProcess);
            return importProcess;
        } catch (Throwable t) {
            freeUpload(id);
            throw t;
        }
    }

    @Override
    public ImportProcess uploadProcess(long id) {
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

    private  ImportProcess createUploadFileProcess(long id, String fileName, long size, ImportSettings settings) {
        return new FileImportProcessImpl(directory, id + UPLOAD_FILE_POSTFIX, id, fileName, size, settings);
    }
    private ImportProcess createUploadDirectoryProcess(long id, long size) {
        return new DirectoryImportProcessImpl(directory, id + UPLOAD_FILE_POSTFIX, id, size);
    }
    private synchronized void addUploadProcess(long id, ImportProcess importProcess) {
        if (uploads.size() >= maxUploads) {
            LOGGER.error().append("Number of import requests over the limit ").append(maxUploads).append(".")
                .append(maxUploads).append(" IMPORT processes are currently running.")
                .commit();
            throw new RuntimeException("Max number of imports exceeded (" + maxUploads + ")");
        }

        commitDiskSize(importProcess.getSize());
        uploads.put(id, importProcess);
    }

    private synchronized void invalidateStaleImports() {
        long currentTime = System.currentTimeMillis();
        uploads.values().stream()
            .filter(i -> currentTime - i.changeTime() > staleImportTimeMs)
            .map(ImportProcess::id).collect(Collectors.toList())
            .forEach(this::removeUploadProcess);
    }

    private synchronized ImportProcess getUploadProcess(long id) {
        return uploads.get(id);
    }

    private synchronized void removeUploadProcess(long id) {
        ImportProcess importProcess = uploads.remove(id);
        if (importProcess != null) {
            releaseDiskSize(importProcess.getSize());
            importProcess.close();
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
            throw new RuntimeException("Not enough disk size for the file. " +
                "File size: " + formatSize(size) + "; Free disk size: " + formatSize(freeSize) + " of " + formatSize(totalSize)
            );
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

    private static String formatSize(long size) {
        double b = size;
        double k = size / 1024.0;
        double m = ((size / 1024.0) / 1024.0);
        double g = (((size / 1024.0) / 1024.0) / 1024.0);
        double t = ((((size / 1024.0) / 1024.0) / 1024.0) / 1024.0);

        DecimalFormat dec = new DecimalFormat("0.00");

        if (t > 1) {
            return dec.format(t).concat(" TB");
        } else if (g > 1) {
            return dec.format(g).concat(" GB");
        } else if (m > 1) {
            return dec.format(m).concat(" MB");
        } else if (k > 1) {
            return dec.format(k).concat(" KB");
        } else {
            return dec.format(b).concat(" Bytes");
        }
    }

    @Override
    public File createLogFile(long id) {
        commitDiskSize(logFileSize);
        String fileName = String.format("%tF import %s.log", new Date(), id);
        File file = new File(directory, fileName);
        importLogs.put(id, file);
        return file;
    }

    @Override
    public void deleteLogFile(Long id) {
        File file = importLogs.get(id);
        if (file != null) {
            file.delete();
        }
        releaseDiskSize(logFileSize);
    }

    @Override
    public File getLogFile(long id) {
        return importLogs.get(id);
    }

}
