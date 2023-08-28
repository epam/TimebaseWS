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

package com.epam.deltix.tbwg.webapp.services;

import com.epam.deltix.qsrv.hf.tickdb.pub.DXTickStream;
import com.epam.deltix.qsrv.hf.tickdb.pub.StreamOptions;
import com.epam.deltix.qsrv.hf.tickdb.pub.StreamScope;
import com.epam.deltix.tbwg.webapp.model.*;
import com.epam.deltix.tbwg.webapp.utils.TBWGUtils;
import com.epam.deltix.timebase.messages.IdentityKey;
import com.epam.deltix.util.time.Periodicity;
import org.springframework.stereotype.Service;

import java.util.Arrays;

@Service
public class OptionsServiceImpl implements OptionsService {

    @Override
    public StreamOptionsDef streamOptions(DXTickStream stream) {
        StreamOptions options = stream.getStreamOptions();

        StreamOptionsDef streamOptionsDef = createStreamOptionsDef(options);
        streamOptionsDef.name = options.name;
        streamOptionsDef.key = stream.getKey();
        streamOptionsDef.description = options.description;
        streamOptionsDef.highAvailability = options.highAvailability;
        streamOptionsDef.distributionFactor = options.distributionFactor == 0 ?
                "MAX" : String.valueOf(options.distributionFactor);
        streamOptionsDef.owner = options.owner;
        streamOptionsDef.version = options.version;
        streamOptionsDef.scope = options.scope;

        Periodicity p = options.periodicity;
        if (p != null) {
            String intervalDef = p.getInterval() != null ? p.getInterval().toHumanString() : null;
            long milliseconds = p.getInterval() != null ? p.getInterval().toMilliseconds() : 0;
            streamOptionsDef.periodicity = new PeriodicityDef(milliseconds, intervalDef, p.getType());
        }

        long[] range = stream.getTimeRange();
        streamOptionsDef.range = new TimeRangeDef(range);

        return streamOptionsDef;
    }

    @Override
    public StreamOptionsDef updateStreamOptions(DXTickStream stream, StreamOptionsDef options) {

        String key = options.key;
        String name = options.name;
        String description = options.description;
        PeriodicityDef periodicity = options.periodicity;

        if (key !=null && !key.equals(stream.getKey())){
            stream.rename(key);
        }
        if (name !=null && !name.equals(stream.getName())){
            stream.setName(name);
        }
        if (description !=null && !description.equals(stream.getDescription())){
            stream.setDescription(description);
        }
        if (periodicity != null) {
            Periodicity newPeriodicity = Periodicity.parse(periodicity.toString());
            if (!newPeriodicity.toString().equals(stream.getPeriodicity().toString())){
                stream.setPeriodicity(newPeriodicity);
            }
        }
        return streamOptions(stream);
    }

    public SymbolOptions symbolOptions(DXTickStream stream, String symbolId) {
        StreamOptionsDef streamOptions = streamOptions(stream);
        SymbolOptions symbolOptions = createSymbolOptions(streamOptions);

        IdentityKey[] ids = TBWGUtils.match(stream, symbolId);
        symbolOptions.setSymbolName(symbolId);

        symbolOptions.setSymbolRange(new TimeRangeDef(stream.getTimeRange(ids)));

        return symbolOptions;
    }

    public boolean checkSymbol(DXTickStream stream, String symbolId) {
        return Arrays.stream(stream.listEntities())
                .anyMatch(it -> it.getSymbol().toString().equals(symbolId));
    }

    private StreamOptionsDef createStreamOptionsDef(StreamOptions options) {
        StreamScope scope = options.scope;
        if (scope.equals(StreamScope.TRANSIENT)) {
            StreamOptionsTransientDef streamOptionsDef = new StreamOptionsTransientDef();
            streamOptionsDef.bufferOptions = options.bufferOptions;
            return streamOptionsDef;
        }
        return new StreamOptionsDef();
    }

    private SymbolOptions createSymbolOptions(StreamOptionsDef streamOptions) {
        if (streamOptions instanceof StreamOptionsTransientDef){
            return new SymbolOptionsTransient((StreamOptionsTransientDef) streamOptions);
        }
        return new SymbolOptions(streamOptions);
    }
}
