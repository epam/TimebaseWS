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

import com.epam.deltix.gflog.api.Log;
import com.epam.deltix.gflog.api.LogFactory;
import com.epam.deltix.qsrv.hf.pub.md.RecordClassDescriptor;
import com.epam.deltix.tbwg.webapp.model.input.ExportFormat;
import com.epam.deltix.tbwg.webapp.model.input.ExportRequest;
import com.epam.deltix.util.collections.generated.ObjectToObjectHashMap;
import com.epam.deltix.util.io.GUID;
import com.epam.deltix.util.time.Interval;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

import java.util.concurrent.atomic.AtomicLong;

@Service
public class ExportServiceImpl implements ExportService {

    static final int MAX_EXPORT_PROCESSES;

    static {
        int maxExportProcs;
        try {
            maxExportProcs = Integer.parseInt(System.getProperty("deltix.tbwg.webapp.services.maxExportProcs", "5"));
        } catch (NumberFormatException ex) {
            maxExportProcs = 5;
        }
        MAX_EXPORT_PROCESSES = maxExportProcs;
    }

    private static final Log LOGGER = LogFactory.getLog(ExportServiceImpl.class);

    private final AtomicLong exportProcesses = new AtomicLong();
    private final ObjectToObjectHashMap<String, StreamingResponseBody> downloads = new ObjectToObjectHashMap<>();

    @Override
    public String prepareExport(ExportSourceFactory exportSourceFactory, ExportRequest request,
                                long startTime, long endTime, long startIndex, long endIndex,
                                Interval periodicity, RecordClassDescriptor[] rcds)
    {
        if (exportProcesses.incrementAndGet() >= MAX_EXPORT_PROCESSES) {
            LOGGER.error().append("Number of export requests over the limit ").append(MAX_EXPORT_PROCESSES).append(".")
                .append(exportProcesses.get()).append(" EXPORT processes are currently running.")
                .commit();
            exportProcesses.decrementAndGet();
            return null;
        }

        String baseFileName = exportSourceFactory.getBaseFileName();
        String file = request.getFileName(baseFileName);

        StreamingResponseBody body = request.format == ExportFormat.QSMSG ?
            new MessageSource2QMSGFile(
                exportProcesses,
                file, exportSourceFactory, request, startTime, endTime, startIndex, endIndex, periodicity, rcds
            ) :
            new CSVExporter(exportProcesses,
                file, exportSourceFactory, request, startTime, endTime, startIndex, endIndex, rcds
            );

        String id = new GUID().toString();

        synchronized (downloads) {
            downloads.put(id, body);
        }

        return id;
    }

    @Override
    public StreamingResponseBody getExportBody(String id) {
        synchronized (downloads) {
            return downloads.remove(id, null);
        }
    }
}
