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

package com.epam.deltix.tbwg.webapp.services.charting.datasource;

import com.epam.deltix.gflog.api.Log;
import com.epam.deltix.gflog.api.LogFactory;
import com.epam.deltix.timebase.messages.IdentityKey;
import com.epam.deltix.timebase.messages.InstrumentMessage;
import com.epam.deltix.qsrv.hf.tickdb.pub.TickStream;
import com.epam.deltix.qsrv.hf.tickdb.pub.query.InstrumentMessageSource;
import com.epam.deltix.util.lang.Disposable;
import io.reactivex.subjects.PublishSubject;

public class TimebaseDataSource implements Runnable, Disposable {

    private static final Log LOGGER = LogFactory.getLog(TimebaseDataSource.class);

    private final TimeBaseReactiveMessageSource.Builder builder;
    private final PublishSubject<InstrumentMessage> subject;

    private final long endTime;

    private InstrumentMessageSource source;
    private volatile boolean closed;

    public TimebaseDataSource(TimeBaseReactiveMessageSource.Builder builder, PublishSubject<InstrumentMessage> subject) {
        this.builder = builder;
        this.subject = subject;
        this.endTime = builder.endTime;
    }

    @Override
    public void run() {
        long cnt = 0;
        try {
            initSource();
            while (source.next()) {
                final InstrumentMessage message = source.getMessage();
                if (message.getTimeStampMs() > endTime) {
                    break;
                }
                subject.onNext(message);
                cnt++;
            }
        } catch (Throwable t) {
            if (closed) {
                LOGGER.info().append("Data source was closed gracefully").commit();
            } else {
                LOGGER.error().append("Data source failed").append(t).commit();
                throw t;
            }
        } finally {
            LOGGER.debug().append("Read ").append(cnt).append(" from data source").commit();
            close();
            subject.onComplete();
        }
    }

    private synchronized void initSource() {
        if (source != null) {
            throw new RuntimeException("Can't be ran twice");
        }

        if (closed) {
            throw new RuntimeException("Data source was closed");
        }

        TickStream[] streams = builder.streams != null ? builder.streams.toArray(new TickStream[0]) : null;
        String[] messageTypes = builder.messageTypes != null ? builder.messageTypes.toArray(new String[0]) : null;
        String[] identities = builder.identities != null ? builder.identities.toArray(new String[0]) : null;

        if (builder.qql == null) {
            source = builder.tickDB.select(builder.time, builder.options, messageTypes, identities, streams);
        } else {
            source = builder.tickDB.executeQuery(builder.qql, builder.options, streams, identities, builder.time);

            // support for restricted subscribersByType
            if (messageTypes != null) {
                source.setTypes(messageTypes);
            }
        }
    }

    @Override
    public synchronized void close() {
        try {
            if (source != null && !closed) {
                LOGGER.info().append("closed").commit();
                closed = true;
                source.close();
            }
        } catch (Throwable t) {
            LOGGER.warn().append("Failed to close data source").append(t).commit();
        }
    }

}
