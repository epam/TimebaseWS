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
package com.epam.deltix.tbwg.webapp.services.charting.datasource;

import com.epam.deltix.gflog.api.Log;
import com.epam.deltix.gflog.api.LogFactory;
import com.epam.deltix.qsrv.hf.tickdb.pub.DXTickDB;
import com.epam.deltix.qsrv.hf.tickdb.pub.DXTickStream;
import com.epam.deltix.tbwg.webapp.services.charting.TimeInterval;
import com.epam.deltix.tbwg.webapp.services.timebase.TimebaseRegistry;
import com.epam.deltix.tbwg.webapp.services.timebase.TimebaseService;
import com.epam.deltix.timebase.messages.IdentityKey;
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

    private final TimebaseRegistry registry;

    @Value("${charting.use-interpret-codecs:false}")
    private boolean useInterpretCodecs;

    @Autowired
    public StreamMessageSourceFactory(TimebaseRegistry registry) {
        this.registry = registry;
    }

    @Override
    public ReactiveMessageSource buildSource(TimebaseService service, String streamName, String[] symbols, Set<String> types, TimeInterval interval,
                                             boolean live, boolean unbound) {
        DXTickStream stream = registry.resolve(service).getStream(streamName);
        if (stream == null) {
            throw new IllegalArgumentException("Can't find stream " + streamName);
        }

        DXTickDB db = stream.getDB();
        TimeBaseReactiveMessageSource.Builder builder = TimeBaseReactiveMessageSource.builder(db);

        String[] instruments = findInstruments(stream, symbols);
        builder.time(interval.getStartTimeMilli() - PREFETCH_INTERVAL_MS);
        builder.endTime(interval.getEndTimeMilli() + PREFETCH_INTERVAL_MS);
        builder.typeLoader(MarketDataTypeLoader.getTypeLoader());
        if (useInterpretCodecs) {
            builder.interpreted();
        }
        builder.streams(stream);
        builder.symbols(instruments);
        builder.types(types);
        builder.live(live);
        builder.unbound(unbound);
        builder.realTimeNotifications(true);
        return builder.build();
    }

    @Override
    public ReactiveMessageSource buildSource(TimebaseService service, String qql, TimeInterval interval, boolean live, boolean unbound) {
        return buildSource(service, null, null, qql, interval, live, unbound);
    }

    @Override
    public ReactiveMessageSource buildSource(TimebaseService service, String stream, String[] symbols, String qql, TimeInterval interval, boolean live, boolean unbound) {
        LOGGER.info().append("CHART QQL QUERY: ").append(qql).commit();

        DXTickDB db = registry.resolve(service).getConnection();
        TimeBaseReactiveMessageSource.Builder builder = TimeBaseReactiveMessageSource.builder(db);

        builder.time(interval.getStartTimeMilli());
        builder.endTime(interval.getEndTimeMilli() + PREFETCH_INTERVAL_MS);
        builder.qql(qql);
        builder.unbound(unbound);
        builder.live(live);
        builder.realTimeNotifications(true);
        builder.typeLoader(MarketDataTypeLoader.getTypeLoader());
        if (useInterpretCodecs) {
            builder.interpreted();
        }
        if (stream != null && symbols != null) {
            builder.symbols(findInstruments(service, stream, symbols));
        }

        return builder.build();
    }

    private String[] findInstruments(TimebaseService service, String streamName, String[] symbols) {
        DXTickStream stream = registry.resolve(service).getStream(streamName);
        if (stream == null) {
            throw new IllegalArgumentException("Can't find stream " + streamName);
        }
        return findInstruments(stream, symbols);
    }

    private String[] findInstruments(DXTickStream stream, String[] symbols) {
        IdentityKey[] instruments = stream.listEntities();
        Set<String> symbolsSet = Set.of(symbols);
        List<String> result = new ArrayList<>(symbolsSet.size());
        for (int i = 0; i < instruments.length; ++i) {
            if (symbolsSet.contains(instruments[i].getSymbol().toString())) {
                result.add(instruments[i].getSymbol().toString());
            }
        }
        if (symbols.length != result.size())
            throw new IllegalArgumentException("Can't find symbol '" + Arrays.toString(symbols) + "' in stream '" + stream.getKey() + "'");

        return result.toArray(new String[0]);
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