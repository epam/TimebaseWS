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
package com.epam.deltix.tbwg.webapp.services.charting.transformations;

import com.epam.deltix.tbwg.messages.ExecutionTag;
import com.epam.deltix.tbwg.messages.Message;
import com.epam.deltix.timebase.messages.MarketMessageInfo;
import com.epam.deltix.timebase.messages.MessageInfo;
import com.epam.deltix.timebase.messages.universal.AggressorSide;
import com.epam.deltix.timebase.messages.universal.QuoteSide;
import com.epam.deltix.timebase.messages.universal.PackageHeader;
import com.epam.deltix.timebase.messages.universal.TradeEntryInfo;

import java.util.Collections;

/**
 * The transformation filters package headers and leaves only trades.
 */
public class UniversalToTradeTransformation extends AbstractChartTransformation<ExecutionTag, MessageInfo> {

    private final ExecutionTag tradeTag = new ExecutionTag();

    public UniversalToTradeTransformation() {
        super(Collections.singletonList(PackageHeader.class), Collections.singletonList(ExecutionTag.class));
    }

    @Override
    protected void onMessage(Message message) {
        sendMessage(message);
    }

    @Override
    protected void onNextPoint(MessageInfo marketMessage) {
        if (marketMessage instanceof PackageHeader) {
            PackageHeader message = (PackageHeader) marketMessage;
            if (message.getEntries() != null) {
                message.getEntries().forEach(entry -> {
                    if (entry instanceof TradeEntryInfo) {
                        flushTrade(message.getTimeStampMs(), (TradeEntryInfo) entry);
                    }
                });
            }
        }
    }

    private void flushTrade(long timestamp, TradeEntryInfo trade) {
        tradeTag.setTimeStampMs(timestamp);
        tradeTag.setValue(trade.getPrice());
        tradeTag.setPrice(trade.getPrice());
        tradeTag.setSize(trade.getSize());
        tradeTag.setSide(trade.getSide() == AggressorSide.BUY ? QuoteSide.BID : QuoteSide.ASK);
        sendMessage(tradeTag);
    }
}
