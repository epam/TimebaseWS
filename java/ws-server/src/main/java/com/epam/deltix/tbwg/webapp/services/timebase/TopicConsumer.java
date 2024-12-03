/*
 * Copyright 2024 EPAM Systems, Inc
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
import com.epam.deltix.qsrv.hf.pub.RawMessage;
import com.epam.deltix.qsrv.hf.tickdb.pub.SelectionOptions;
import com.epam.deltix.qsrv.hf.tickdb.pub.topic.DirectChannel;
import com.epam.deltix.streaming.MessageSource;
import com.epam.deltix.timebase.messages.InstrumentMessage;

import java.util.function.Consumer;

public class TopicConsumer extends MonitorConsumer {

    private static final Log LOGGER = LogFactory.getLog(TopicConsumer.class);

    private final String topicKey;
    private final Consumer<RawMessage> messageConsumer;
    private final TimebaseService timebase;

    private volatile MessageSource<InstrumentMessage> cursor;
    private volatile boolean active = false;

    public TopicConsumer(TimebaseService timebase, String topicKey, Consumer<RawMessage> messageConsumer) {
        this.timebase = timebase;
        this.topicKey = topicKey;
        this.messageConsumer = messageConsumer;
    }

    @Override
    public void run() {
        active = true;
        try (final MessageSource<InstrumentMessage> cursor = openCursor()) {
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

    private MessageSource<InstrumentMessage> openCursor() {
        SelectionOptions options = new SelectionOptions(true, true);
        options.allowLateOutOfOrder = true; // otherwise we lose messages

        DirectChannel topic = timebase.getTopicDB().getTopic(topicKey);
        if (topic == null) {
            LOGGER.info().append("Unknown topic ").append(topicKey).commit();
            throw new RuntimeException("Unknown topic " + topicKey);
        }
        MessageSource<InstrumentMessage> consumer = topic.createConsumer(options);

        LOGGER.info().append("Subscribed on topic ").append(topicKey).commit();
        return consumer;
    }

    public boolean isActive() {
        return active;
    }

    @Override
    public void close() {
        if (!active) {
            return;
        }
        active = false;
        LOGGER.info().append("Closing consumer for topic ").append(topicKey).commit();

        if (cursor != null) {
            try {
                cursor.close();
            } finally {
                cursor = null;
            }
        }
    }

}