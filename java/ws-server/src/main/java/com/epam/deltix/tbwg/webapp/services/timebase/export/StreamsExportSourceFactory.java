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

package com.epam.deltix.tbwg.webapp.services.timebase.export;

import com.epam.deltix.qsrv.hf.tickdb.pub.SelectionOptions;
import com.epam.deltix.qsrv.hf.tickdb.pub.TickStream;
import com.epam.deltix.qsrv.hf.tickdb.pub.query.InstrumentMessageSource;
import com.epam.deltix.tbwg.webapp.services.timebase.TimebaseService;
import com.epam.deltix.timebase.messages.IdentityKey;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class StreamsExportSourceFactory implements ExportSourceFactory {
    private final TimebaseService timebaseService;
    private final long startTime;
    private final SelectionOptions options;
    private final TickStream[] streams;
    private final String[] types;
    private final IdentityKey[] ids;

    public StreamsExportSourceFactory(TimebaseService timebaseService,
                                      long startTime,
                                      SelectionOptions options,
                                      TickStream[] streams, String[] types, IdentityKey[] ids)
    {
        this.timebaseService = timebaseService;
        this.startTime = startTime;
        this.options = options;
        this.streams = streams;
        this.types = types;
        this.ids = ids;
    }

    @Override
    public InstrumentMessageSource newMessageSource() {
        return timebaseService.getConnection().select(
            startTime,
            options,
            types,
            ids,
            streams);
    }

    @Override
    public String getBaseFileName() {
        return streams[0].getKey().replace(' ', '_');
    }
}
