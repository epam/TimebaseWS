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

package com.epam.deltix.tbwg.webapp.services.timebase.csvimport;

import com.epam.deltix.data.stream.MessageSourceMultiplexer;
import com.epam.deltix.gflog.api.Log;
import com.epam.deltix.gflog.api.LogFactory;
import com.epam.deltix.qsrv.hf.pub.ChannelQualityOfService;
import com.epam.deltix.qsrv.hf.pub.RawMessage;
import com.epam.deltix.qsrv.hf.pub.md.RecordClassDescriptor;
import com.epam.deltix.qsrv.hf.tickdb.pub.*;
import com.epam.deltix.qsrv.hf.tickdb.ui.tbshell.TickDBShell;
import com.epam.deltix.tbwg.webapp.services.timebase.TimebaseService;
import com.epam.deltix.tbwg.webapp.services.timebase.export.imp.*;
import com.epam.deltix.tbwg.webapp.utils.TBWGUtils;
import com.epam.deltix.tbwg.webapp.websockets.subscription.SubscriptionChannel;
import com.epam.deltix.util.lang.Util;
import com.epam.deltix.util.time.GMT;

import java.io.File;
import java.io.IOException;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.*;
import java.util.stream.Collectors;

public class ImportDirectoryTask implements ImportTask {

    private static final Log LOGGER = LogFactory.getLog(ImportServiceImpl.class);

    private final TimebaseService timebaseService;
    private final DirectoryImportProcess importProcess;
    private final CsvImportSettings settings;
    private final ImportProcessReport report;
    private final long from;
    private final long to;
    private volatile boolean cancelled;
    private final ImportStatus importStatus;


    public ImportDirectoryTask(TimebaseService timebaseService, DirectoryImportProcess importProcess,
                               ImportProcessReport report, CsvImportSettings settings, ImportStatus status) {
        this.timebaseService = timebaseService;
        this.importProcess = importProcess;
        this.settings = settings;
        this.report = report;
        importStatus = status;
        String timeZoneStr = settings.getGeneralSettings().getTimeZone();
        from = getTimeOrDefault(settings.getGeneralSettings().getStartTime(), timeZoneStr, Long.MIN_VALUE);
        to = getTimeOrDefault(settings.getGeneralSettings().getEndTime(), timeZoneStr, Long.MAX_VALUE);
    }

    private long getTimeOrDefault(Instant time, String timeZone, long defaultValue) {
        if (time != null) {
            TimeZone tz = TimeZone.getTimeZone(timeZone);
            int rawOffset = tz.getRawOffset();
            if (tz.inDaylightTime(new Date(time.toEpochMilli()))) {
                rawOffset += tz.getDSTSavings();
            }
            return time.toEpochMilli() - rawOffset;
        }
        return defaultValue;
    }

    @Override
    public ImportState getImportState() {
        return importStatus.getState();
    }

    @Override
    public void updateChannel(SubscriptionChannel channel) {
        report.updateChannel(channel);
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
        updateStatus(Collections.emptyList(), Collections.emptyList(), Collections.emptyList(), ImportState.STARTED);

        DXTickStream stream = TBWGUtils.getStream(timebaseService, settings.getGeneralSettings().getStreamKey());
        RecordClassDescriptor[] types = TickDBShell.collectTypes(stream);
        FileRawMessageSource[] messageSources = getMessageSources(importProcess, types);

        if (settings.getGeneralSettings().isGlobalSorting()) {
            report.sendState(ImportState.SORTING);
            report.sendInfo("Sorting");
            FileRawMessageSource[] sortedSources;
            try {
                sortedSources = createSortedSources(messageSources, types);
            } catch (Exception e) {
                report.sendError(e.getMessage());
                updateStatus(Collections.emptyList(), Collections.emptyList(), Collections.singletonList(e.getMessage()), ImportState.FINISHED);
                throw new RuntimeException("Sorting error", e);
            } finally {
                closeAllSources(messageSources);
            }
            messageSources = sortedSources;
        }

        report.sendState(ImportState.STARTED);
        report.sendInfo("Import start");

        try {
            importSource(stream, messageSources);
            report.sendProgress(1.0d);
        } catch (Throwable e) {
            cancel();
            updateStatus(Collections.emptyList(), Collections.emptyList(), Collections.singletonList(e.getMessage()), ImportState.FINISHED);
            report.sendError(e.getMessage());
        } finally {
            closeAllSources(messageSources);
            List<String> finallyReport = finallyReport(messageSources);
            report.sendState(ImportState.FINISHED);
            updateStatus(finallyReport, Collections.emptyList(), Collections.emptyList(), ImportState.FINISHED);
        }
    }

    private synchronized void updateStatus(List<String> infoList, List<String> warns, List<String> errors, ImportState state) {
        importStatus.setInfoState(infoList);
        importStatus.setWarnList(warns);
        importStatus.setErrorList(errors);
        importStatus.setState(state);
        importStatus.update();
    }

    private void closeAllSources(FileRawMessageSource[] messageSources) {
        if (messageSources != null) {
            for (FileRawMessageSource source : messageSources) {
                if (source != null) {
                    source.close();
                }
            }
        }
    }

    private FileRawMessageSource[] getMessageSources(DirectoryImportProcess importProcess, RecordClassDescriptor[] types) {
        List<File> sourceFiles = importProcess.filesList();
        FileRawMessageSource[] sources = new FileRawMessageSource[sourceFiles.size()];
        int i = 0;
        for (File file : sourceFiles) {
            try {
                sources[i] = new CsvMessageSource(file, settings, types);
            } catch (IOException e) {
                throw new IllegalArgumentException("Can't create source for \"" + file.getName() + "\" file. Reason: "
                        + e.getMessage());
            }
            i++;
        }
        return sources;
    }

    private FileRawMessageSource[] createSortedSources(FileRawMessageSource[] sources, RecordClassDescriptor[] types)
            throws InterruptedException, ExecutionException {
        Collection<Callable<FileRawMessageSource[]>> list = new ArrayList<>();
        ByteMultiSourceProgressCounter progressCounter = new ByteMultiSourceProgressCounter(0.5);
        for (FileRawMessageSource source : sources) {
            MessageSourceSortConvertor sortConvertor = new MessageSourceSortConvertor(
                    Util.fractionOfAvailableMemory(0.05), importProcess, source, types, report,
                    progressCounter, from, to);
            list.add(sortConvertor);
        }
        ExecutorService executorService = Executors.newFixedThreadPool(4);
        List<Future<FileRawMessageSource[]>> futures = executorService.invokeAll(list);
        List<FileRawMessageSource> sortedSources = new ArrayList<>();
        for (Future<FileRawMessageSource[]> future : futures) {
            try {
                sortedSources.addAll(List.of(future.get()));
            } catch (ExecutionException e) {
                closeAllSources(sortedSources.toArray(FileRawMessageSource[]::new));
                throw e;
            }
        }
        return sortedSources.toArray(FileRawMessageSource[]::new);
    }

    private void importSource(DXTickStream stream, FileRawMessageSource[] messageSources) {
        LoadingOptions options = new LoadingOptions();
        options.raw = true;
        options.channelQOS = ChannelQualityOfService.MAX_THROUGHPUT;
        options.writeMode = settings.getGeneralSettings().getWriteMode();
        long lastSendProgressMs = 0;

        importProcess.update();
        try (TickLoader loader = stream.createLoader(options);
             MessageSourceMultiplexer<RawMessage> multiplexer = new MessageSourceMultiplexer<>(messageSources)) {
            loader.addEventListener(report::newWarning);

            while (multiplexer.next() && !cancelled) {
                RawMessage msg = multiplexer.getMessage();
                if (msg == null || msg.getTimeStampMs() < from) {
                    report.newWarning(getLoadingWarning(msg));
                    continue;
                }
                if (msg.getTimeStampMs() > to) {
                    report.newWarning(getLoadingWarning(msg));
                    break;
                }
                loader.send(msg);

                if (System.currentTimeMillis() - lastSendProgressMs > 1000) {
                    report.sendProgress(getCurrentProgress(messageSources));
                    report.sendWarnings();
                    List<String> skipMessages = getSkipMessages(messageSources);
                    report.sendWarnings(skipMessages);
                    updateStatus(Collections.emptyList(), skipMessages, Collections.emptyList(), ImportState.STARTED);
                    importProcess.update();
                    lastSendProgressMs = System.currentTimeMillis();
                }
            }
        } finally {
            report.sendWarnings();
            report.sendWarnings(getSkipMessages(messageSources));
        }
    }

    private LoadingError getLoadingWarning(RawMessage msg) {
        if (msg == null) {
            return new LoadingError("Empty message");
        }
        return new LoadingError(String.format("Message %s:%s is out of time range",
                msg.getSymbol(), GMT.formatNanos(msg.getNanoTime())));
    }

    private List<String> finallyReport(FileRawMessageSource[] messageSources) {
        if (settings.getGeneralSettings().isGlobalSorting()) {
            messageSources = Arrays.stream(messageSources)
                    .collect(Collectors.groupingBy(FileRawMessageSource::getFileName))
                    .values()
                    .stream()
                    .map(fileRawMessageSources -> fileRawMessageSources.get(0))
                    .toArray(FileRawMessageSource[]::new);
        }
        boolean fullReport = messageSources.length < 100;
        List<String> result = new ArrayList<>();
        long totalMessagesProcessed = 0;
        long totalSkipMessagesCount = report.getWarningsCount();
        for (FileRawMessageSource source : messageSources) {
            long messagesProcessed = source.getMessagesProcessed();
            totalMessagesProcessed += messagesProcessed;
            long skipMessagesCount = source.getSkipMessagesCount();
            totalSkipMessagesCount += skipMessagesCount;
            String message = String.format("Import of the file \"%s\" is completed. Processed %d rows, of which %d were skipped.",
                    source.getFileName(), messagesProcessed, skipMessagesCount);
            if (fullReport) {
                report.sendInfo(message);
                result.add(message);
            } else {
                report.sendToWriter(message, ImportEventType.INFO);
            }
        }
        String message = String.format("Import process is completed. Processed %d rows, of which %d were inset and %d were skipped.",
                totalMessagesProcessed, totalMessagesProcessed - totalSkipMessagesCount, totalSkipMessagesCount);
        report.sendInfo(message);
        result.add(message);
        return result;
    }


    private List<String> getSkipMessages(FileRawMessageSource[] messageSources) {
        return Arrays.stream(messageSources)
                .map(FileRawMessageSource::getSkipMessagesReport)
                .filter(Objects::nonNull)
                .flatMap(Collection::stream)
                .collect(Collectors.toList());
    }

    private double getCurrentProgress(FileRawMessageSource[] messageSources) {
        long currentProgress = Arrays.stream(messageSources)
                .map(FileRawMessageSource::getBytesRead)
                .reduce(Long::sum)
                .orElse(0L);
        long totalSize = Arrays.stream(messageSources)
                .map(FileRawMessageSource::getFileSize)
                .reduce(Long::sum)
                .orElse(1L);
        double progress = (double) currentProgress / totalSize;
        progress = settings.getGeneralSettings().isGlobalSorting() ? (0.5 + progress / 2) : progress;
        return progress >= 0 ? progress : 0;
    }
}
