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

import com.epam.deltix.tbwg.messages.Message;
import com.epam.deltix.tbwg.messages.TradePoint;
import com.epam.deltix.timebase.messages.InstrumentMessage;
import com.epam.deltix.timebase.messages.universal.*;
import com.epam.deltix.util.collections.generated.ObjectArrayList;


import java.util.Collections;

/**
 * The transformation converts aggregated trade value to package header.
 */
public class TradeToUniversalTransformation extends AbstractChartTransformation<InstrumentMessage, InstrumentMessage> {

    public TradeToUniversalTransformation() {
        super(Collections.singletonList(InstrumentMessage.class), Collections.singletonList(InstrumentMessage.class));
        packageHeader.setPackageType(PackageType.INCREMENTAL_UPDATE);
        packageHeader.setEntries(new ObjectArrayList<>(new TradeEntry[]{entry}));
    }

    private final PackageHeader packageHeader = new PackageHeader();
    private final TradeEntry entry = new TradeEntry();

    @Override
    protected void onMessage(Message message) {
        sendMessage(message);
    }

    @Override
    protected void onNextPoint(InstrumentMessage message) {
        if (message instanceof TradePoint) {
            packageHeader.setNanoTime(message.getNanoTime());
            packageHeader.setSymbol(message.getSymbol());
            entry.setSize(((TradePoint) message).getSize());
            entry.setPrice(((TradePoint) message).getPrice());
            sendMessage(packageHeader);
        } else {
            sendMessage(message);
        }
    }
}