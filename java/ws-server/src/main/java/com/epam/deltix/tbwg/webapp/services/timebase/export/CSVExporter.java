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
package com.epam.deltix.tbwg.webapp.services.timebase.export;

import com.epam.deltix.qsrv.hf.pub.RawMessage;
import com.epam.deltix.qsrv.hf.pub.md.RecordClassDescriptor;
import com.epam.deltix.qsrv.hf.tickdb.pub.query.InstrumentMessageSource;
import com.epam.deltix.tbwg.webapp.model.input.ExportMode;
import com.epam.deltix.tbwg.webapp.model.input.ExportRequest;
import com.epam.deltix.tbwg.webapp.utils.CsvLineWriter;
import com.epam.deltix.util.io.CSVWriter;

import javax.validation.constraints.NotNull;
import java.io.IOException;
import java.io.OutputStream;
import java.io.UnsupportedEncodingException;
import java.util.List;
import java.util.concurrent.atomic.AtomicLong;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

public class CSVExporter extends StreamExporter {

    public CSVExporter(AtomicLong exportProcesses,
                       String fileName, ExportSourceFactory sourceFactory,
                       ExportRequest request, long fromTimestamp, long toTimestamp, long startIndex, long endIndex,
                       RecordClassDescriptor[] descriptors) {
        super(exportProcesses, fileName, sourceFactory, request, fromTimestamp, toTimestamp, startIndex, endIndex, false, descriptors);
    }

    @Override
    public void writeTo(@NotNull OutputStream outputStream) throws IOException {
        try (ZipOutputStream zipOutputStream = new ZipOutputStream(outputStream);
             CSVWriter writer = createCsvWriter(zipOutputStream);)
        {
            writer.setCloseDelegate(false);
            CsvLineWriter lineWriter = new CsvLineWriter(writer, request, descriptors);

            if (request.mode == ExportMode.FILE_PER_SPACE) {
                exportByKey(this::getSpaces, (spaces) -> exportSpaces(zipOutputStream, lineWriter, spaces));
            } else if (request.mode == ExportMode.FILE_PER_SYMBOL) {
                exportByKey(this::getSymbols, (symbols) -> exportSymbols(zipOutputStream, lineWriter, symbols));
            } else {
                // single file
                zipOutputStream.putNextEntry(new ZipEntry(encodeName(fileName.replace(".zip", "")) + ".csv"));
                try (InstrumentMessageSource source = sourceFactory.newMessageSource()) {
                    writeFile(source, lineWriter);
                }
            }
        } finally {
            exportProcesses.decrementAndGet();
        }
    }

    private CSVWriter createCsvWriter(ZipOutputStream os) throws UnsupportedEncodingException {
        if (request.valueSeparator == null) {
            return new CSVWriter(os);
        } else {
            return new CSVWriter(
                os,
                "\\t".equals(request.valueSeparator) ? '\t' : request.valueSeparator.charAt(0),
                "UTF8"
            );
        }
    }

    private void exportSpaces(ZipOutputStream zipOutputStream, CsvLineWriter lineWriter, List<String> spaces) throws IOException {
        StreamsExportSourceFactory streamSourceFactory;
        if (sourceFactory instanceof StreamsExportSourceFactory) {
            streamSourceFactory = (StreamsExportSourceFactory) sourceFactory;
        } else {
            throw new IllegalStateException("Can't select spaces from query source");
        }

        for (String space : spaces) {
            streamSourceFactory.getOptions().withSpace(space);
            try (InstrumentMessageSource source = sourceFactory.newMessageSource()) {
                zipOutputStream.putNextEntry(new ZipEntry(encodeName(space) + ".csv"));
                writeFile(source, lineWriter);
            } finally {
                lineWriter.flush();
                zipOutputStream.closeEntry();
            }
        }
    }

    private void exportSymbols(ZipOutputStream zipOutputStream, CsvLineWriter lineWriter, List<String> symbols) throws IOException {
        try (InstrumentMessageSource source = sourceFactory.newMessageSource()) {
            for (String symbol : symbols) {
                try {
                    zipOutputStream.putNextEntry(new ZipEntry(encodeName(symbol) + ".csv"));
                    source.clearAllSymbols();
                    source.addSymbol(symbol);
                    source.reset(fromTimestamp);
                    writeFile(source, lineWriter);
                } finally {
                    lineWriter.flush();
                    zipOutputStream.closeEntry();
                }
            }
        }
    }

    private void writeFile(InstrumentMessageSource source, CsvLineWriter lineWriter) throws IOException {
        lineWriter.writeHeader();
        int messageIndex = 0;// inclusive
        while (source.next() && (endIndex < 0 || messageIndex <= endIndex)) {
            if (messageIndex >= startIndex) {
                RawMessage raw = (RawMessage) source.getMessage();
                if (raw.getTimeStampMs() > toTimestamp)
                    break;

                lineWriter.writeLine(raw);
            }
            messageIndex++;
        }
    }

}
