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

import com.epam.deltix.gflog.api.Log;
import com.epam.deltix.gflog.api.LogFactory;
import com.epam.deltix.tbwg.webapp.services.timebase.TimebaseService;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@Service
public class ImportServiceImpl implements ImportService {

    private static final Log LOGGER = LogFactory.getLog(ImportServiceImpl.class);

    private final TimebaseService timebaseService;
    private final UploadFileService uploadFileService;
    private final SimpMessagingTemplate messagingTemplate;

    private ExecutorService executorService = Executors.newCachedThreadPool();

    public ImportServiceImpl(TimebaseService timebaseService,
                             UploadFileService uploadFileService,
                             SimpMessagingTemplate messagingTemplate)
    {
        this.timebaseService = timebaseService;
        this.uploadFileService = uploadFileService;
        this.messagingTemplate = messagingTemplate;
    }

    @Override
    public long startImport(String fileName, long fileSize, ImportSettings settings) {
        ImportFile uploadProcess = uploadFileService.newUploadProcess(fileName, fileSize, settings);
        return uploadProcess.id();
    }

    @Override
    public void uploadChunk(long id, InputStream is, long offset, long size) {
        ImportFile importFile = uploadFileService.uploadProcess(id);
        if (importFile == null) {
            if (uploadFileService.isFreedUpload(id)) {
                LOGGER.info("Stop loading process because of cancel, id: " + id);
                return;
            }
            throw new RuntimeException("Unknown upload process id: " + id);
        }

        try {
            LOGGER.info().append("Start chunk loading of import file ").append(importFile.fileName())
                .append("; chunk size: ").append(size)
                .append("; offset: ").append(offset)
                .append("; file size: ").append(importFile.fileSize()).commit();
            importFile.write(is, offset, size);
            LOGGER.info().append("Finished chunk loading of import file ").append(importFile.fileName())
                .append("; chunk size: ").append(size)
                .append("; offset: ").append(offset)
                .append("; file size: ").append(importFile.fileSize()).commit();
        } catch (Throwable t) {
            uploadFileService.freeUpload(id);
            throw t;
        }

        if (offset + size >= importFile.fileSize()) {
            executorService.submit(() -> {
                try {
                    ImportFileTask task = new ImportFileTask(timebaseService, messagingTemplate, importFile);
                    importFile.importTask(task);
                    task.runImport();
                } finally {
                    uploadFileService.freeUpload(id);
                }
            });
        }
    }

    @Override
    public void cancelImport(long id) {
        uploadFileService.freeUpload(id);
    }

}
