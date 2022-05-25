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
package com.epam.deltix.tbwg.webapp.services.timebase;

import com.epam.deltix.gflog.api.Log;
import com.epam.deltix.gflog.api.LogFactory;
import com.epam.deltix.timebase.messages.IdentityKey;
import com.epam.deltix.qsrv.hf.pub.RawMessage;
import com.epam.deltix.qsrv.hf.tickdb.pub.SelectionOptions;
import com.epam.deltix.qsrv.hf.tickdb.pub.query.InstrumentMessageSource;
import com.epam.deltix.tbwg.webapp.utils.TBWGUtils;

import java.io.Closeable;
import java.util.Arrays;
import java.util.List;
import java.util.function.Consumer;

public class StreamConsumer extends Thread implements Closeable {

    private static final Log LOGGER = LogFactory.getLog(StreamConsumer.class);

    private final long startTime;
    private final String stream;
    private final String qql;
    private final String[] ids;
    private final String[] types;
    private final Consumer<RawMessage> messageConsumer;
    private final TimebaseService timebase;

    private volatile InstrumentMessageSource cursor;
    private volatile boolean active = false;

    public StreamConsumer(TimebaseService timebase, long startTime, String stream, String qql, List<String> symbols,
                          List<String> types, Consumer<RawMessage> messageConsumer) {
        this.timebase = timebase;
        this.startTime = startTime;
        this.stream = stream;
        this.qql = qql;
        this.ids = symbols != null ? symbols.toArray(new String[symbols.size()]) : null;
        this.types = types == null ? null: types.toArray(new String[types.size()]);
        this.messageConsumer = messageConsumer;
    }

    @Override
    public void run() {
        active = true;
        try (final InstrumentMessageSource cursor = openCursor()) {
            this.cursor = cursor;
            while (cursor.next()) {
                if (!active) {
                    break;
                }

                messageConsumer.accept((RawMessage) cursor.getMessage());
            }
        } catch (final Throwable e) {
            if (active) {
                LOGGER.error().append("Unexpected error while reading cursor.").append(e).commit();
            }
        } finally {
            close();
        }
    }

    private InstrumentMessageSource openCursor() {
        SelectionOptions options = new SelectionOptions(true, true);
        options.allowLateOutOfOrder = true; // otherwise we lose messages
//        options.channelQOS = ChannelQualityOfService.MAX_THROUGHPUT;

        InstrumentMessageSource messageSource;
        if (stream != null) {
            messageSource = timebase.getConnection().select(startTime, options, types, ids, timebase.getStream(stream));
        } else if (qql != null) {
            messageSource = timebase.getConnection().executeQuery(qql, options, null, ids, startTime);
        } else {
            throw new RuntimeException("Unknown message source");
        }

        LOGGER.info().append("Subscribed stream ").append(stream)
                .append(", start time: ").appendTimestamp(startTime)
                .append(", entities: ").append(Arrays.toString(ids))
                .append(", types: ").append(Arrays.toString(types))
                .commit();

        return messageSource;
    }

    public boolean isActive() {
        return active;
    }

    public void reset(long timestamp) {
        if (cursor == null) {
            LOGGER.warn().append("Cursor is not created. Can't reset cursor for stream ").append(stream)
                    .commit();
            return;
        }

        cursor.reset(timestamp);
        LOGGER.info().append("Reset cursor timestamp for streams").append(stream)
            .append(". Reset time: ").appendTimestamp(timestamp).commit();
    }

    @Override
    public void close() {
        if (!active) {
            return;
        }

        active = false;
        LOGGER.info().append("Closing stream consumer for stream ")
                .append(stream).commit();

        if (cursor != null && !cursor.isClosed()) {
            try {
                cursor.close();
            } finally {
                cursor = null;
            }
        }
    }

}
