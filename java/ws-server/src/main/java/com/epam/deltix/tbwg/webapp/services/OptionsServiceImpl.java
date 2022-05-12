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
package com.epam.deltix.tbwg.webapp.services;

import com.epam.deltix.timebase.messages.IdentityKey;
import com.epam.deltix.qsrv.hf.tickdb.pub.DXTickStream;
import com.epam.deltix.qsrv.hf.tickdb.pub.StreamOptions;
import com.epam.deltix.tbwg.webapp.model.PeriodicityDef;
import com.epam.deltix.tbwg.webapp.model.StreamOptionsDef;
import com.epam.deltix.tbwg.webapp.model.SymbolOptions;
import com.epam.deltix.tbwg.webapp.model.TimeRangeDef;
import com.epam.deltix.tbwg.webapp.utils.TBWGUtils;
import com.epam.deltix.util.time.Interval;
import com.epam.deltix.util.time.Periodicity;
import org.springframework.stereotype.Service;

import java.util.Arrays;

@Service
public class OptionsServiceImpl implements OptionsService {

    @Override
    public StreamOptionsDef streamOptions(DXTickStream stream) {
        StreamOptions options = stream.getStreamOptions();

        StreamOptionsDef streamOptionsDef = new StreamOptionsDef();
        streamOptionsDef.name = options.name;
        streamOptionsDef.key = stream.getKey();
        streamOptionsDef.description = options.description;
        streamOptionsDef.highAvailability = options.highAvailability;
        streamOptionsDef.distributionFactor = options.distributionFactor;
        streamOptionsDef.owner = options.owner;

        Periodicity p = options.periodicity;
        if (p != null) {
            Interval interval = p.getInterval();
            streamOptionsDef.periodicity = new PeriodicityDef(interval != null ? interval.toMilliseconds(): 0,
                    interval != null ? interval.toHumanString() : null, p.getType());
        }

        streamOptionsDef.scope = options.scope;
        streamOptionsDef.bufferOptions = options.bufferOptions;

        long[] range = stream.getTimeRange();
        streamOptionsDef.range = new TimeRangeDef(range);

        return streamOptionsDef;
    }

    public SymbolOptions symbolOptions(DXTickStream stream, String symbolId) {
        StreamOptionsDef streamOptions = streamOptions(stream);
        SymbolOptions symbolOptions = new SymbolOptions(streamOptions);

        IdentityKey[] ids = TBWGUtils.match(stream, symbolId);
        symbolOptions.setSymbolName(symbolId);

        symbolOptions.setSymbolRange(new TimeRangeDef(stream.getTimeRange(ids)));

        return symbolOptions;
    }

    public boolean checkSymbol(DXTickStream stream, String symbolId) {
        return Arrays.stream(stream.listEntities())
                .anyMatch(it -> it.getSymbol().toString().equals(symbolId));
    }
}
