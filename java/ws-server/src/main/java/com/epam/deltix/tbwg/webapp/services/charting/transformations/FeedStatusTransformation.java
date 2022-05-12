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

import com.epam.deltix.tbwg.messages.*;
import com.epam.deltix.timebase.messages.MarketMessageInfo;

import java.util.Collections;

public class FeedStatusTransformation extends AbstractChartTransformation<MarketMessageInfo, MarketMessageInfo> {

    private boolean disconnected;

    public FeedStatusTransformation() {
        super(Collections.singletonList(MarketMessageInfo.class), Collections.singletonList(MarketMessageInfo.class));
    }

    @Override
    protected void onMessage(Message message) {
        sendMessage(message);
    }

    @Override
    protected void onNextPoint(MarketMessageInfo marketMessage) {
        if (marketMessage instanceof SecurityStatusMessage) {
            SecurityStatusMessage statusMessage = (SecurityStatusMessage) marketMessage;
            if (statusMessage.getStatus() == SecurityStatus.FEED_DISCONNECTED) {
                disconnected = true;
                sendMessage(
                    new FeedStatusMessage(statusMessage.getTimeStampMs(), statusMessage.getExchangeId(), FeedStatus.NOT_AVAILABLE)
                );
            } else if (statusMessage.getStatus() == SecurityStatus.FEED_CONNECTED) {
                disconnected = false;
                sendMessage(
                    new FeedStatusMessage(statusMessage.getTimeStampMs(), statusMessage.getExchangeId(), FeedStatus.AVAILABLE)
                );
            }
        }
//        else if (marketMessage instanceof SecurityFeedStatusMessage) {
//            SecurityFeedStatusMessage statusMessage = (SecurityFeedStatusMessage) marketMessage;
//            if (statusMessage.getStatus() == FeedStatus.NOT_AVAILABLE) {
//                disconnected = true;
//                sendMessage(
//                    new FeedStatusMessage(statusMessage.getTimeStampMs(), statusMessage.getExchangeId(), FeedStatus.NOT_AVAILABLE)
//                );
//            } else {
//                disconnected = false;
//                sendMessage(
//                    new FeedStatusMessage(statusMessage.getTimeStampMs(), statusMessage.getExchangeId(), FeedStatus.AVAILABLE)
//                );
//            }
//        }

        if (!disconnected) {
            sendMessage(marketMessage);
        }
    }
}
