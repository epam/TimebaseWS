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
package com.epam.deltix.tbwg.webapp.services.timebase;

import com.epam.deltix.tbwg.webapp.services.timebase.exc.UnknownStreamException;
import com.epam.deltix.qsrv.hf.pub.md.RecordClassSet;
import com.epam.deltix.qsrv.hf.tickdb.pub.DXTickDB;
import com.epam.deltix.qsrv.hf.tickdb.pub.DXTickStream;

public interface TimebaseService {

    DXTickDB            getConnection();

    DXTickStream        getStream(String name);

    DXTickStream        getOrCreateStream(String key, Class<?>... classes);

    default RecordClassSet getStreamMetadata(String streamName) {
        DXTickStream stream = getStream(streamName);
        if (stream == null) {
            throw new RuntimeException("Stream '" + streamName + "' not found");
        }

        return stream.getStreamOptions().getMetaData();
    }

    String          getServerVersion();

    boolean         isConnected();

    DXTickStream    getStreamChecked(String streamId) throws UnknownStreamException;

    boolean         isReadonly();

    DXTickStream    getCurrenciesStream();

    //Collection<CurrencyMessage> getProviderCurrencyInfo();

    DXTickStream[]  listStreams(String filter, boolean spaces);

    DXTickStream[]  listStreams();

    long            getFlushPeriodMs();

    String          getId();

}
