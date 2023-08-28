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

package com.epam.deltix.tbwg.webapp.services.tree;

import com.epam.deltix.qsrv.hf.tickdb.pub.DXTickStream;
import com.epam.deltix.timebase.messages.IdentityKey;
import com.epam.deltix.timebase.messages.InstrumentKey;

import java.util.*;
import java.util.stream.Collectors;

public class Utils {

    static List<String> listSymbols(DXTickStream stream, TreeFilter filter) {
        if (stream == null) {
            return new ArrayList<>();
        }
        return listSymbols(stream.listEntities(), filter);
    }

    static List<String> listSymbols(IdentityKey[] entities, TreeFilter filter) {
        List<String> symbols = Arrays.stream(entities)
                .filter(e -> e.getSymbol().length() > 0)
                .map(e -> e.getSymbol().toString())
                .collect(Collectors.toList());

        if (filter != null) {
            symbols = symbols.stream()
                    .filter(filter::test)
                    .collect(Collectors.toList());
        }
        symbols.sort(Comparator.comparing(e -> e, String.CASE_INSENSITIVE_ORDER));

        return symbols;
    }

    static Map<String, List<String>> listSpaceSymbols(DXTickStream stream, SpaceEntitiesCache cache,
                                                      List<String> spaces, TreeFilter filter) {

        Map<String, List<String>> spaceToSymbols = new HashMap<>();
        for (String space : spaces) {
            List<String> entities = Utils.listSymbols(cache.getStreamSpaceEntities(stream, space), filter);
            if (entities.size() > 0) {
                spaceToSymbols.put(space, entities);
            }
        }

        return spaceToSymbols;
    }

}
