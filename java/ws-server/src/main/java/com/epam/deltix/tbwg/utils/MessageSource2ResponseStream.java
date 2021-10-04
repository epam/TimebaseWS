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
package com.epam.deltix.tbwg.utils;

import com.epam.deltix.gflog.api.Log;
import com.epam.deltix.gflog.api.LogFactory;
import com.epam.deltix.qsrv.hf.pub.RawMessage;
import com.epam.deltix.qsrv.hf.tickdb.pub.query.InstrumentMessageSource;
import com.epam.deltix.qsrv.util.json.DataEncoding;
import com.epam.deltix.qsrv.util.json.JSONRawMessagePrinter;
import com.epam.deltix.qsrv.util.json.PrintType;
import com.epam.deltix.util.lang.Util;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

import javax.annotation.Nonnull;
import java.io.IOException;
import java.io.OutputStream;
import java.io.OutputStreamWriter;

public class MessageSource2ResponseStream implements StreamingResponseBody {

    private static final Log LOG = LogFactory.getLog(MessageSource2ResponseStream.class);

    private final InstrumentMessageSource source;
    private final long toTimestamp;
    private final long startIndex; // inclusive
    private final long endIndex; // inclusive
    private final int maxRecords;

    private final JSONRawMessagePrinter printer =
            new JSONRawMessagePrinter(false, true, DataEncoding.STANDARD, true,
                    false, PrintType.FULL, "$type");

    private final StringBuilder sb = new StringBuilder();

    @SuppressWarnings({"unused"})
    public MessageSource2ResponseStream(InstrumentMessageSource source, int maxRecords) {
        this.source = source;
        this.toTimestamp = Long.MAX_VALUE;
        this.startIndex = 0;
        this.endIndex = Integer.MAX_VALUE;
        this.maxRecords = maxRecords;
    }

    public MessageSource2ResponseStream(InstrumentMessageSource messageSource, long toTimestamp, long startIndex,
                                        long endIndex, int maxRecords) {
        this.source = messageSource;
        this.toTimestamp = toTimestamp;
        this.startIndex = startIndex;
        this.endIndex = endIndex;
        this.maxRecords = maxRecords;
    }

    @Override
    public void writeTo(@Nonnull OutputStream outputStream) throws IOException {

        try (OutputStreamWriter writer = new OutputStreamWriter(outputStream)) {
            int messageIndex = 0;
            boolean needComma = false;

            writer.append('[');
            final long limitIndex = Math.min(maxRecords + startIndex, endIndex); // inclusive
            while (source.next() && messageIndex <= limitIndex) {
                if (messageIndex >= startIndex) {

                    RawMessage raw = (RawMessage) source.getMessage();
                    if (raw.getTimeStampMs() > toTimestamp)
                        break;

                    sb.setLength(0);
                    if (needComma)
                        sb.append(',');
                    else
                        needComma = true;
                    try {
                        printer.append(raw, sb);
                        writer.append(sb);
                    } catch (Throwable ex) {
                        LOG.error("Error sending message [%s: %s, %s]: %s")
                                .with(source.getCurrentStreamKey())
                                .with(raw.getSymbol())
                                .with(raw.getTimeString())
                                .with(ex);
                        break;
                    }
                }

                messageIndex++;
            }
            writer.append(']');

        } finally {
            outputStream.flush();
            Util.close(source);
        }
    }
}
