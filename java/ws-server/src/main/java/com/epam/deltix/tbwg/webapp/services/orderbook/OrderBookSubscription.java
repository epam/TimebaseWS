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
package com.epam.deltix.tbwg.webapp.services.orderbook;

import com.epam.deltix.containers.AlphanumericUtils;
import com.epam.deltix.gflog.api.Log;
import com.epam.deltix.gflog.api.LogFactory;
import com.epam.deltix.timebase.messages.IdentityKey;
import com.epam.deltix.timebase.messages.InstrumentMessage;
import com.epam.deltix.qsrv.hf.pub.TypeLoaderImpl;
import com.epam.deltix.qsrv.hf.tickdb.pub.DXTickStream;
import com.epam.deltix.qsrv.hf.tickdb.pub.SelectionOptions;
import com.epam.deltix.qsrv.hf.tickdb.pub.TickCursor;
import com.epam.deltix.qsrv.hf.tickdb.pub.query.InstrumentMessageSource;
import com.epam.deltix.tbwg.webapp.model.orderbook.L2PackageDto;
import com.epam.deltix.tbwg.webapp.services.timebase.TimebaseService;
import com.epam.deltix.tbwg.webapp.utils.TBWGUtils;
import com.epam.deltix.timebase.messages.MarketMessageInfo;
import com.epam.deltix.timebase.messages.service.RealTimeStartMessage;
import com.epam.deltix.timebase.messages.universal.PackageHeaderInfo;
import com.epam.deltix.util.collections.generated.LongHashSet;
import com.epam.deltix.util.concurrent.UnavailableResourceException;

import java.util.Arrays;
import java.util.Objects;
import java.util.function.Consumer;

public class OrderBookSubscription extends Thread {

    private static final Log LOGGER = LogFactory.getLog(OrderBookSubscription.class);

    private final TimebaseService timebase;
    private final String instrument;
    private final String[] streams;
    private final Consumer<L2PackageDto> consumer;

    private final L2PackageHeaderConverter packageHeaderConverter = new L2PackageHeaderConverter();

    private final L2Resampler resampler;

    private volatile InstrumentMessageSource cursor;
    private volatile boolean closed;

    private volatile LongHashSet hiddenExchanges;

    private volatile boolean isAvailable;

    private final String subscriptionName;

    private volatile long lastTimestamp;

    public OrderBookSubscription(TimebaseService timebase, String instrument, String[] streams, String[] hiddenExchanges,
                                 Consumer<L2PackageDto> consumer)
    {
        this.timebase = timebase;
        this.instrument = instrument;
        this.streams = streams;
        this.consumer = consumer;
        this.resampler = new L2Resampler(instrument);
        this.resampler.addOnDiffComputedListener(this::onResamplerDiff);

        this.subscriptionName = instrument + " " + Arrays.toString(streams);

        updateExchanges(hiddenExchanges);
    }

    @Override
    public void run() {
        try (final InstrumentMessageSource cursor = openCursor()) {
            this.cursor = cursor;
            for (;;) {
                try {
                    if (cursor.next()) {
                        if (closed) {
                            break;
                        }

                        InstrumentMessage message = cursor.getMessage();
                        if (message instanceof RealTimeStartMessage) {
                            setAvailable();
                        } else if (message instanceof MarketMessageInfo && instrument.contentEquals(message.getSymbol())) {
                            try {
                                onMarketMessage((MarketMessageInfo) message);
                            } catch (Throwable t) {
                                LOGGER.error().append("Error during market message processing").append(t).commit();
                            }
                        }
                    } else {
                        break;
                    }
                } catch (UnavailableResourceException e) {
                    continue;
                }
            }
        } catch (Throwable e) {
            if (!closed) {
                LOGGER.error().append("Unexpected error while reading cursor.").append(e).commit();
            }
        } finally {
            close();
        }
    }

    public void updateExchanges(String[] exchanges) {
        if (exchanges == null) {
            this.hiddenExchanges = new LongHashSet();
        } else {
            LongHashSet exchangesSet = new LongHashSet();
            for (int i = 0; i < exchanges.length; ++i) {
                exchangesSet.add(AlphanumericUtils.toAlphanumericUInt64(exchanges[i]));
            }
            this.hiddenExchanges = exchangesSet;
        }
    }

    public void processUpdate() {
        if (isAvailable) {
            sendSnapshot();
        }
    }

    public void close() {
        if (closed) {
            return;
        }

        closed = true;
        LOGGER.info().append(subscriptionName).append(": Closing stream consumer for stream ").commit();

        if (cursor != null && !cursor.isClosed()) {
            try {
                cursor.close();
            } finally {
                cursor = null;
            }
        }
    }

    private void setAvailable() {
        this.isAvailable = true;
        LOGGER.error().append(subscriptionName).append(": Subscription become available.").commit();
    }

    private void onMarketMessage(MarketMessageInfo message) {
        try {
            feedResampler(message);
        } catch (Throwable t) {
            LOGGER.error().append("Error processing package header.").append(t).commit();
        }
    }

    private void feedResampler(MarketMessageInfo message) {
        if (message instanceof PackageHeaderInfo) {
            lastTimestamp = message.getTimeStampMs();
            resampler.process((PackageHeaderInfo) message);
        }
    }

    private void sendSnapshot() {
        consumer.accept(resampler.getFixedBook());
    }

    // resampler logic to be implemented
    private void computeDiff() {
        try {
            resampler.computeDiff(lastTimestamp);
        } catch (Throwable t) {
            LOGGER.error().append(subscriptionName).append(": Failed to send book update.").append(t).commit();
        }
    }

    private void onResamplerDiff(Object prevBook, Object nextBook, Object updates) {
        processPackageHeader((PackageHeaderInfo) updates);
    }

    private void processPackageHeader(PackageHeaderInfo packageHeader) {
        L2PackageDto l2PackageDto = packageHeaderConverter.convertPackageHeader(packageHeader, true, hiddenExchanges);
        if (l2PackageDto.entries.size() == 0) {
            return;
        }

        consumer.accept(l2PackageDto);
    }

    private InstrumentMessageSource openCursor() {
        DXTickStream[] tickStreams = Arrays.stream(streams).map(timebase::getStream)
            .filter(Objects::nonNull)
            .toArray(DXTickStream[]::new);

        SelectionOptions options = new SelectionOptions(false, true);
        options.realTimeNotification = true;
        options.allowLateOutOfOrder = true; // otherwise we lose messages
        options.typeLoader = TypeLoaderImpl.SILENT_INSTANCE;

        long maxTime = Arrays.stream(tickStreams)
            .map(s -> {
                IdentityKey[] identities = TBWGUtils.match(s, instrument);
                return identities.length > 0 ? s.getTimeRange(identities[0]) : s.getTimeRange();
            })
            .filter(Objects::nonNull)
            .filter(r -> r.length == 2)
            .map(r -> r[1])
            .max(Long::compare).orElse(System.currentTimeMillis());

        long time = maxTime - 60000; // todo: move to settings
        TickCursor cursor = timebase.getConnection().select(
            time, options, null, new CharSequence[] { instrument }, tickStreams
        );

        LOGGER.info().append(subscriptionName).append(": Subscribed").commit();

        return cursor;
    }

}
