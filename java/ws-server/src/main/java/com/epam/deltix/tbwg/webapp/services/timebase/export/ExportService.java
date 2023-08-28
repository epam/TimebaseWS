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

import com.epam.deltix.qsrv.hf.pub.md.RecordClassDescriptor;
import com.epam.deltix.tbwg.webapp.model.input.ExportRequest;
import com.epam.deltix.util.time.Interval;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

public interface ExportService {

    String MSG_FORMAT = ".qsmsg.gz";
    String ZIP_FORMAT = ".zip";
    String CSV_FORMAT = ".csv";

    String prepareExport(
        ExportSourceFactory exportSourceFactory, ExportRequest request,
        long startTime, long endTime, long startIndex, long endIndex,
        Interval periodicity, RecordClassDescriptor[] rcds
    );

    StreamingResponseBody getExportBody(String id);

}
