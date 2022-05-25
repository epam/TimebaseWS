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
package com.epam.deltix.tbwg.webapp.services.timebase.export;

import com.epam.deltix.qsrv.hf.tickdb.pub.SelectionOptions;
import com.epam.deltix.qsrv.hf.tickdb.pub.query.InstrumentMessageSource;
import com.epam.deltix.tbwg.webapp.services.timebase.TimebaseService;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class QueryExportSourceFactory implements ExportSourceFactory {
    private final TimebaseService timebaseService;
    private final SelectionOptions options;
    private final String query;

    public QueryExportSourceFactory(TimebaseService timebaseService, SelectionOptions options, String query) {
        this.timebaseService = timebaseService;
        this.options = options;
        this.query = query;
    }

    @Override
    public InstrumentMessageSource newMessageSource() {
        return timebaseService.getConnection().executeQuery(query, options);
    }
}
