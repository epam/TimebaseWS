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
import java.util.zip.ZipOutputStream;

import static com.epam.deltix.tbwg.webapp.services.timebase.export.ExportService.CSV_FORMAT;
import static com.epam.deltix.tbwg.webapp.services.timebase.export.ExportService.ZIP_FORMAT;

public class CSVExporter extends StreamExporter {

    public CSVExporter(AtomicLong exportProcesses,
                       String fileName, ExportSourceFactory sourceFactory,
                       ExportRequest request, long fromTimestamp, long toTimestamp, long startIndex, long endIndex,
                       RecordClassDescriptor[] descriptors) {
        super(exportProcesses, fileName, sourceFactory, request, fromTimestamp, toTimestamp, startIndex, endIndex, descriptors);
    }

    @Override
    public void writeTo(@NotNull OutputStream outputStream) throws IOException {
        try (ZipOutputStream zipOutputStream = new ZipOutputStream(outputStream);
             CSVWriter writer = createCsvWriter(zipOutputStream)) {
            writer.setCloseDelegate(false);
            CsvLineWriter lineWriter = new CsvLineWriter(writer, request, descriptors);

            if (request.mode == ExportMode.FILE_PER_SPACE) {
                exportByKey(this::getSpaces, (spaces) -> exportSpaces(zipOutputStream, lineWriter, spaces));
            } else if (request.mode == ExportMode.FILE_PER_SYMBOL) {
                exportByKey(this::getSymbols, (symbols) -> exportSymbols(zipOutputStream, lineWriter, symbols));
            } else {
                exportSingleFile(zipOutputStream, lineWriter);
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
        for (String space : spaces) {
            sourceFactory.getOptions().withSpace(space);
            try (ZipFileWriter writer = new CsvZipEntryFileWriter(this, zipOutputStream, lineWriter);
                 InstrumentMessageSource source = sourceFactory.newMessageSource()) {
                writer.writeFile(source, encodeName(space) + CSV_FORMAT);
            }
        }
    }

    private void exportSymbols(ZipOutputStream zipOutputStream, CsvLineWriter lineWriter, List<String> symbols) throws IOException {
        try (InstrumentMessageSource source = sourceFactory.newMessageSource()) {
            for (String symbol : symbols) {
                try (ZipFileWriter writer = new CsvZipEntryFileWriter(this, zipOutputStream, lineWriter)) {
                    source.clearAllSymbols();
                    source.addSymbol(symbol);
                    source.reset(fromTimestamp);
                    writer.writeFile(source, encodeName(symbol) + CSV_FORMAT);
                }
            }
        }
    }

    private void exportSingleFile(ZipOutputStream zipOutputStream, CsvLineWriter lineWriter) throws IOException {
        try (ZipFileWriter writer = new CsvZipEntryFileWriter(this, zipOutputStream, lineWriter);
             InstrumentMessageSource source = sourceFactory.newMessageSource()) {
            writer.writeFile(source, encodeName(fileName.replace(ZIP_FORMAT, "")) +CSV_FORMAT);
        }
    }

}
