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
package com.epam.deltix.tbwg.webapp.services.producers;

import com.epam.deltix.containers.AlphanumericUtils;
import com.epam.deltix.dfp.Decimal64Utils;
import com.epam.deltix.timebase.messages.InstrumentMessage;
import com.epam.deltix.timebase.messages.universal.QuoteSide;
import com.epam.deltix.timebase.messages.universal.*;
import com.epam.deltix.util.collections.generated.ObjectArrayList;
import io.reactivex.Observable;
import io.reactivex.subjects.PublishSubject;

import java.util.Random;

public class PackageHeaderMessageGenerator implements MessageProducer {

    private final Runnable run;
    private final Observable<InstrumentMessage> observable;

    private static final String TEST_SYMBOL = "testSymbol";

    public PackageHeaderMessageGenerator(long randomSeed, long startTimestamp, long endTimestamp, long timestampStep,
                                         long countOfEntries, double startPrice, double maxMedianPriceChange,
                                         double maxPriceEntriesDelta) {
        this(randomSeed, startTimestamp, endTimestamp, timestampStep, countOfEntries, startPrice, maxMedianPriceChange, maxPriceEntriesDelta, false);
    }

    public PackageHeaderMessageGenerator(long randomSeed, long startTimestamp, long endTimestamp, long timestampStep,
                                         long countOfEntries, double startPrice, double maxMedianPriceChange,
                                         double maxPriceEntriesDelta, boolean addTrades) {
        Random random = new Random(randomSeed);

        PublishSubject<InstrumentMessage> subject = PublishSubject.create();
        observable = subject;
        run = () -> {
            double medianPrice = startPrice;
            for (long timestamp = startTimestamp; timestamp < endTimestamp; timestamp += timestampStep) {
                PackageHeader message = new PackageHeader();
                message.setPackageType(PackageType.PERIODICAL_SNAPSHOT);
                message.setTimeStampMs(timestamp);
                message.setOriginalTimestamp(timestamp);
                message.setSymbol(TEST_SYMBOL);
                //todo use pool array, reuse all objects
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
                subject.onNext(message);

                if (addTrades) {
                    message = new PackageHeader();
                    message.setPackageType(PackageType.INCREMENTAL_UPDATE);
                    message.setTimeStampMs(timestamp);
                    message.setOriginalTimestamp(timestamp);
                    message.setSymbol(TEST_SYMBOL);

                    entries = new ObjectArrayList<>();

                    TradeEntry entryTrade = new TradeEntry();
                    entryTrade.setSide(random.nextBoolean() ? AggressorSide.BUY : AggressorSide.SELL);
                    entryTrade.setPrice(Decimal64Utils.fromDouble(medianPrice));
                    entryTrade.setSize(Decimal64Utils.fromDouble(random.nextDouble()));
                    entryTrade.setExchangeId(AlphanumericUtils.toAlphanumericUInt64("TEST"));
                    entries.add(entryTrade);

                    message.setEntries(entries);
                    subject.onNext(message);
                }

            }

            subject.onComplete();
        };
    }

    @Override
    public Runnable run() {
        return run;
    }

    @Override
    public Observable<InstrumentMessage> getObservable() {
        return observable;
}

}
