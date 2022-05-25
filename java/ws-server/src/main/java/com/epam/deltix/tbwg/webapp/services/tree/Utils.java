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

import com.epam.deltix.qsrv.hf.tickdb.pub.DXTickStream;
import com.epam.deltix.timebase.messages.IdentityKey;

import java.util.*;
import java.util.stream.Collectors;

public class Utils {

    static List<String> listSymbols(DXTickStream stream, String filter) {
        return listSymbols(stream.listEntities(), filter);
    }

    static List<String> listSymbols(IdentityKey[] entities, String filter) {
        List<String> symbols = Arrays.stream(entities)
            .filter(e -> e.getSymbol().length() > 0)
            .map(e -> e.getSymbol().toString())
            .collect(Collectors.toList());

        if (filter != null) {
            symbols = symbols.stream()
                .filter(s -> s.toLowerCase().contains(filter))
                .collect(Collectors.toList());
        }
        symbols.sort(Comparator.comparing(e -> e));

        return symbols;
    }

}
