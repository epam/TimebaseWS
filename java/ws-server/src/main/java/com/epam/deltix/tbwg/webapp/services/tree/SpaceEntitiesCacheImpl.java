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

import com.epam.deltix.timebase.messages.IdentityKey;
import com.epam.deltix.qsrv.hf.tickdb.pub.DXTickStream;

import java.util.*;

public class SpaceEntitiesCacheImpl implements SpaceEntitiesCache {

    private static class SpaceEntities {
        private final Map<String, IdentityKey[]> spaceToEntities = new HashMap<>();
    }

    private final Map<String, SpaceEntities> streamToSpaceEntities = new HashMap<>();

    @Override
    public synchronized IdentityKey[] getStreamSpaceEntities(DXTickStream stream, String space) {
        SpaceEntities spaceEntities = streamToSpaceEntities.computeIfAbsent(stream.getKey(), k -> new SpaceEntities());
        return spaceEntities.spaceToEntities.computeIfAbsent(space, k -> stream.listEntities(space));
    }

    @Override
    public synchronized void invalidate(String streamKey) {
        SpaceEntities spaceEntities = streamToSpaceEntities.get(streamKey);
        if (spaceEntities != null) {
            spaceEntities.spaceToEntities.clear();
        }
    }

}
