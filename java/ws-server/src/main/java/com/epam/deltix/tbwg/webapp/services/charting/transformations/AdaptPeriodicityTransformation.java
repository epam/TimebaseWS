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

import com.epam.deltix.tbwg.messages.ChangePeriodicity;
import com.epam.deltix.tbwg.messages.Message;
import com.epam.deltix.timebase.messages.MarketMessageInfo;
import com.epam.deltix.timebase.messages.MessageInfo;
import com.epam.deltix.timebase.messages.universal.BaseEntryInfo;
import com.epam.deltix.timebase.messages.universal.L2EntryNew;
import com.epam.deltix.timebase.messages.universal.PackageHeader;
import com.epam.deltix.timebase.messages.universal.PackageType;
import com.epam.deltix.util.collections.generated.ObjectArrayList;

import java.util.Collections;

public class AdaptPeriodicityTransformation extends AbstractChartTransformation<MessageInfo, MessageInfo> {

    private final long maxPeriodicity;
    private final int maxLevels;
    private final PeriodicityFilter filter;

    public AdaptPeriodicityTransformation(int maxLevels , long periodicity) {
        super(Collections.singletonList(MessageInfo.class), Collections.singletonList(MessageInfo.class));

        this.maxLevels = maxLevels;
        this.maxPeriodicity = periodicity;
        this.filter = new PeriodicityFilter(periodicity, true);
    }

    @Override
    protected void onMessage(Message message) {
        sendMessage(message);
    }

    @Override
    protected void onNextPoint(MessageInfo marketMessage) {
        if (marketMessage instanceof PackageHeader) {
            PackageHeader message = (PackageHeader) marketMessage;
            if (message.getPackageType() != PackageType.INCREMENTAL_UPDATE) {
                if (filter.test(message)) {
                    adaptPeriodicity(countLevels(message));
                }
            }
        }

        sendMessage(marketMessage);
    }

    private int countLevels(PackageHeader message) {
        if (message == null) {
            return 0;
        }

        ObjectArrayList<BaseEntryInfo> entries = message.getEntries();
        if (entries == null) {
            return 0;
        }

        int actualLevelsCount = -1;
        for (int i = 0; i < entries.size(); ++i) {
            BaseEntryInfo entry = entries.get(i);
            if (entry instanceof L2EntryNew) {
                short level = ((L2EntryNew) entry).getLevel();
                if (level > actualLevelsCount) {
                    actualLevelsCount = level;
                }
            }
        }

        return actualLevelsCount + 1;
    }

    private void adaptPeriodicity(int actualLevelsCount) {
        long newPeriodicity;
        if (actualLevelsCount < maxLevels && actualLevelsCount > 0) {
            double periodicityMultiplier = (double) actualLevelsCount / maxLevels;
            newPeriodicity = (long) ((double) maxPeriodicity * periodicityMultiplier);
        } else {
            newPeriodicity = maxPeriodicity;
        }

        if (filter.getPeriodicity() != newPeriodicity) {
            filter.setPeriodicity(newPeriodicity);
            sendMessage(new ChangePeriodicity(newPeriodicity));
        }
    }
}
