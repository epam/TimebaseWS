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

package com.epam.deltix.tbwg.webapp.services.timebase.export;

import com.epam.deltix.gflog.api.Log;
import com.epam.deltix.gflog.api.LogFactory;
import com.epam.deltix.qsrv.hf.pub.RawMessage;
import com.epam.deltix.qsrv.hf.pub.md.RecordClassDescriptor;
import com.epam.deltix.qsrv.hf.stream.MessageWriter2;
import com.epam.deltix.qsrv.hf.tickdb.pub.query.InstrumentMessageSource;
import com.epam.deltix.tbwg.webapp.model.input.ExportMode;
import com.epam.deltix.tbwg.webapp.model.input.ExportRequest;
import com.epam.deltix.tbwg.webapp.utils.TBWGUtils;
import com.epam.deltix.util.time.Interval;

import javax.validation.constraints.NotNull;
import java.io.IOException;
import java.io.OutputStream;
import java.util.List;
import java.util.concurrent.atomic.AtomicLong;
import java.util.zip.ZipOutputStream;

public class MessageSource2QMSGFile extends StreamExporter {

    private static final Log LOGGER = LogFactory.getLog(MessageSource2QMSGFile.class);

    private final Interval periodicity;

    @SuppressWarnings({"unchecked", "unused"})
    public MessageSource2QMSGFile(AtomicLong exportProcesses, ExportSourceFactory sourceFactory, ExportRequest request) {
        super(exportProcesses, null, sourceFactory, request,
            Long.MIN_VALUE, Long.MAX_VALUE, 0, Integer.MAX_VALUE, null
        );
        this.periodicity = null;
    }

    public MessageSource2QMSGFile(AtomicLong exportProcesses,
                                  String file, ExportSourceFactory sourceFactory, ExportRequest request,
                                  long fromTimestamp, long toTimestamp, long startIndex, long endIndex,
                                  Interval periodicity, RecordClassDescriptor... descriptors) {
        super(exportProcesses, file, sourceFactory, request, fromTimestamp, toTimestamp, startIndex, endIndex, descriptors);
        this.periodicity = periodicity;
    }

    @Override
    public void writeTo(@NotNull OutputStream outputStream) throws IOException {
        try {
            if (request.mode == ExportMode.FILE_PER_SPACE) {
                exportFilePerSpace(outputStream);
            } else if (request.mode == ExportMode.FILE_PER_SYMBOL) {
                exportFilePerSymbol(outputStream);
            } else {
                exportSingleFile(outputStream);
            }
        } finally {
            exportProcesses.decrementAndGet();
        }
    }

    private void exportSingleFile(OutputStream outputStream) throws IOException {
        try (InstrumentMessageSource source = sourceFactory.newMessageSource();
             MessageWriter2 messageWriter = TBWGUtils.create(outputStream, periodicity, descriptors)) {
            exportFile(messageWriter, source);
        } catch (ClassNotFoundException e) {
            LOGGER.error().append("Unexpected ").append(e).commit();
        }
    }

    private void exportFilePerSpace(OutputStream outputStream) throws IOException {
        try (ZipOutputStream zipOutputStream = new ZipOutputStream(outputStream)) {
            exportByKey(this::getSpaces, (spaces) -> exportSpaces(zipOutputStream, spaces));
        }
    }

    private void exportSpaces(ZipOutputStream zipOutputStream, List<String> spaces) throws IOException {
        for (String space : spaces) {
            sourceFactory.getOptions().withSpace(space);
            try (ZipFileWriter writer = new QMSGZipEntryFileWriter(this, zipOutputStream);
                 InstrumentMessageSource source = sourceFactory.newMessageSource()) {
                writer.writeFile(source, encodeName(space) + ExportService.MSG_FORMAT);
            }
        }
    }

    private void exportFilePerSymbol(OutputStream outputStream) throws IOException {
        try (ZipOutputStream zipOutputStream = new ZipOutputStream(outputStream);
             InstrumentMessageSource source = sourceFactory.newMessageSource()) {
            exportByKey(this::getSymbols, (symbols) -> exportSymbols(zipOutputStream, source, symbols));
        }
    }

    private void exportSymbols(ZipOutputStream zipOutputStream, InstrumentMessageSource source, List<String> symbols) throws IOException {
        for (String symbol : symbols) {
            try (ZipFileWriter writer = new QMSGZipEntryFileWriter(this, zipOutputStream)) {
                source.clearAllSymbols();
                source.addSymbol(symbol);
                source.reset(fromTimestamp);
                writer.writeFile(source, encodeName(symbol) + ExportService.MSG_FORMAT);
            }
        }
    }

    private void exportFile(MessageWriter2 messageWriter, InstrumentMessageSource source) {
        int messageIndex = 0;// inclusive
        while (source.next() && (endIndex < 0 || messageIndex <= endIndex)) {
            if (messageIndex >= startIndex) {
                RawMessage raw = (RawMessage) source.getMessage();
                if (raw.getTimeStampMs() > toTimestamp)
                    break;
                messageWriter.send(raw);
            }
            messageIndex++;
        }
    }

    public Interval getPeriodicity() {
        return periodicity;
    }
}
