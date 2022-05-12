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

import com.epam.deltix.tbwg.webapp.model.orderbook.*;
import com.epam.deltix.dfp.Decimal64Utils;

import com.epam.deltix.tbwg.webapp.utils.ArrayPoolUtils;
import com.epam.deltix.tbwg.webapp.utils.ExchangeResolver;
import com.epam.deltix.timebase.messages.universal.BookUpdateAction;
import com.epam.deltix.timebase.messages.universal.QuoteSide;
import com.epam.deltix.timebase.messages.universal.*;
import com.epam.deltix.util.collections.generated.LongHashSet;
import com.epam.deltix.util.collections.generated.ObjectList;

import java.util.ArrayList;
import java.util.List;

public class L2PackageHeaderConverter {

    private final ArrayPoolUtils<L2EntryDto> pool = new ArrayPoolUtils<>(L2EntryDto::new);
    private final ExchangeResolver nameResolver = new ExchangeResolver();
    private final L2PackageDto packageDto = new L2PackageDto();

    public L2PackageHeaderConverter() {
        packageDto.entries = new ArrayList<>();
        packageDto.sequenceNumber = System.currentTimeMillis();
    }

    public L2PackageDto getLastPackage() {
        return packageDto;
    }

    public L2PackageDto convertPackageHeader(PackageHeaderInfo packageHeader, boolean showExchangeId, LongHashSet hiddenExchanges) {
        packageDto.timestamp = packageHeader.getTimeStampMs();
        packageDto.setSecurityId(packageHeader.getSymbol().toString());
        packageDto.type = createL2PackageType(packageHeader.getPackageType());
//        packageDto.sequenceNumber = packageHeader.getSequenceNumber();
        packageDto.entries.clear();

        ObjectList<BaseEntryInfo> entries = packageHeader.getEntries();
        if (entries != null && entries.size() > 0) {
            for (int i = 0; i < entries.size(); ++i) {
                if (!hiddenExchanges.contains(entries.get(i).getExchangeId())) {
                    addL2EntryDto(packageDto.entries, entries.get(i), i, showExchangeId);
                }
            }
        }

        return packageDto;
    }

    private void addL2EntryDto(List<L2EntryDto> ret, BaseEntryInfo entry, int n, boolean showExchangeId) {
        if (entry instanceof L2EntryNewInfo) {
            L2EntryNewInfo l2EntryNewInfo = (L2EntryNewInfo) entry;

            L2EntryDto l2Entry = pool.getL2Entry(n);
            l2Entry.action = L2Action.INSERT;
            l2Entry.level = l2EntryNewInfo.getLevel();
            l2Entry.setPrice(l2EntryNewInfo.getPrice());
            l2Entry.setQuantity(l2EntryNewInfo.getSize());
            l2Entry.side = createSideForL2Entry(l2EntryNewInfo.getSide());
            l2Entry.alphanumericExchangeId = l2EntryNewInfo.getExchangeId();
            if (showExchangeId) {
                l2Entry.exchangeId = nameResolver.resolve(l2EntryNewInfo.getExchangeId());
            } else {
                l2Entry.exchangeId = null;
            }
            ret.add(l2Entry);
        } else if (entry instanceof L2EntryUpdateInfo) {
            L2EntryUpdateInfo l2EntryNewInfo = (L2EntryUpdateInfo) entry;

            L2EntryDto l2Entry = pool.getL2Entry(n);
            l2Entry.action = createL2ActionDto(l2EntryNewInfo.getAction());
            l2Entry.level = l2EntryNewInfo.getLevel();
            l2Entry.setPrice(l2EntryNewInfo.getPrice());
            l2Entry.setQuantity(l2EntryNewInfo.getSize());
            l2Entry.side = createSideForL2Entry(l2EntryNewInfo.getSide());
            l2Entry.alphanumericExchangeId = l2EntryNewInfo.getExchangeId();
            if (showExchangeId) {
                l2Entry.exchangeId = nameResolver.resolve(l2EntryNewInfo.getExchangeId());
            } else {
                l2Entry.exchangeId = null;
            }
            ret.add(l2Entry);
        } else if (entry instanceof BookResetEntry) {
            BookResetEntry bookResetEntry = (BookResetEntry) entry;

            L2EntryDto buyL2Entry = pool.getL2Entry(n);
            buyL2Entry.action = L2Action.DELETE_FROM;
            buyL2Entry.level = (short) 0;
            buyL2Entry.side = Side.BUY;
            buyL2Entry.alphanumericExchangeId = bookResetEntry.getExchangeId();
            if (showExchangeId) {
                buyL2Entry.exchangeId = nameResolver.resolve(bookResetEntry.getExchangeId());
            } else {
                buyL2Entry.exchangeId = null;
            }
            buyL2Entry.setPrice(Decimal64Utils.NULL);
            buyL2Entry.setQuantity(Decimal64Utils.NULL);
            ret.add(buyL2Entry);

            L2EntryDto sellL2Entry = new L2EntryDto();
            sellL2Entry.action = L2Action.DELETE_FROM;
            sellL2Entry.level = (short) 0;
            sellL2Entry.side = Side.SELL;
            sellL2Entry.alphanumericExchangeId = bookResetEntry.getExchangeId();
            if (showExchangeId) {
                sellL2Entry.exchangeId = nameResolver.resolve(bookResetEntry.getExchangeId());
            } else {
                sellL2Entry.exchangeId = null;
            }
            sellL2Entry.setPrice(Decimal64Utils.NULL);
            sellL2Entry.setQuantity(Decimal64Utils.NULL);
            ret.add(sellL2Entry);
        }
//        else if (entry instanceof TradeEntry) {
//            TradeEntry tradeEntry = (TradeEntry) entry;
//
//            L2EntryDto l2Entry = pool.getL2Entry(n);
//            l2Entry.action = L2Action.TRADE;
//            l2Entry.level = null;
//            l2Entry.price = Decimal64Utils.toString(tradeEntry.getPrice()); // todo: allocation
//            l2Entry.quantity = Decimal64Utils.toString(tradeEntry.getSize()); // todo: allocation
//            l2Entry.side = createSideForL2Entry(tradeEntry.getSide());
//            l2Entry.numberOfOrders = tradeEntry.getBuyerNumberOfOrders() + tradeEntry.getSellerNumberOfOrders();
//            if (showExchangeId) {
//                l2Entry.exchangeId = AlphanumericUtils.toString(tradeEntry.getExchangeId());
//            } else {
//                l2Entry.exchangeId = null;
//            }
//            ret.add(l2Entry);
//        }
    }

    private static L2PackageType createL2PackageType(PackageType packageType) {
        if (packageType == null)
            return null;

        switch (packageType) {
            case VENDOR_SNAPSHOT:
            case PERIODICAL_SNAPSHOT:
                return L2PackageType.SNAPSHOT_FULL_REFRESH;

            case INCREMENTAL_UPDATE:
                return L2PackageType.INCREMENTAL_UPDATE;
        }

        throw new IllegalArgumentException("Unsupported package type: " + packageType);
    }

    private static L2Action createL2ActionDto(BookUpdateAction action) {
        if (action == null)
            return null;

        switch (action) {
            case INSERT:
                return L2Action.INSERT;

            case UPDATE:
                return L2Action.UPDATE;

            case DELETE:
                return L2Action.DELETE;
        }

        throw new IllegalArgumentException("Unsupported book update action: " + action);
    }

    private static Side createSideForL2Entry(QuoteSide side) {
        switch (side) {
            case BID:
                return Side.BUY;

            case ASK:
                return Side.SELL;
        }

        throw new IllegalArgumentException("Unsupported quote side: " + side);
    }

    private static Side createSideForL2Entry(AggressorSide side) {
        switch (side) {
            case BUY:
                return Side.BUY;

            case SELL:
                return Side.SELL;
        }

        throw new IllegalArgumentException("Unsupported quote side: " + side);
    }

}
