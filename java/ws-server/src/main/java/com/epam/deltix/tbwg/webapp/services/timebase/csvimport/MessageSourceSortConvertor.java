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

import com.epam.deltix.qsrv.hf.pub.RawMessage;
import com.epam.deltix.qsrv.hf.pub.md.RecordClassDescriptor;
import com.epam.deltix.qsrv.hf.stream.MessageWriter2;
import com.epam.deltix.timebase.messages.InstrumentMessage;
import org.jetbrains.annotations.NotNull;

import java.io.*;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.CancellationException;
import java.util.zip.GZIPOutputStream;

public class MessageSourceSortConvertor implements Callable<FileRawMessageSource[]> {

    private final long maxMemSize;
    private final ByteMultiSourceProgressCounter progressCounter;
    private long chunkSize;
    private final DirectoryImportProcess importProcess;
    private final List<File> files = new ArrayList<>();
    private final List<RawMessage> messages = new ArrayList<>();
    private final FileRawMessageSource source;
    private final RecordClassDescriptor[] descriptors;
    private final ImportProcessReport report;
    private final long from;
    private final long to;
    private long skipMessagesCount;


    public MessageSourceSortConvertor(long maxMemSize, DirectoryImportProcess importProcess, FileRawMessageSource source,
                                      RecordClassDescriptor[] descriptors, ImportProcessReport report,
                                      ByteMultiSourceProgressCounter progressCounter, long from, long to) {
        this.maxMemSize = maxMemSize;
        this.importProcess = importProcess;
        this.source = source;
        this.descriptors = descriptors;
        this.report = report;
        this.from = from;
        this.to = to;
        this.progressCounter = progressCounter;
        progressCounter.addProgressSource(source.getFileName(), source.getFileSize());

    }

    @Override
    public FileRawMessageSource[] call() throws Exception {
        return getSortedSources();
    }


    public FileRawMessageSource[] getSortedSources() throws IOException {
        report.sendInfo(getInitialSortingReport());
        splitAndSort();
        report.sendInfo(getFinishSortingReport());
        if (!importProcess.isCancelled()) {
            return createSortedSourcesFromFiles();
        }
        throw new CancellationException("Sorting " + source.getFileName() + " is cancelled");
    }

    @NotNull
    private FileRawMessageSource[] createSortedSourcesFromFiles() throws IOException {
        FileRawMessageSource[] sources = new FileRawMessageSource[files.size()];
        for (int i = 0; i < files.size(); i++) {
            File file = files.get(i);
            FileInputStream inputStream = new FileInputStream(file);
            sources[i] = new FileRawMessageReader(inputStream, file.length(), source.getFileName(),
                    getSkipMessagesCount(), source.getMessagesProcessed());
        }
        return sources;
    }

    private long getSkipMessagesCount() {
        return skipMessagesCount + source.getSkipMessagesCount();
    }


    private void splitAndSort() throws IOException {
        while (source.next() && !importProcess.isCancelled()) {
            if (source.getMessagesProcessed() % 10000 == 0) {
                importProcess.update();
                report.sendWarnings(source.getSkipMessagesReport());
                report.sendProgress(progressCounter.updateAndGet(source.getFileName(), source.getBytesRead()));
            }
            RawMessage message = source.getMessage();
            if (message.getTimeStampMs() < from || message.getTimeStampMs() > to) {
                skipMessagesCount++;
                continue;
            }
            messages.add(message);
            chunkSize += message.length;
            if (maxMemSize < chunkSize) {
                writeChunk();
                chunkSize = 0;
                messages.clear();
            }
        }
        if (!importProcess.isCancelled()) {
            writeChunk();
        }
    }

    private void writeChunk() throws IOException {
        importProcess.update();
        report.sendWarnings(source.getSkipMessagesReport());
        report.sendProgress(progressCounter.updateAndGet(source.getFileName(), source.getBytesRead()));

        messages.sort(Comparator.comparingLong(InstrumentMessage::getTimeStampMs));
        File tmpFile = File.createTempFile("sort_", ".tmp", importProcess.getProcessDirectory());
        tmpFile.deleteOnExit();

        try (BufferedOutputStream os = new BufferedOutputStream(new GZIPOutputStream(new FileOutputStream(tmpFile)));
             MessageWriter2 writer = new MessageWriter2(os, null, null, descriptors)) {
            for (RawMessage message : messages) {
                writer.send(message);
            }
            writer.flush();
        } catch (ClassNotFoundException e) {
            throw new RuntimeException(e);
        }
        files.add(tmpFile);
    }

    private String getInitialSortingReport() {
        return String.format("Start sorting of the file \"%s\".", source.getFileName());
    }

    private String getFinishSortingReport() {
        long messagesProcessed = source.getMessagesProcessed();
        return String.format("Sorting of the file \"%s\" is completed." +
                        "Processed %d rows, of which %d were skipped.",
                source.getFileName(),
                messagesProcessed,
                getSkipMessagesCount());
    }
}

