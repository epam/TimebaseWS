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

import com.epam.deltix.tbwg.webapp.services.timebase.TimebaseService;
import com.epam.deltix.gflog.api.Log;
import com.epam.deltix.gflog.api.LogFactory;
import com.epam.deltix.tbwg.webapp.utils.DefaultTypeLoader;
import com.epam.deltix.timebase.messages.IdentityKey;
import com.epam.deltix.qsrv.hf.tickdb.pub.DXTickDB;
import com.epam.deltix.qsrv.hf.tickdb.pub.DXTickStream;
import com.epam.deltix.tbwg.webapp.services.charting.TimeInterval;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

import java.util.*;

@Profile("default")
@Service
public class StreamMessageSourceFactory implements MessageSourceFactory {

    private static final Log LOGGER = LogFactory.getLog(StreamMessageSourceFactory.class);

    private final long PREFETCH_INTERVAL_MS = 60 * 1000;

    private final TimebaseService timebase;

    @Value("${charting.use-interpret-codecs:false}")
    private boolean useInterpretCodecs;

    @Autowired
    public StreamMessageSourceFactory(TimebaseService timebase) {
        this.timebase = timebase;
    }

    @Override
    public ReactiveMessageSource buildSource(String streamName, String symbol, Set<String> types, TimeInterval interval,
                                             boolean live, boolean unbound) {
        DXTickStream stream = timebase.getStream(streamName);
        if (stream == null) {
            throw new IllegalArgumentException("Can't find stream " + streamName);
        }

        DXTickDB db = stream.getDB();
        TimeBaseReactiveMessageSource.Builder builder = TimeBaseReactiveMessageSource.builder(db);

        builder.time(interval.getStartTimeMilli() - PREFETCH_INTERVAL_MS);
        builder.endTime(interval.getEndTimeMilli() + PREFETCH_INTERVAL_MS);
        builder.typeLoader(new DefaultTypeLoader());
        if (useInterpretCodecs) {
            builder.interpreted();
        }
        builder.streams(stream);
        builder.symbols(symbol);
        builder.types(types);
        builder.live(live);
        builder.unbound(unbound);
        builder.realTimeNotifications(true);
        return builder.build();
    }

    @Override
    public ReactiveMessageSource buildSource(String qql, TimeInterval interval, boolean live, boolean unbound) {
        return buildSource(null, null, qql, interval, live, unbound);
    }

    @Override
    public ReactiveMessageSource buildSource(String stream, String symbol, String qql, TimeInterval interval, boolean live, boolean unbound) {
        LOGGER.info().append("CHART QQL QUERY: ").append(qql).commit();

        DXTickDB db = timebase.getConnection();
        TimeBaseReactiveMessageSource.Builder builder = TimeBaseReactiveMessageSource.builder(db);

        builder.time(interval.getStartTimeMilli());
        builder.endTime(interval.getEndTimeMilli() + PREFETCH_INTERVAL_MS);
        builder.qql(qql);
        builder.unbound(unbound);
        builder.live(live);
        builder.realTimeNotifications(true);
        builder.typeLoader(new DefaultTypeLoader());
        if (useInterpretCodecs) {
            builder.interpreted();
        }
        if (stream != null && symbol != null) {
            builder.symbols(symbol);
        }

        return builder.build();
    }

    private IdentityKey findInstrument(String streamName, String symbol) {
        DXTickStream stream = timebase.getStream(streamName);
        if (stream == null) {
            throw new IllegalArgumentException("Can't find stream " + streamName);
        }

        IdentityKey[] instruments = stream.listEntities();
        for (int i = 0; i < instruments.length; ++i) {
            if (instruments[i].getSymbol().toString().equals(symbol)) {
                return instruments[i];
            }
        }

        throw new IllegalArgumentException("Can't find symbol '" + symbol + "' in stream '" + stream.getKey() + "'");
    }
    private IdentityKey findInstrument(DXTickStream stream, String symbol) {
        IdentityKey[] instruments = stream.listEntities();
        for (int i = 0; i < instruments.length; ++i) {
            if (instruments[i].getSymbol().toString().equals(symbol)) {
                return instruments[i];
            }
        }

        throw new IllegalArgumentException("Can't find symbol '" + symbol + "' in stream '" + stream.getKey() + "'");
    }

}
