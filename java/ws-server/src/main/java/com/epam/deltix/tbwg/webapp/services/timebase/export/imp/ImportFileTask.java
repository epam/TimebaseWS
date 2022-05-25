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
import com.epam.deltix.timebase.messages.InstrumentMessage;
import com.google.common.collect.EvictingQueue;
import com.epam.deltix.gflog.api.Log;
import com.epam.deltix.gflog.api.LogFactory;
import com.epam.deltix.qsrv.hf.pub.*;
import com.epam.deltix.qsrv.hf.pub.md.RecordClassDescriptor;
import com.epam.deltix.qsrv.hf.pub.md.RecordClassSet;
import com.epam.deltix.qsrv.hf.stream.MessageReader2;
import com.epam.deltix.qsrv.hf.tickdb.pub.*;
import com.epam.deltix.qsrv.hf.tickdb.schema.*;
import com.epam.deltix.tbwg.webapp.config.WebSocketConfig;
import com.epam.deltix.tbwg.webapp.services.timebase.TimebaseService;
import com.epam.deltix.util.collections.CharSequenceSet;
import com.epam.deltix.util.text.SimpleStringCodec;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.io.IOException;
import java.io.InputStream;
import java.util.*;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

public class ImportFileTask {

    private static final Log LOGGER = LogFactory.getLog(ImportServiceImpl.class);

    private final TimebaseService timebaseService;
    private final SimpMessagingTemplate messagingTemplate;
    private final ImportFile importFile;

    private final EvictingQueue<String> warnings = EvictingQueue.create(50);

    private long totalImportedBytes;

    private volatile boolean cancelled;
    private final CharSequenceSet symbols;

    public ImportFileTask(TimebaseService timebaseService,
                          SimpMessagingTemplate messagingTemplate,
                          ImportFile importFile)
    {
        this.timebaseService = timebaseService;
        this.messagingTemplate = messagingTemplate;
        this.importFile = importFile;
        if (importFile.importSettings().getSymbols() != null) {
            this.symbols = new CharSequenceSet();
            symbols.addAll(Arrays.asList(importFile.importSettings().getSymbols()));
        } else {
            symbols = null;
        }
    }

    public void cancel() {
        cancelled = true;
    }

    public void runImport() {
        if (cancelled) {
            LOGGER.info().append("Import task was cancelled").commit();
            sendInfo("Import task was cancelled");
            return;
        }

        sendState(ImportState.STARTED);
        try (InputStream is = importFile.read()) {
            String fileName = importFile.fileName();
            long fileSize = importFile.fileSize();
            ImportSettings settings = importFile.importSettings();

            MessageReader2 reader;
            RecordClassDescriptor[] types;
            ZipInputStream zis = null;
            ZipEntry zipEntry = null;
            if (fileName.endsWith(".zip")) {
                zis = new ZipInputStream(is);
                zipEntry = zis.getNextEntry();
                reader = new MessageReader2(
                    zis, zipEntry.getSize(), true, 1 << 20, null
                );
            } else {
                reader = new MessageReader2(
                    is, fileSize, fileName.endsWith(".gz"), 1 << 20, null
                );
            }
            types = reader.getTypes();

            DXTickStream stream = getOrCreateStream(settings, types);
            SchemaConverter schemaConverter = checkSchema(stream, types);
            if (zis != null) {
                importStream(reader, zis, zipEntry, schemaConverter, stream);
            } else {
                importStream(importFile.fileName(), fileSize, reader, schemaConverter, stream, null);
            }
        } catch (Throwable e) {
            LOGGER.error().append("Failed to import file").append(e).commit();
            sendError(e.getMessage());
            sendState(ImportState.FINISHED);
        }
    }

    private void importStream(MessageReader2 reader, ZipInputStream zis, ZipEntry zipEntry,
                              SchemaConverter schemaConverter, DXTickStream stream) throws IOException
    {
        do {
            String file = importFile.fileName() + "/" + zipEntry.getName();
            String space = getSpaceFromName(zipEntry);
            importStream(file, zipEntry.getSize(), reader, schemaConverter, stream, space);
            totalImportedBytes += zipEntry.getSize();

            sendProgress((double) totalImportedBytes / (double) importFile.fileSize());

            zipEntry = zis.getNextEntry();
            if (zipEntry == null) {
                break;
            }
            reader = new MessageReader2(
                zis, zipEntry.getSize(), true, 1 << 20, null
            );
            try {
                schemaConverter = checkSchema(stream, reader.getTypes());
            } catch (IllegalStateException e) {
                String message = "Schema of entry " + zipEntry.getName() + " is incompatible with stream schema.";
                LOGGER.error().append(message).commit();
                sendWarning(message);
            }
        } while (!cancelled);
    }

    private void importStream(String fileName, long fileSize, MessageReader2 reader, SchemaConverter schemaConverter,
                              DXTickStream stream, String space)
    {
        String importTarget = stream.getKey() + (space != null ? ("[" + space + "]") : "");
        String importMessage = "Importing " + fileName + " into " + importTarget;
        LOGGER.info().append(importMessage).commit();
        sendInfo(importMessage);

        int importedMessages = 0;
        LoadingOptions options = new LoadingOptions();
        options.raw = true;
        options.channelQOS = ChannelQualityOfService.MIN_INIT_TIME;
        options.space = space;

        long lastSendProgressMs = 0;

        importFile.update();
        try (TickLoader loader = stream.createLoader(options)) {
            loader.addEventListener(this::newWarning);

            while (reader.next() && !cancelled) {
                InstrumentMessage msg = reader.getMessage();
                if (msg.getTimeStampMs() > importFile.importSettings().getEndTime()) {
                    break;
                }
                if (msg.getTimeStampMs() < importFile.importSettings().getStartTime()) {
                    continue;
                }

                if (symbols != null && !symbols.containsCharSequence(msg.getSymbol())) {
                    continue;
                }

                if (msg instanceof RawMessage) {
                    RawMessage converted = schemaConverter.convert((RawMessage) msg);
                    if (converted != null) {
                        loader.send(converted);
                        importedMessages++;

                        if (System.currentTimeMillis() - lastSendProgressMs > 500) {
                            sendProgress(getCurrentProgress(reader.getProgress(), fileSize));
                            sendWarnings();
                            lastSendProgressMs = System.currentTimeMillis();
                        }
                    }
                }

                if (importedMessages % 10000 == 0) {
                    importFile.update();
                }
            }
        }

        String successfulMessage = "Successfully imported " + fileName + " into " +
            importTarget + ". Imported messages: " + importedMessages;
        LOGGER.info().append(successfulMessage).commit();
        sendInfo(successfulMessage);
        sendState(ImportState.FINISHED);
    }

    private synchronized void newWarning(LoadingError e) {
        warnings.add(e.getMessage());
    }

    private synchronized void sendWarnings() {
        warnings.forEach(this::sendWarning);
        warnings.clear();
    }

    protected String getSpaceFromName(ZipEntry entry) {
        String name = entry.getName();
        int index = name.lastIndexOf(ExportService.MSG_FORMAT);
        if (index < 0) {
            return null;
        }

        return decodeName(name.substring(0, index));
    }

    protected String decodeName(String name) {
        return SimpleStringCodec.DEFAULT_INSTANCE.decode(name);
    }

    private SchemaConverter checkSchema(DXTickStream stream, RecordClassDescriptor[] types) {
        SchemaAnalyzer schemaAnalyzer = new SchemaAnalyzer(new SchemaMapping());
        RecordClassSet fileSchema = new RecordClassSet(types);
        RecordClassSet streamSchema = new RecordClassSet(stream.getTypes());
        StreamMetaDataChange change = schemaAnalyzer.getChanges(
            fileSchema, MetaDataChange.ContentType.Polymorphic,
            streamSchema, MetaDataChange.ContentType.Polymorphic
        );
        SchemaConverter schemaConverter = new SchemaConverter(change);
        if (change.getChangeImpact() != SchemaChange.Impact.None) {
            throw new IllegalStateException("Existing stream schema is incompatible with file schema.");
        }

        return schemaConverter;
    }

    private DXTickStream getOrCreateStream(ImportSettings settings, RecordClassDescriptor[] types) {
        DXTickDB db = timebaseService.getConnection();
        DXTickStream stream = db.getStream(settings.getStreamKey());
        if (stream == null) {
            StreamOptions options = new StreamOptions();
            options.description = settings.getDescription();
            options.setPolymorphic(types);
            options.name = settings.getStreamKey();
            options.periodicity = settings.getPeriodicity();
            stream = db.createStream(settings.getStreamKey(), options);
        }

        return stream;
    }

    private double getCurrentProgress(double currentProgress, long currentFileSize) {
        long currentBytesRead = (long) (currentProgress * (double) currentFileSize);
        return (double) (totalImportedBytes + currentBytesRead) / (double) importFile.fileSize();
    }

    private void sendInfo(String message) {
        sendEvent(message, ImportEventType.INFO);
    }

    private void sendWarning(String message) {
        sendEvent(message, ImportEventType.WARNING);
    }

    private void sendError(String message) {
        sendEvent(message, ImportEventType.ERROR);
    }

    private void sendProgress(double progress) {
        sendEvent(Double.toString(progress), ImportEventType.PROGRESS);
    }

    private void sendState(ImportState state) {
        sendEvent(state.toString(), ImportEventType.STATE);
    }

    private void sendEvent(String message, ImportEventType type) {
        messagingTemplate.convertAndSend(
            topic(), new ImportEvent(importFile.id(), message, type)
        );
    }

    private String topic() {
        return WebSocketConfig.IMPORT_FILE_TOPIC + "/" + importFile.id();
    }

}
