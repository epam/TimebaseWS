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
import com.epam.deltix.qsrv.hf.pub.*;
import com.epam.deltix.qsrv.hf.pub.md.RecordClassDescriptor;
import com.epam.deltix.qsrv.hf.pub.md.RecordClassSet;
import com.epam.deltix.qsrv.hf.stream.MessageReader2;
import com.epam.deltix.qsrv.hf.tickdb.pub.*;
import com.epam.deltix.qsrv.hf.tickdb.schema.*;
import com.epam.deltix.tbwg.webapp.services.timebase.TimebaseService;
import com.epam.deltix.tbwg.webapp.services.timebase.csvimport.ImportStatus;
import com.epam.deltix.tbwg.webapp.services.timebase.export.ExportService;
import com.epam.deltix.tbwg.webapp.services.timebase.csvimport.ImportProcessReport;
import com.epam.deltix.tbwg.webapp.services.view.utils.Utils;
import com.epam.deltix.tbwg.webapp.websockets.subscription.SubscriptionChannel;
import com.epam.deltix.timebase.messages.InstrumentMessage;
import com.epam.deltix.util.collections.CharSequenceSet;
import com.epam.deltix.util.text.SimpleStringCodec;

import java.io.IOException;
import java.io.InputStream;
import java.util.*;
import java.util.function.Function;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

public class ImportFileTask implements ImportTask {

    private static final Log LOGGER = LogFactory.getLog(ImportServiceImpl.class);

    private final TimebaseService timebaseService;
    private final FileImportProcess importProcess;
    private final ImportProcessReport report;
    private long totalImportedBytes;
    private volatile boolean cancelled;
    private final CharSequenceSet symbols;
    private final ImportStatus importStatus;

    public ImportFileTask(TimebaseService timebaseService,
                          SubscriptionChannel channel,
                          FileImportProcess importProcess, ImportStatus importStatus) {
        this.timebaseService = timebaseService;
        this.importProcess = importProcess;
        this.importStatus = importStatus;
        report = new ImportProcessReport(channel, importProcess.id());
        if (importProcess.importSettings().getSymbols() != null) {
            this.symbols = new CharSequenceSet();
            symbols.addAll(Arrays.asList(importProcess.importSettings().getSymbols()));
        } else {
            symbols = null;
        }
    }

    @Override
    public ImportState getImportState() {
        return importStatus.getState();
    }

    @Override
    public void cancel() {
        cancelled = true;
    }

    @Override
    public boolean isCancelled() {
        return cancelled;
    }

    @Override
    public void runImport() {
        if (cancelled) {
            LOGGER.info().append("Import task was cancelled").commit();
            report.sendInfo("Import task was cancelled");
            return;
        }
        report.sendState(ImportState.STARTED);
        updateStatus(Collections.emptyList(), Collections.emptyList(), Collections.emptyList(), ImportState.STARTED);
        try (InputStream is = importProcess.read()) {
            String fileName = importProcess.fileName();
            long fileSize = importProcess.getSize();
            ImportSettings settings = importProcess.importSettings();

            if (fileName.endsWith(".zip")) {
                importZip(settings, new ZipInputStream(is), settings.isFileBySymbol());
            } else {
                MessageReader2 reader = openReader(is, fileSize, fileName.endsWith(".gz"));
                importQsmsg(settings, importProcess.fileName(), fileSize, reader, null, null);
            }

            report.sendProgress(1.0d);
            updateStatus(Collections.singletonList("Import finished"), Collections.emptyList(), Collections.emptyList(), ImportState.FINISHED);
        } catch (Throwable e) {
            LOGGER.error().append("Failed to import file").append(e).commit();
            report.sendError(e.getMessage());
            updateStatus(Collections.emptyList(), Collections.emptyList(), Collections.singletonList(e.getMessage()), ImportState.FINISHED);
        } finally {
            report.sendState(ImportState.FINISHED);
        }
    }

    @Override
    public void updateChannel(SubscriptionChannel channel) {
        report.updateChannel(channel);
    }

    private MessageReader2 openReader(InputStream is, long fileSize, boolean unzip) {
        try {
            return new MessageReader2(is, fileSize, unzip, 1 << 20, null);
        } catch (Throwable t) {
            String message = "Unknown error during import. Possibly file is corrupted or has invalid format.";
            String error = t.getMessage() == null ? message : message + " Reason: " + t.getMessage();
            throw new RuntimeException(error, t);
        }
    }

    private void importZip(ImportSettings settings, ZipInputStream zis, boolean fileBySymbol) throws IOException {
        do {
            ZipEntry zipEntry = zis.getNextEntry();
            if (zipEntry == null) {
                break;
            }
            MessageReader2 reader = openReader(zis, zipEntry.getSize(), true);

            String file = importProcess.fileName() + "/" + zipEntry.getName();
            String entryName = getEntryName(zipEntry);
            if (fileBySymbol) {
                importQsmsg(settings, file, zipEntry.getSize(), reader, null, entryName);
            } else {
                importQsmsg(settings, file, zipEntry.getSize(), reader, entryName, null);
            }
            totalImportedBytes += zipEntry.getCompressedSize();

            report.sendProgress((double) totalImportedBytes / (double) importProcess.getSize());
        } while (!cancelled);
    }

    private void importQsmsg(ImportSettings settings, String fileName, long fileSize, MessageReader2 reader,
                             String space, String symbol) {
        DXTickStream stream = getOrCreateStream(timebaseService, settings, reader.getTypes());

        if (symbol != null && symbols != null && !symbols.containsCharSequence(symbol)) {
            return;
        }

        if (!isSchemaValid(stream, reader.getTypes())) {
            String message = "Schema of " + fileName + " is incompatible with stream schema.";
            LOGGER.error().append(message).commit();
            report.sendWarning(message);
            updateStatus(Collections.emptyList(), Collections.singletonList(message), Collections.emptyList(), ImportState.STARTED);
            return;
        }

        RecordClassDescriptor[] inTypes = reader.getTypes();
        RecordClassDescriptor[] outTypes = stream.isFixedType() ?
                new RecordClassDescriptor[]{stream.getFixedType()} :
                stream.getPolymorphicDescriptors();

        SchemaAnalyzer analyzer = Utils.createSchemaAnalyzer(inTypes, outTypes);
        HashMap<RecordClassDescriptor, Function<RawMessage, RawMessage>> converters = new HashMap<>();

        LoadingOptions.WriteMode writeMode = settings.getWriteMode() != null ? settings.getWriteMode() : LoadingOptions.WriteMode.REWRITE;
        String importTarget = stream.getKey() + (space != null ? ("[space: " + space + "]") : "") + (symbol != null ? ("[symbol: " + symbol + "]") : "");
        String importMessage = "Importing " + fileName + " into " + importTarget + " (Write Mode: " + writeMode + ")";
        LOGGER.info().append(importMessage).commit();
        report.sendInfo(importMessage);
        updateStatus(Collections.singletonList(importMessage), Collections.emptyList(), Collections.emptyList(), ImportState.STARTED);

        int importedMessages = 0;
        LoadingOptions options = new LoadingOptions();
        options.raw = true;
        options.channelQOS = ChannelQualityOfService.MAX_THROUGHPUT;
        options.space = space;
        options.writeMode = writeMode;

        long lastSendProgressMs = 0;

        importProcess.update();
        try (TickLoader loader = stream.createLoader(options)) {
            loader.addEventListener(report::newWarning);

            while (reader.next() && !cancelled) {
                InstrumentMessage msg = reader.getMessage();
                if (msg.getTimeStampMs() > importProcess.importSettings().getEndTime()) {
                    break;
                }
                if (msg.getTimeStampMs() < importProcess.importSettings().getStartTime()) {
                    continue;
                }

                if (symbols != null && !symbols.containsCharSequence(msg.getSymbol())) {
                    continue;
                }

                if (msg instanceof RawMessage) {
                    RawMessage message = (RawMessage) msg;
                    Function<RawMessage, RawMessage> converter = converters.get(message.type);
                    if (converter == null) {
                        RecordClassDescriptor descriptor = Utils.findType(stream.getTypes(), message.type);
                        if (descriptor == null) {
                            continue;
                        }

                        MetaDataChange change = analyzer.getChanges(
                            new RecordClassSet(new RecordClassDescriptor[] { message.type }),
                            MetaDataChange.ContentType.Fixed,
                            new RecordClassSet(new RecordClassDescriptor[] { descriptor }),
                            MetaDataChange.ContentType.Fixed
                        );

                        SchemaConverter finalConverter = new SchemaConverter(change);
                        converters.put(message.type, converter = finalConverter::convert);
                    }

                    RawMessage converted = converter.apply(message);
                    if (converted != null) {
                        loader.send(converted);
                        importedMessages++;

                        if (System.currentTimeMillis() - lastSendProgressMs > 500) {
                            report.sendProgress(getCurrentProgress(reader.getProgress(), fileSize));
                            report.sendWarnings();
                            lastSendProgressMs = System.currentTimeMillis();
                        }
                    }
                }

                if (importedMessages % 10000 == 0) {
                    importProcess.update();
                }
            }
        }

        String successfulMessage = "Successfully imported " + fileName + " into " +
            importTarget + ". Imported messages: " + importedMessages;
        LOGGER.info().append(successfulMessage).commit();
        report.sendInfo(successfulMessage);
        updateStatus(Collections.singletonList(successfulMessage), Collections.emptyList(), Collections.emptyList(), ImportState.STARTED);
    }

    protected String getEntryName(ZipEntry entry) {
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

    private static boolean isSchemaValid(DXTickStream stream, RecordClassDescriptor[] types) {
        SchemaAnalyzer schemaAnalyzer = new SchemaAnalyzer(Utils.getSchemaMapping(types, stream.getTypes()));
        RecordClassSet fileSchema = new RecordClassSet(types);
        RecordClassSet streamSchema = new RecordClassSet(stream.getTypes());
        StreamMetaDataChange change = schemaAnalyzer.getChanges(
                fileSchema, MetaDataChange.ContentType.Polymorphic,
                streamSchema, MetaDataChange.ContentType.Polymorphic
        );

        SchemaChange.Impact changeImpact = change.getChangeImpact();
        return changeImpact == SchemaChange.Impact.None || changeImpact == SchemaChange.Impact.DataConvert ;
    }

    private static DXTickStream getOrCreateStream(TimebaseService timebaseService, ImportSettings settings, RecordClassDescriptor[] types) {
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
//    private static RecordClassDescriptor[] updateTypes(RecordClassDescriptor[] types) {
//        SchemaUpdater migrator = new SchemaUpdater(new ClassMappings());
//        try {
//            return migrator.update(types);
//        } catch (Exception e) {
//            return types;
//        }
//    }

    private double getCurrentProgress(double currentProgress, long currentFileSize) {
        long currentBytesRead = (long) (currentProgress >= 0 ? (currentProgress * (double) currentFileSize) : 0);
        return (double) (totalImportedBytes + currentBytesRead) / (double) importProcess.getSize();
    }

    private synchronized void updateStatus(List<String> infoList, List<String> warns, List<String> errors, ImportState state) {
        importStatus.setInfoState(infoList);
        importStatus.setWarnList(warns);
        importStatus.setErrorList(errors);
        importStatus.setState(state);
        importStatus.update();
    }

}
