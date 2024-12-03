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
package com.epam.deltix.tbwg.webapp.services.charting.transformations;

import com.epam.deltix.dfp.Decimal64Utils;
import com.epam.deltix.tbwg.messages.BarMessage;
import com.epam.deltix.tbwg.messages.Message;
import com.epam.deltix.tbwg.messages.WCTBarMessage;
import com.epam.deltix.tbwg.webapp.model.charting.ChartType;
import com.epam.deltix.timebase.messages.InstrumentMessage;

import java.util.Collections;

/**
 *
 */
public class WctToBarTransformation extends AbstractChartTransformation<BarMessage, InstrumentMessage> {

    private final ChartType chartType;
    private final BarMessage bar = new BarMessage();

    public WctToBarTransformation(ChartType chartType) {
        super(Collections.singletonList(WCTBarMessage.class), Collections.singletonList(BarMessage.class));
        this.chartType = chartType;
    }

    @Override
    protected void onMessage(Message message) {
        sendMessage(message);
    }

    @Override
    protected void onNextPoint(InstrumentMessage message) {
        if (message instanceof WCTBarMessage) {
            WCTBarMessage barMessage = (WCTBarMessage) message;

            bar.setTimeStampMs(barMessage.getTimeStampMs());
            bar.setSymbol(barMessage.getSymbol());
            bar.setExchangeId(barMessage.exchangeCode);

            bar.setOpen(Decimal64Utils.toDouble(calcValue(barMessage.openAsk, barMessage.openBid)));
            bar.setClose(Decimal64Utils.toDouble(calcValue(barMessage.closeAsk, barMessage.closeBid)));
            bar.setHigh(Decimal64Utils.toDouble(calcValue(barMessage.highAsk, barMessage.highBid, barMessage.highMid)));
            bar.setLow(Decimal64Utils.toDouble(calcValue(barMessage.lowAsk, barMessage.lowBid, barMessage.lowMid)));
            bar.setVolume(Decimal64Utils.toDouble(barMessage.volume));

            sendMessage(bar);
        }
    }

    private long calcValue(long ask, long bid) {
        switch (chartType) {
            case BARS:
                return Decimal64Utils.divide(Decimal64Utils.add(ask, bid), Decimal64Utils.TWO);
            case BARS_ASK:
                return ask;
            case BARS_BID:
                return bid;
            default:
                throw new RuntimeException("Invalid bars type: " + chartType);
        }
    }

    private long calcValue(long ask, long bid, long mid) {
        switch (chartType) {
            case BARS:
                return mid;
            case BARS_ASK:
                return ask;
            case BARS_BID:
                return bid;
            default:
                throw new RuntimeException("Invalid bars type: " + chartType);
        }
    }

}