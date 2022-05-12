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
package com.epam.deltix.tbwg.webapp.services.charting.datasource;

import com.epam.deltix.qsrv.hf.pub.ChannelQualityOfService;
import com.epam.deltix.timebase.messages.IdentityKey;
import com.epam.deltix.timebase.messages.InstrumentMessage;
import com.epam.deltix.qsrv.hf.pub.TypeLoader;
import com.epam.deltix.qsrv.hf.pub.md.ClassDescriptor;
import com.epam.deltix.qsrv.hf.tickdb.pub.DXTickDB;
import com.epam.deltix.qsrv.hf.tickdb.pub.SelectionOptions;
import com.epam.deltix.qsrv.hf.tickdb.pub.TickStream;
import com.epam.deltix.qsrv.hf.tickdb.pub.TimeConstants;
import io.reactivex.Observable;
import io.reactivex.subjects.PublishSubject;

import java.util.*;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.stream.Collectors;

public class TimeBaseReactiveMessageSource implements ReactiveMessageSource {
    private final AtomicBoolean isRun = new AtomicBoolean();

    private final TimebaseDataSource dataSource;
    private final Observable<InstrumentMessage> observable;

    private TimeBaseReactiveMessageSource(TimebaseDataSource dataSource, Observable<InstrumentMessage> observable) {
        this.dataSource = dataSource;
        this.observable = observable;
    }

    @Override
    public void run() {
        if (!isRun.compareAndSet(false, true)) {
            throw new IllegalStateException("Query already run");
        }

        dataSource.run();
    }

    @Override
    public Observable<InstrumentMessage> getMessageSource() {
        return observable;
    }

    @Override
    public void close() {
        dataSource.close();
    }

    public static Builder builder(DXTickDB tickDB) {
        Builder builder = new Builder();
        builder.tickDB = tickDB;
        builder.options = new SelectionOptions();

        return builder;
    }

    public static class Builder {

        DXTickDB tickDB;

        List<TickStream> streams;
        List<String> messageTypes;
        List<String> identities;
        long time = TimeConstants.TIMESTAMP_UNKNOWN;
        SelectionOptions options;

        String qql;

        private Builder() {
        }

        public Builder typeLoader(TypeLoader typeLoader) {
            options.typeLoader = typeLoader;
            return this;
        }

        public Builder interpreted() {
            options.channelQOS = ChannelQualityOfService.MIN_INIT_TIME;
            return this;
        }

        public Builder compiled() {
            options.channelQOS = ChannelQualityOfService.MAX_THROUGHPUT;
            return this;
        }

        public Builder live(boolean isLive) {
            options.live = isLive;
            return this;
        }

        public Builder unbound(boolean isUnbound) {
            options.raw = isUnbound;
            return this;
        }

        public Builder reversed(boolean isReversed) {
            options.reversed = isReversed;
            return this;
        }

        public Builder time(long time) {
            this.time = time;
            return this;
        }

        public Builder reversed() {
            this.options.reversed = true;
            return this;
        }

        public Builder qql(String qql) {
            this.qql = qql;
            return this;
        }

        public Builder streams(TickStream... streams) {
            this.streams = Arrays.asList(streams);
            return this;
        }

        public Builder streams(String... streams) {
            this.streams = Arrays.stream(streams).map(tickDB::getStream).filter(Objects::nonNull).collect(Collectors.toList());
            return this;
        }

        public Builder streams(Collection<TickStream> streams) {
            this.streams = new ArrayList<>(streams);
            return this;
        }

        public Builder symbols(String ... identities) {
            this.identities = Arrays.asList(identities);
            return this;
        }

//        public Builder symbols(Collection<IdentityKey> identities) {
//            this.identities = new ArrayList<>(identities);
//            return this;
//        }

        public Builder types(Class... messageTypes) {
            this.messageTypes = Arrays.stream(messageTypes).map(ClassDescriptor::getClassNameWithAssembly).collect(Collectors.toList());
            return this;
        }

        public Builder types(String... messageTypes) {
            this.messageTypes = Arrays.asList(messageTypes);
            return this;
        }

        public Builder types(Collection<String> messageTypes) {
            this.messageTypes = new ArrayList<>(messageTypes);
            return this;
        }

        public TimeBaseReactiveMessageSource build() {
            PublishSubject<InstrumentMessage> subject = PublishSubject.create();
            return new TimeBaseReactiveMessageSource(new TimebaseDataSource(this, subject), subject);
        }
    }
}

