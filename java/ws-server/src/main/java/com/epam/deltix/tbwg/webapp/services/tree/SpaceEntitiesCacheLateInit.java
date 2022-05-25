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
package com.epam.deltix.tbwg.webapp.services.tree;

import com.epam.deltix.tbwg.webapp.services.timebase.TimebaseService;
import com.epam.deltix.gflog.api.Log;
import com.epam.deltix.gflog.api.LogFactory;
import com.epam.deltix.timebase.messages.IdentityKey;
import com.epam.deltix.qsrv.hf.tickdb.pub.DBStateListener;
import com.epam.deltix.qsrv.hf.tickdb.pub.DBStateNotifier;
import com.epam.deltix.qsrv.hf.tickdb.pub.DXTickDB;
import com.epam.deltix.qsrv.hf.tickdb.pub.DXTickStream;

public class SpaceEntitiesCacheLateInit implements SpaceEntitiesCache {

    private static final Log LOG = LogFactory.getLog(SpaceEntitiesCacheLateInit.class);

    private SpaceEntitiesCache spaceEntitiesCache;
    private final TimebaseService timebaseService;
    private final DBStateListener dbStateListener;

    public SpaceEntitiesCacheLateInit(TimebaseService timebaseService, DBStateListener dbStateListener) {
        this.dbStateListener = dbStateListener;
        this.timebaseService = timebaseService;
    }

    @Override
    public IdentityKey[] getStreamSpaceEntities(DXTickStream stream, String space) {
        initializeIfNeeded();
        return spaceEntitiesCache.getStreamSpaceEntities(stream, space);
    }

    @Override
    public void invalidate(String streamKey) {
        initializeIfNeeded();
        spaceEntitiesCache.invalidate(streamKey);
    }

    private synchronized void initializeIfNeeded() {
        if (spaceEntitiesCache == null) {
            initializeSpaceEntitiesCache();
        }
    }

    private void initializeSpaceEntitiesCache() {
        DXTickDB db = timebaseService.getConnection();
        if (db instanceof DBStateNotifier) {
            ((DBStateNotifier) db).addStateListener(dbStateListener);
            spaceEntitiesCache = new SpaceEntitiesCacheImpl();
        } else {
            spaceEntitiesCache = new SpaceEntitiesNoCache();
        }
    }
}
