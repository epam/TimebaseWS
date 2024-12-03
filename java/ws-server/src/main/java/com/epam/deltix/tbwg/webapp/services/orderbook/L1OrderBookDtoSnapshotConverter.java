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
package com.epam.deltix.tbwg.webapp.services.orderbook;

import com.epam.deltix.tbwg.webapp.model.orderbook.*;
import com.epam.deltix.tbwg.webapp.utils.ArrayPoolUtils;
import com.epam.deltix.tbwg.webapp.utils.ExchangeResolver;
import com.epam.deltix.timebase.messages.universal.*;
import com.epam.deltix.util.collections.generated.LongHashSet;

import java.util.ArrayList;
import java.util.List;

public class L1OrderBookDtoSnapshotConverter {

    private final ArrayPoolUtils<L2EntryDto> pool = new ArrayPoolUtils<>(L2EntryDto::new);
    private final ExchangeResolver nameResolver = new ExchangeResolver();
    private final L2PackageDto packageDto = new L2PackageDto();

    public L1OrderBookDtoSnapshotConverter() {
        packageDto.entries = new ArrayList<>();
        packageDto.sequenceNumber = System.currentTimeMillis();
    }

    public L2PackageDto convert(L1OrderBook.OrderBook orderBook, boolean showExchangeId, LongHashSet hiddenExchanges) {
        packageDto.setSecurityId(orderBook.getSymbol());
        packageDto.type = L2PackageType.SNAPSHOT_FULL_REFRESH;
        packageDto.entries.clear();

        if (!hiddenExchanges.contains(orderBook.getExchangeId())){
            L1Entry ask = orderBook.getAsk();
            L1Entry bid = orderBook.getBid();
            if (ask != null) {
                addL2EntryDto(packageDto.entries, ask, showExchangeId);
            }
            if (bid != null) {
                addL2EntryDto(packageDto.entries, bid, showExchangeId);
            }
        }
        return packageDto;
    }

    private void addL2EntryDto(List<L2EntryDto> ret, BaseEntryInfo entry, boolean showExchangeId) {
        if (entry instanceof L1EntryInfo) {
            L1EntryInfo l1EntryInfo = (L1EntryInfo) entry;

            L2EntryDto l2Entry = pool.getL2Entry(l1EntryInfo.getSide().getNumber());
            l2Entry.action = L2Action.INSERT;
            l2Entry.level = 0;
            l2Entry.setPrice(l1EntryInfo.getPrice());
            l2Entry.setQuantity(l1EntryInfo.getSize());
            l2Entry.side = createSideForL2Entry(l1EntryInfo.getSide());
            l2Entry.alphanumericExchangeId = l1EntryInfo.getExchangeId();
            if (showExchangeId) {
                l2Entry.exchangeId = nameResolver.resolve(l1EntryInfo.getExchangeId());
            } else {
                l2Entry.exchangeId = null;
            }
            ret.add(l2Entry);
        }
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

}