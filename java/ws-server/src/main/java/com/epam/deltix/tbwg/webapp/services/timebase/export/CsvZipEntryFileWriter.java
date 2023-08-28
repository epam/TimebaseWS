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

import com.epam.deltix.qsrv.hf.pub.RawMessage;
import com.epam.deltix.qsrv.hf.tickdb.pub.query.InstrumentMessageSource;
import com.epam.deltix.tbwg.webapp.utils.CsvLineWriter;

import java.io.IOException;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

public class CsvZipEntryFileWriter implements ZipFileWriter {

    private final CSVExporter streamExporter;
    private final ZipOutputStream zipOutputStream;
    private final CsvLineWriter lineWriter;
    private boolean initialized = false;


    public CsvZipEntryFileWriter(CSVExporter streamExporter, ZipOutputStream zipOutputStream, CsvLineWriter lineWriter) {
        this.streamExporter = streamExporter;
        this.zipOutputStream = zipOutputStream;
        this.lineWriter = lineWriter;
    }

    @Override
    public void writeFile(InstrumentMessageSource source, String fileName) throws IOException {
        int messageIndex = 0;
        if (!streamExporter.request.skipEmpty) {
            init(fileName);
        }
        while (source.next() && (streamExporter.endIndex < 0 || messageIndex <= streamExporter.endIndex)) {
            if (messageIndex >= streamExporter.startIndex) {
                RawMessage raw = (RawMessage) source.getMessage();
                if (raw.getTimeStampMs() > streamExporter.toTimestamp)
                    break;
                if (!initialized) {
                    init(fileName);
                }
                lineWriter.writeLine(raw);
            }
            messageIndex++;
        }
    }

    private void init(String fileName) throws IOException {
        zipOutputStream.putNextEntry(new ZipEntry(fileName));
        lineWriter.writeHeader();
        initialized = true;
    }

    @Override
    public void close() throws IOException {
        if (initialized) {
            lineWriter.flush();
            zipOutputStream.closeEntry();
        }
    }
}
