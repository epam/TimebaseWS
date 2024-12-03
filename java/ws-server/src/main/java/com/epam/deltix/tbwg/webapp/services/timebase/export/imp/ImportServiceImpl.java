/*
 * Copyright 2024 EPAM Systems, Inc
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
import com.epam.deltix.qsrv.hf.pub.md.RecordClassDescriptor;
import com.epam.deltix.qsrv.hf.pub.md.RecordClassSet;
import com.epam.deltix.qsrv.hf.pub.md.json.SchemaBuilder;
import com.epam.deltix.qsrv.hf.pub.md.json.SchemaDef;
import com.epam.deltix.qsrv.hf.stream.MessageReader2;
import com.epam.deltix.qsrv.hf.tickdb.pub.DXTickStream;
import com.epam.deltix.tbwg.webapp.services.timebase.TimebaseService;
import com.epam.deltix.tbwg.webapp.services.timebase.csvimport.ImportProcessReport;
import com.epam.deltix.tbwg.webapp.services.timebase.csvimport.ImportStatus;
import com.epam.deltix.tbwg.webapp.services.view.utils.Utils;
import com.epam.deltix.tbwg.webapp.websockets.subscription.SubscriptionChannel;
import com.epam.deltix.util.time.TimeKeeper;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

import static com.epam.deltix.tbwg.webapp.services.timebase.csvimport.CsvImportServiceImpl.IMPORT_FINISH_DELAY;

@Service
@Primary
public class ImportServiceImpl implements ImportService {

    private static final Log LOGGER = LogFactory.getLog(ImportServiceImpl.class);

    private final TimebaseService timebaseService;
    private final UploadFileService uploadFileService;
    private final ExecutorService executorService = Executors.newCachedThreadPool();

    private final ImportStatusService statusService;
    public ImportServiceImpl(TimebaseService timebaseService, UploadFileService uploadFileService, ImportStatusService statusService) {
        this.timebaseService = timebaseService;
        this.uploadFileService = uploadFileService;
        this.statusService = statusService;
    }

    @Override
    public long initImport(String fileName, long fileSize, QmsgImportSettings settings) {
        ImportProcess uploadProcess = uploadFileService.newFileUploadProcess(fileName, fileSize, settings);
        return uploadProcess.id();
    }

    @Override
    public void uploadChunk(long id, InputStream is, long offset, long size) {
        ImportProcess importProcess = uploadFileService.uploadProcess(id);

        if (importProcess == null) {
            if (uploadFileService.isFreedUpload(id)) {
                LOGGER.info("Stop loading process because of cancel, id: " + id);
                return;
            }
            throw new RuntimeException("Unknown upload process id: " + id);
        }
        FileImportProcess fileImportProcess = getFileImportProcess(importProcess);
        try {
            LOGGER.info().append("Start chunk loading of import file ").append(fileImportProcess.fileName())
                    .append("; chunk size: ").append(size)
                    .append("; offset: ").append(offset)
                    .append("; file size: ").append(fileImportProcess.getSize()).commit();
            fileImportProcess.write(is, offset, size);
            LOGGER.info().append("Finished chunk loading of import file ").append(fileImportProcess.fileName())
                    .append("; chunk size: ").append(size)
                    .append("; offset: ").append(offset)
                    .append("; file size: ").append(fileImportProcess.getSize()).commit();
        } catch (Throwable t) {
            uploadFileService.freeUpload(id);
            throw t;
        }
    }

    private FileImportProcess getFileImportProcess(ImportProcess importProcess) {
        if (!(importProcess instanceof FileImportProcess)) {
            throw new RuntimeException("Unexpected upload process type: id=" + importProcess.id());
        }
        return (FileImportProcess) importProcess;
    }

    @Override
    public SchemaDef getSchema(long id) {
        RecordClassDescriptor[] types = getTypesByImportProcessId(id);
        return SchemaBuilder.toSchemaDef(new RecordClassSet(types), false);
    }

    @Override
    public boolean isValidImportSchema(long id, String streamKey) {
        DXTickStream stream = timebaseService.getStream(streamKey);
        if (stream == null) {
            return true;
        }
        RecordClassDescriptor[] types = getTypesByImportProcessId(id);
        return Utils.isSchemaValid(stream, types);
    }

    private RecordClassDescriptor[] getTypesByImportProcessId(long id) {
        ImportProcess importProcess = uploadFileService.uploadProcess(id);
        if (importProcess == null) {
            LOGGER.error().append("Import process with id ").append(id).append(" not found").commit();
            throw new IllegalArgumentException("Unknown import process");
        }
        int i = 0;
        while (!importProcess.ready()) {
            if (i == 5) {
                LOGGER.error().append("Import process with id ").append(id).append(" not ready to use").commit();
                throw new IllegalArgumentException("Files for process \"" + id + "\" not loaded");
            }
            i++;
            TimeKeeper.parkNanos(1_000_000_000);
        }

        FileImportProcess fileImportProcess = getFileImportProcess(importProcess);
        try (InputStream is = fileImportProcess.read()) {
            String fileName = fileImportProcess.fileName();
            if (fileName.endsWith(".zip")) {
                return getTypes(new ZipInputStream(is));
            } else {
                return getTypes(is, fileImportProcess.getSize(), fileName.endsWith(".gz"));
            }
        } catch (Throwable e) {
            LOGGER.error().append("Failed to get schema from import file ").append(fileImportProcess.fileName()).append(e).commit();
            throw new RuntimeException(e);
        }
    }

    private RecordClassDescriptor[] getTypes(InputStream is, long fileSize, boolean unzip) throws IOException {
        MessageReader2 messageReader2 = new MessageReader2(is, fileSize, unzip, 1 << 20, null);
        return messageReader2.getTypes();
    }

    private RecordClassDescriptor[] getTypes(ZipInputStream zis) throws IOException {
        ZipEntry zipEntry = zis.getNextEntry();
        if (zipEntry == null) {
            throw new RuntimeException("Zip entry not found");
        }
        MessageReader2 messageReader2 = new MessageReader2(zis, zipEntry.getSize(), true, 1 << 20, null);
        return messageReader2.getTypes();
    }


    @Override
    public void startImport(long id, SubscriptionChannel channel) {
        ImportProcess importProcess = uploadFileService.uploadProcess(id);
        if (importProcess == null) {
            ImportProcessReport importProcessReport = new ImportProcessReport(channel, id);
            importProcessReport.sendProgress(1);
            importProcessReport.sendImportReport(statusService.getStatus(id));
            importProcessReport.sendState(ImportState.FINISHED);
            return;
        }
        if (importProcess.isRunningTask()){
            ImportProcessReport importProcessReport = new ImportProcessReport(channel, id);
            importProcessReport.sendImportReport(statusService.getStatus(id));
            importProcess.updateTaskChannel(channel);
            return;
        }
        if (!(importProcess instanceof FileImportProcess)) {
            throw new IllegalArgumentException("Unexpected upload process type: id=" + id);
        }
        FileImportProcess fileImportProcess = (FileImportProcess) importProcess;
        ImportStatus status = statusService.newImportStatus(id);
        executorService.submit(() -> {
            try {
                ImportFileTask task = new ImportFileTask(timebaseService, channel, fileImportProcess, status);
                fileImportProcess.importTask(task);
                while (!importProcess.ready()) {
                    if (task.isCancelled()) {
                        LOGGER.info("Stop import process because of cancel, id: " + id);
                        return;
                    }
                    Thread.sleep(1000);
                }
                task.runImport();
            } catch (InterruptedException e) {
                LOGGER.error("Import process failed while waiting for files to be uploaded, id: " + id);
            } finally {
                uploadFileService.freeUpload(id);
            }
        });

    }

    @Override
    public void setActiveImport(long id) {
        ImportProcess importProcess = uploadFileService.uploadProcess(id);
        if (importProcess != null) {
            importProcess.setActive(true);
        }
    }

    @Override
    public void inactiveImport(long id) {
        finishIfNotActiveWithDelay(id);
    }

    private void finishIfNotActiveWithDelay(long id) {
        ImportProcess importProcess = uploadFileService.uploadProcess(id);
        if (importProcess != null) {
            importProcess.setActive(false);
            new Thread(() -> {
                try {
                    Thread.sleep(IMPORT_FINISH_DELAY);
                } catch (InterruptedException e) {
                    throw new RuntimeException(e);
                }
                if (!importProcess.isActive()) {
                    cancelImport(id);
                }
            }).start();
        }
    }


    @Override
    public void cancelImport(long id) {
        uploadFileService.freeUpload(id);
    }

}