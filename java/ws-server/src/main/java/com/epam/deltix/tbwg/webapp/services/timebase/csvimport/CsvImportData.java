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
package com.epam.deltix.tbwg.webapp.services.timebase.csvimport;

import lombok.Getter;
import lombok.Setter;

import java.util.HashMap;
import java.util.Map;

@Getter
@Setter
public class CsvImportData {

    private final String id;
    private final String streamKey;

    private Map<String, Preview> csvPreviewData = new HashMap<>();
    private long processId = -1;
    private CsvImportSettings setting;
    private ImportProcessWriter writer;
    private ImportStatus importStatus;
    private volatile boolean isActive = true;

    public CsvImportData(String id, String streamKey) {
        this.id = id;
        this.streamKey = streamKey;
    }

    public boolean clearProcessResources() {
        boolean needClean = writer != null || processId != -1;
        if (writer != null)
            writer.close();
        processId = -1;
        setting = null;
        writer = null;
        return needClean;
    }
}