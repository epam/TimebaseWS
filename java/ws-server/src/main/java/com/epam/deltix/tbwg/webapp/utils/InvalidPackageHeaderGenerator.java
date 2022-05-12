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
package com.epam.deltix.tbwg.webapp.utils;

import com.epam.deltix.containers.AlphanumericUtils;
import com.epam.deltix.dfp.Decimal64Utils;
import com.epam.deltix.gflog.api.Log;
import com.epam.deltix.gflog.api.LogFactory;
import com.epam.deltix.qsrv.hf.tickdb.pub.*;
import com.epam.deltix.timebase.messages.universal.BookUpdateAction;
import com.epam.deltix.timebase.messages.universal.QuoteSide;
import com.epam.deltix.timebase.messages.universal.*;
import com.epam.deltix.util.collections.generated.ObjectArrayList;

import java.util.Random;

public class InvalidPackageHeaderGenerator {

    private static final Log LOGGER = LogFactory.getLog(InvalidPackageHeaderGenerator.class);

    private static final Random random = new Random();

    public static void main(String[] args) {
        try (DXTickDB db = TickDBFactory.openFromUrl("dxtick://localhost:8102", false)) {
            DXTickStream stream = getOrCreateStream(db, "invalid_package_headers", PackageHeader.class);
            try (TickLoader loader = stream.createLoader()) {
                boolean addUpdates = true;

                double medianPrice = 10000;
                double maxMedianPriceChange = 100;
                double maxPriceEntriesDelta = 100;
                int countOfEntries = 20;
                int maxUpdates = 10;

                long startTimestampMs = System.currentTimeMillis();
                long[] range = stream.getTimeRange();
                if (range != null && range[1] != Long.MIN_VALUE) {
                    startTimestampMs = range[1];
                }
                long endTimestampMs = startTimestampMs + 1000 * 60 * 60 * 24;

                String symbol = "AAPL";

                long timestampDelta = 500;
                for (long timestamp = startTimestampMs; timestamp < endTimestampMs; timestamp += timestampDelta) {
                    PackageHeader message = new PackageHeader();
                    message.setPackageType(PackageType.PERIODICAL_SNAPSHOT);
                    message.setTimeStampMs(timestamp);
                    message.setOriginalTimestamp(timestamp);
                    message.setSymbol(symbol);

                    ObjectArrayList<BaseEntryInfo> entries = new ObjectArrayList<>();
                    medianPrice += maxMedianPriceChange * random.nextDouble() - maxMedianPriceChange / 2;
                    for (int i = 0; i < countOfEntries; i++) {
                        L2EntryNew entryL2 = new L2EntryNew();
                        entryL2.setLevel((short) i);
                        entryL2.setSide(QuoteSide.BID);
                        entryL2.setPrice(Decimal64Utils.fromDouble(medianPrice + maxPriceEntriesDelta * (countOfEntries - i) / (countOfEntries)));
                        entryL2.setSize(Decimal64Utils.fromDouble(random.nextDouble()));
                        entryL2.setExchangeId(AlphanumericUtils.toAlphanumericUInt64("TEST"));
                        entries.add(entryL2);
                    }

                    for (int i = 0; i < countOfEntries; i++) {
                        L2EntryNew entryL2 = new L2EntryNew();
                        entryL2.setLevel((short) i);
                        entryL2.setSide(QuoteSide.ASK);
                        entryL2.setPrice(Decimal64Utils.fromDouble(medianPrice - maxPriceEntriesDelta * i / (countOfEntries)));
                        entryL2.setSize(Decimal64Utils.fromDouble(random.nextDouble()));
                        entryL2.setExchangeId(AlphanumericUtils.toAlphanumericUInt64("TEST"));
                        entries.add(entryL2);
                    }

                    message.setEntries(entries);
                    loader.send(message);

                    if (addUpdates) {
                        int updates = random.nextInt(maxUpdates);
                        for (int i = 0; i < updates; ++i) {
                            long updateTimestamp = timestamp + i * (timestampDelta - 1) / updates;
                            PackageHeader updateMessage = new PackageHeader();
                            updateMessage.setPackageType(PackageType.INCREMENTAL_UPDATE);
                            updateMessage.setTimeStampMs(updateTimestamp);
                            updateMessage.setOriginalTimestamp(updateTimestamp);
                            updateMessage.setSymbol(symbol);


                            ObjectArrayList<BaseEntryInfo> updateEntries = new ObjectArrayList<>();
                            for (int j = 0; j < random.nextInt(3) + 1; j++) {
                                L2EntryUpdate entryUpdate = new L2EntryUpdate();
                                entryUpdate.setLevel((short) random.nextInt(countOfEntries));
                                entryUpdate.setSide(random.nextBoolean() ? QuoteSide.BID : QuoteSide.ASK);
                                entryUpdate.setAction(BookUpdateAction.valueOf(random.nextInt(BookUpdateAction.values().length)));
                                entryUpdate.setPrice(Decimal64Utils.fromDouble(medianPrice + maxPriceEntriesDelta * (countOfEntries - i) / (countOfEntries)));
                                entryUpdate.setSize(Decimal64Utils.fromDouble(random.nextDouble()));
                                entryUpdate.setExchangeId(AlphanumericUtils.toAlphanumericUInt64("TEST"));
                                updateEntries.add(entryUpdate);
                            }

                            updateMessage.setEntries(updateEntries);
                            loader.send(updateMessage);
                        }
                    }


//                    if (addTrades) {
//                        message = new PackageHeader();
//                        message.setPackageType(PackageType.INCREMENTAL_UPDATE);
//                        message.setTimeStampMs(timestamp);
//                        message.setOriginalTimestamp(timestamp);
//                        message.setCurrencyCode((short) 999);
//                        message.setSymbol(TEST_SYMBOL);
//                        message.setInstrumentType(InstrumentType.CUSTOM);
//
//                        entries = new ObjectArrayList<>();
//
//                        TradeEntry entryTrade = new TradeEntry();
//                        entryTrade.setSide(random.nextBoolean() ? AggressorSide.BUY : AggressorSide.SELL);
//                        entryTrade.setPrice(Decimal64Utils.fromDouble(medianPrice));
//                        entryTrade.setSize(Decimal64Utils.fromDouble(random.nextDouble()));
//                        entryTrade.setExchangeId(AlphanumericCodec.encode("TEST"));
//                        entries.add(entryTrade);
//
//                        message.setEntries(entries);
//
//                    }

                }
            }
        }
    }

    public static DXTickStream getOrCreateStream(DXTickDB db, String key, Class<?>... classes) {
        return getOrCreateStream(db, key, StreamScope.DURABLE, classes);
    }

    public static DXTickStream getOrCreateStream(DXTickDB db, String key, StreamScope scope, Class<?>... classes) {
        DXTickStream stream = db.getStream(key);
        if (stream == null) {
            LOGGER.info().append("Stream ").append(key).append(" not found.").commit();
            LOGGER.info("Creating new stream.");
            StreamOptions options = new StreamOptions(scope, key, "", 1);
            options.setPolymorphic(TimeBaseUtils.introspectClasses(classes));
            stream = db.createStream(key, options);
            LOGGER.info().append("Stream ").append(key).append(" created.").commit();
        } else {
            LOGGER.info("Found stream: " + key);
        }
        return stream;
    }

}
