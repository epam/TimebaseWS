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

package com.epam.deltix.tbwg.webapp.services.charting.transformations;

import com.epam.deltix.dfp.Decimal64Utils;
import com.epam.deltix.tbwg.messages.BboPoint;
import com.epam.deltix.tbwg.messages.Message;
import com.epam.deltix.timebase.messages.MarketMessageInfo;
import com.epam.deltix.timebase.messages.MessageInfo;
import com.epam.deltix.timebase.messages.universal.QuoteSide;
import com.epam.deltix.timebase.messages.universal.L2EntryNew;
import com.epam.deltix.timebase.messages.universal.PackageHeader;
import com.epam.deltix.timebase.messages.universal.PackageType;

import java.util.Collections;

/**
 * The transformation filters package headers and leaves only l1 entries.
 */
public class UniversalL2SnapshotsToBboTransformation extends AbstractChartTransformation<BboPoint, MessageInfo> {

    private final BboPoint bboPoint = new BboPoint();

    private long bidPrice = Decimal64Utils.NULL;
    private long askPrice = Decimal64Utils.NULL;

    private long lastTimestamp = Long.MIN_VALUE / 2;

    public UniversalL2SnapshotsToBboTransformation(String symbol) {
        super(Collections.singletonList(PackageHeader.class), Collections.singletonList(BboPoint.class));
    }

    @Override
    protected void onMessage(Message message) {
        sendMessage(message);
    }

    @Override
    protected void onNextPoint(MessageInfo marketMessage) {
        if (marketMessage instanceof PackageHeader) {
            PackageHeader message = (PackageHeader) marketMessage;
            if (message.getPackageType() != PackageType.INCREMENTAL_UPDATE && message.getEntries() != null) {
                message.getEntries().forEach(entry -> {
                    if (entry instanceof L2EntryNew) {
                        L2EntryNew newEntry = (L2EntryNew) entry;
                        if (newEntry.getLevel() == 0) {
                            updateSide(message.getTimeStampMs(), newEntry.getPrice(), newEntry.getSide());
                        }
                    }
                });

                flush();
            }
        }
    }

    private void flush() {
        long timestamp = bboPoint.getTimeStampMs();
        long askPrice = bboPoint.getAskPrice();
        long bidPrice = bboPoint.getBidPrice();
        if (askPrice != Decimal64Utils.NULL && bidPrice != Decimal64Utils.NULL) {
            if (this.askPrice != askPrice || this.bidPrice != bidPrice || (timestamp - lastTimestamp > 1000)) {
                this.askPrice = askPrice;
                this.bidPrice = bidPrice;
                sendMessage(bboPoint);
            }

            clean();
        }
    }

    private void updateSide(long timestamp, long price, QuoteSide side) {
        if (side == QuoteSide.ASK) {
            bboPoint.setTimeStampMs(timestamp);
            bboPoint.setAskPrice(price);
        } else if (side == QuoteSide.BID) {
            bboPoint.setTimeStampMs(timestamp);
            bboPoint.setBidPrice(price);
        }
    }

    private void clean() {
        bboPoint.setBidPrice(Decimal64Utils.NULL);
        bboPoint.setAskPrice(Decimal64Utils.NULL);
    }
}
