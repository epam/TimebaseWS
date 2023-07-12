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

import com.epam.deltix.common.orderbook.MarketSide;
import com.epam.deltix.common.orderbook.OrderBook;
import com.epam.deltix.common.orderbook.OrderBookQuote;
import com.epam.deltix.common.orderbook.impl.OrderBookFactory;
import com.epam.deltix.common.orderbook.options.OrderBookOptionsBuilder;
import com.epam.deltix.common.orderbook.options.OrderBookType;
import com.epam.deltix.common.orderbook.options.UpdateMode;
import com.epam.deltix.containers.AlphanumericUtils;
import com.epam.deltix.tbwg.webapp.model.orderbook.*;
import com.epam.deltix.gflog.api.Log;
import com.epam.deltix.gflog.api.LogFactory;
import com.epam.deltix.qsrv.hf.pub.ChannelQualityOfService;
import com.epam.deltix.tbwg.webapp.utils.DefaultTypeLoader;
import com.epam.deltix.timebase.messages.IdentityKey;
import com.epam.deltix.qsrv.hf.tickdb.pub.DXTickStream;
import com.epam.deltix.qsrv.hf.tickdb.pub.SelectionOptions;
import com.epam.deltix.qsrv.hf.tickdb.pub.TickCursor;

import com.epam.deltix.tbwg.webapp.services.timebase.TimebaseService;
import com.epam.deltix.tbwg.webapp.services.timebase.exc.NoStreamsException;
import com.epam.deltix.timebase.messages.*;
import com.epam.deltix.timebase.messages.universal.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.*;

import static com.epam.deltix.tbwg.webapp.utils.TBWGUtils.match;

@Service
public class OrderBookDebuggerImpl implements OrderBookDebugger {

    private static final Log LOGGER = LogFactory.getLog(OrderBookDebuggerImpl.class);

    private static final String SNAPSHOT_NOT_FOUND_ERROR = "Initial snapshot not found for symbol '%s'. Order book cannot be built.";
    private static final String PACKAGE_HEADER_NOT_FOUND_ERROR = "Package Header messages not found for symbol '%s'. Order book cannot be built.";
    private static final String ORDER_BOOK_IS_EMPTY_ERROR = "Order book is empty.";

    @Value("${order-book-debugger.snapshot-lookup-ms:60000}")
    private long snapshotLookupMs;

    private final TimebaseService timebase;

    public OrderBookDebuggerImpl(TimebaseService timebase) {
        this.timebase = timebase;
    }

    @Override
    public L2PackageDto snapshot(OrderBookSnapshotRequest request) throws NoStreamsException {
        if (request.isReverse()) {
            return reverseSnapshot(
                request.getStreams(), request.getSymbol(), request.getFrom(),
                request.getOffset(), request.getTypes(), request.getSymbols(), request.getSpace()
            );
        } else {
            return snapshot(
                request.getStreams(), request.getSymbol(), request.getFrom(),
                request.getOffset(), request.getTypes(), request.getSymbols(), request.getSpace()
            );
        }
    }

    private L2PackageDto snapshot(String[] streamKeys, String symbol, long startTime, long offset,
                                  String[] types, String[] symbols, String space)
    {
        boolean snapshotFound = false;
        boolean packageHeaderFound = false;
        long from = startTime == Long.MIN_VALUE ? Long.MIN_VALUE : startTime - snapshotLookupMs;
        try (TickCursor cursor = select(streamKeys, symbols, from, types, space, false)) {
            OrderBook<OrderBookQuote> book = createOrderBook(symbol);

            long currentOffset = -1;
            while (cursor.next()) {
                InstrumentMessage message = cursor.getMessage();
                if (currentOffset < 0) {
                    if (message.getTimeStampMs() >= startTime) {
                        currentOffset = 0;
                    }
                } else {
                    currentOffset++;
                }

                if (message instanceof PackageHeaderInfo && symbol.equals(message.getSymbol().toString())) {
                    packageHeaderFound = true;
                    PackageHeaderInfo packageHeader = (PackageHeaderInfo) message;
                    if (packageHeader.getPackageType() != PackageType.INCREMENTAL_UPDATE) {
                        snapshotFound = true;
                        ((PackageHeader) packageHeader).setPackageType(PackageType.VENDOR_SNAPSHOT);
                    }

                    book.update(packageHeader);
                }

                if (currentOffset >= offset) {
                    L2PackageDto snapshot = buildBook(message.getTimeStampMs(), book);
                    if (!packageHeaderFound) {
                        snapshot.error = String.format(PACKAGE_HEADER_NOT_FOUND_ERROR, symbol);
                    } else if (!snapshotFound) {
                        snapshot.error = String.format(SNAPSHOT_NOT_FOUND_ERROR, symbol);
                    } else if (snapshot.entries.size() == 0) {
                        snapshot.error = ORDER_BOOK_IS_EMPTY_ERROR;
                    }

                    return snapshot;
                }
            }
        } catch (Throwable t) {
            LOGGER.error().append("Failed to build order book").append(t).commit();

            L2PackageDto snapshot = buildBook(startTime, createOrderBook(symbol));
            snapshot.error = t.getMessage();
            return snapshot;
        }

        L2PackageDto snapshot = buildBook(startTime, createOrderBook(symbol));
        snapshot.error = String.format(PACKAGE_HEADER_NOT_FOUND_ERROR, symbol);
        return snapshot;
    }

    private L2PackageDto reverseSnapshot(String[] streamKeys, String symbol, long startTime, long offset,
                                         String[] types, String[] symbols, String space)
    {
        boolean snapshotFound = false;
        List<PackageHeaderInfo> messages = new ArrayList<>();
        long messageTimestamp = Long.MIN_VALUE;
        try (TickCursor cursor = select(streamKeys, symbols, startTime, types, space, true)) {
            int currentOffset = 0;
            while (cursor.next()) {
                InstrumentMessage message = cursor.getMessage();

                if (currentOffset >= offset) {
                    if (messageTimestamp == Long.MIN_VALUE) {
                        messageTimestamp = message.getTimeStampMs();
                    }

                    if (message instanceof PackageHeaderInfo && symbol.equals(message.getSymbol().toString())) {
                        PackageHeaderInfo packageHeader = (PackageHeaderInfo) message;
                        messages.add(packageHeader.clone());
                        if (packageHeader.getPackageType() != PackageType.INCREMENTAL_UPDATE) {
                            snapshotFound = true;
                        }
                    }

                    if (messageTimestamp - message.getTimeStampMs() > snapshotLookupMs) {
                        break;
                    }
                }

                currentOffset++;
            }

            if (snapshotFound) {
                OrderBook<OrderBookQuote> book = createOrderBook(symbol);
                for (int i = messages.size() - 1; i >= 0; --i) {
                    if (messages.get(i).getPackageType() != PackageType.INCREMENTAL_UPDATE) {
                        ((PackageHeader) messages.get(i)).setPackageType(PackageType.VENDOR_SNAPSHOT);
                    }

                    book.update(messages.get(i));
                }

                L2PackageDto snapshot = buildBook(messages.get(0).getTimeStampMs(), book);
                if (snapshot.entries.size() == 0) {
                    snapshot.error = ORDER_BOOK_IS_EMPTY_ERROR;
                }
                return snapshot;
            }
        } catch (Throwable t) {
            LOGGER.error().append("Failed to build order book").append(t).commit();

            L2PackageDto snapshot = buildBook(startTime, createOrderBook(symbol));
            snapshot.error = t.getMessage();
            return snapshot;
        }

        L2PackageDto snapshot = buildBook(startTime, createOrderBook(symbol));
        snapshot.error = messages.size() > 0 ?
            String.format(SNAPSHOT_NOT_FOUND_ERROR, symbol) :
            String.format(PACKAGE_HEADER_NOT_FOUND_ERROR, symbol);
        return snapshot;
    }

    private L2PackageDto buildBook(long timestamp, OrderBook<OrderBookQuote> book) {
        L2PackageDto packageDto = new L2PackageDto();
        packageDto.timestamp = timestamp;
        packageDto.setSecurityId(book.getSymbol().orElse(""));
        packageDto.type = L2PackageType.SNAPSHOT_FULL_REFRESH;
        packageDto.entries = new ArrayList<>();

        Arrays.asList(new QuoteSide[]{ QuoteSide.ASK, QuoteSide.BID }).forEach(quoteSide -> {
            MarketSide<OrderBookQuote> side = book.getMarketSide(quoteSide);
            for (short i = 0; i < side.depth(); ++i) {
                OrderBookQuote quote = side.getQuote(i);

                L2EntryDto l2Entry = new L2EntryDto();
                l2Entry.action = L2Action.INSERT;
                l2Entry.level = i;
                l2Entry.setPrice(quote.getPrice());
                l2Entry.setQuantity(quote.getSize());
                l2Entry.side = quoteSide == QuoteSide.BID ? Side.BUY : Side.SELL;
                l2Entry.alphanumericExchangeId = quote.getExchangeId();
                try {
                    l2Entry.exchangeId = AlphanumericUtils.toString(l2Entry.alphanumericExchangeId);
                } catch (Throwable t) {
                    l2Entry.exchangeId = null;
                }

                packageDto.entries.add(l2Entry);
            }
        });

        return packageDto;
    }

    private TickCursor select(String[] streamKeys, String[] symbols, long startTime,
                              String[] types, String space, boolean reverse) throws NoStreamsException
    {
        List<DXTickStream> streams = getStreams(streamKeys);

        SelectionOptions options = new SelectionOptions();
        options.channelQOS = ChannelQualityOfService.MIN_INIT_TIME;
        options.reversed = reverse;
        options.raw = false;
        options.withSpaces(space);
        options.typeLoader = new DefaultTypeLoader();

        return timebase.getConnection().select(startTime, options, types, getInstrument(streams, symbols),
            streams.toArray(new DXTickStream[streams.size()]));
    }

    private List<DXTickStream> getStreams(String... streamKeys) throws NoStreamsException {
        if (streamKeys == null || streamKeys.length == 0) {
            throw new NoStreamsException();
        }

        List<DXTickStream> streams = new ArrayList<>(streamKeys.length);
        for (String key : streamKeys) {
            DXTickStream stream = timebase.getStream(key);
            if (stream != null)
                streams.add(stream);
        }

        if (streams.isEmpty()) {
            throw new NoStreamsException(streamKeys);
        }

        return streams;
    }

    private IdentityKey[] getInstrument(List<DXTickStream> streams, String[] symbols) {
        if (symbols == null) {
            return null;
        }

        HashSet<IdentityKey> instruments = new HashSet<>();
        for (DXTickStream stream : streams) {
            Collections.addAll(instruments, match(stream, symbols));
        }

        return instruments.toArray(new IdentityKey[instruments.size()]);
    }

    private OrderBook<OrderBookQuote> createOrderBook(String symbol) {
        return OrderBookFactory.create(
            new OrderBookOptionsBuilder()
                .symbol(symbol)
                .orderBookType(OrderBookType.SINGLE_EXCHANGE)
                .updateMode(UpdateMode.WAITING_FOR_SNAPSHOT)
                .quoteLevels(DataModelType.LEVEL_TWO)
                .build()
        );
    }
}
