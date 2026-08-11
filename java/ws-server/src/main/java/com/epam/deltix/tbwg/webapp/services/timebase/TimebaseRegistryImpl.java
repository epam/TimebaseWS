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
package com.epam.deltix.tbwg.webapp.services.timebase;

import com.epam.deltix.gflog.api.Log;
import com.epam.deltix.gflog.api.LogFactory;
import com.epam.deltix.tbwg.webapp.services.timebase.connections.TbUserConnectionsService;
import com.epam.deltix.tbwg.webapp.settings.TimebaseSettings;
import com.epam.deltix.tbwg.webapp.settings.TimebasesListSettings;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

import jakarta.annotation.PreDestroy;
import java.util.*;

@Service
@Profile("default")
public class TimebaseRegistryImpl implements TimebaseRegistry {

    public static final String DEFAULT_ID = "TimeBase";

    private static final Log LOGGER = LogFactory.getLog(TimebaseRegistryImpl.class);

    private final List<TimebaseService> instances;
    private final Map<String, TimebaseService> instancesById;
    private final boolean ownInstances;

    @Autowired
    public TimebaseRegistryImpl(
            TimebaseService legacyService,
            TimebaseSettings legacySettings,
            TimebasesListSettings listSettings,
            SystemMessagesService systemMessagesService,
            TbUserConnectionsService userConnectionsService) {

        List<TimebaseSettings> configs = listSettings.getTimebases();

        if (configs.isEmpty()) {
            if (legacySettings.getId() == null || legacySettings.getId().isEmpty()) {
                legacySettings.setId(DEFAULT_ID);
            }
            instances = Collections.singletonList(legacyService);
            ownInstances = false;
            LOGGER.info("TimebaseRegistry: single-instance mode, id='%s' -> %s.")
                    .with(legacySettings.getId()).with(legacySettings.getUrl());
        } else {
            List<TimebaseService> list = new ArrayList<>(configs.size());
            for (int i = 0; i < configs.size(); i++) {
                TimebaseSettings settings = configs.get(i);
                if (settings.getId() == null || settings.getId().isEmpty()) {
                    settings.setId(settings.getUrl());
                }
                list.add(new TimebaseServiceImpl(settings, systemMessagesService, userConnectionsService));
                LOGGER.info("TimebaseRegistry: registered instance '%s' -> %s.")
                        .with(settings.getId()).with(settings.getUrl());
            }
            instances = Collections.unmodifiableList(list);
            ownInstances = true;
        }

        LinkedHashMap<String, TimebaseService> byId = new LinkedHashMap<>();
        for (TimebaseService svc : instances) {
            String id = svc.getId();
            if (id != null && !id.isEmpty()) {
                byId.put(id, svc);
            }
        }
        instancesById = Collections.unmodifiableMap(byId);
    }

    @PreDestroy
    public void dispose() {
        if (ownInstances) {
            for (TimebaseService svc : instances) {
                if (svc instanceof TimebaseServiceImpl) {
                    ((TimebaseServiceImpl) svc).dispose();
                }
            }
        }
        // In single-instance mode the Spring-managed TimebaseServiceImpl handles its own @PreDestroy.
    }

    @Override
    public List<TimebaseService> getAll() {
        return instances;
    }

    @Override
    public TimebaseService getById(String id) {
        TimebaseService svc = instancesById.get(id);
        if (svc == null) {
            throw new IllegalArgumentException("Unknown TimeBase id: " + id);
        }
        return svc;
    }

    @Override
    public TimebaseService getDefault() {
        return instances.get(0);
    }
}
