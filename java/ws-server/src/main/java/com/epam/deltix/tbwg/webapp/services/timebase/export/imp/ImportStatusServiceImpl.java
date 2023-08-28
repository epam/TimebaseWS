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
package com.epam.deltix.tbwg.webapp.services.timebase.export.imp;

import com.epam.deltix.tbwg.webapp.services.timebase.csvimport.ImportStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ImportStatusServiceImpl implements ImportStatusService {

    private final Map<Long, ImportStatus> statusMap = new HashMap<>();


    @Override
    public ImportStatus newImportStatus(long id) {
        ImportStatus status = new ImportStatus(id);
        statusMap.put(id, status);
        return status;
    }

    @Override
    public ImportStatus getStatus(long id) {
        return statusMap.get(id);
    }

    @Scheduled(fixedDelay = 30000)
    public void update() {
        invalidateStaleStatus();
    }
    private synchronized void invalidateStaleStatus() {
        long currentTime = System.currentTimeMillis();
        statusMap.values().stream()
                .filter(i -> currentTime - i.getUpdateTime() > 30000)
                .map(ImportStatus::getProcessId).collect(Collectors.toList())
                .forEach(this::removeStatus);
    }

    private void removeStatus(Long id) {
        statusMap.remove(id);
    }

}
