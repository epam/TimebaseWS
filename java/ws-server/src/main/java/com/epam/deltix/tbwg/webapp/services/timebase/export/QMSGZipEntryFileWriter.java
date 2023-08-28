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
import com.epam.deltix.qsrv.hf.stream.MessageWriter2;
import com.epam.deltix.qsrv.hf.tickdb.pub.query.InstrumentMessageSource;

import java.io.IOException;
import java.util.zip.GZIPOutputStream;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

public class QMSGZipEntryFileWriter implements ZipFileWriter {

    private static final Log LOGGER = LogFactory.getLog(QMSGZipEntryFileWriter.class);

    private final MessageSource2QMSGFile streamExporter;
    private final ZipOutputStream zipOutputStream;
    private MessageWriter2 messageWriter;
    private GZIPOutputStream gzipOutputStream;
    private boolean initialized = false;

    public QMSGZipEntryFileWriter(MessageSource2QMSGFile streamExporter, ZipOutputStream zipOutputStream) {
        this.streamExporter = streamExporter;
        this.zipOutputStream = zipOutputStream;
    }

    @Override
    public void writeFile(InstrumentMessageSource source, String fileName) throws IOException {
        try {
            if (!streamExporter.request.skipEmpty) {
                init(fileName);
            }
            int messageIndex = 0;
            while (source.next() && (streamExporter.endIndex < 0 || messageIndex <= streamExporter.endIndex)) {
                if (messageIndex >= streamExporter.startIndex) {
                    RawMessage raw = (RawMessage) source.getMessage();
                    if (raw.getTimeStampMs() > streamExporter.toTimestamp)
                        break;
                    if (!initialized) {
                        init(fileName);
                    }
                    messageWriter.send(raw);
                }
                messageIndex++;
            }
        } catch (ClassNotFoundException e) {
            LOGGER.error().append("Unexpected ").append(e).commit();
            throw new RuntimeException(e);
        }
    }

    private void init(String fileName) throws IOException, ClassNotFoundException {
        zipOutputStream.putNextEntry(new ZipEntry(fileName));
        initialized = true;
        gzipOutputStream = new GZIPOutputStream(zipOutputStream, 1 << 16 / 2);
        messageWriter = new MessageWriter2(gzipOutputStream, streamExporter.getPeriodicity(),
                                           null, streamExporter.descriptors);
    }

    @Override
    public void close() throws IOException {
        if (initialized) {
            // do not close message writer, close archive entry instead
            if (messageWriter != null)
                messageWriter.flush();
            if (gzipOutputStream != null)
                gzipOutputStream.finish();
            zipOutputStream.closeEntry();
        }
    }
}
