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
package com.epam.deltix.tbwg.webapp.utils;

import com.epam.deltix.containers.AlphanumericUtils;
import com.epam.deltix.gflog.api.Log;
import com.epam.deltix.gflog.api.LogFactory;
import com.epam.deltix.util.collections.generated.LongToObjectHashMap;

public class ExchangeResolver {

    private static final Log LOGGER = LogFactory.getLog(ExchangeResolver.class);

    private final LongToObjectHashMap<String> names = new LongToObjectHashMap<>();

    public String resolve(long id) {
        String name = names.get(id, null);
        if (name == null) {
            names.put(id, name = toString(id));
        }

        return name;
    }

    private String toString(long id) {
        try {
            return AlphanumericUtils.toString(id);
        } catch (IllegalArgumentException e) {
            LOGGER.error().append("Can't resolve alphanumeric value ").append(id).append(e).commit();
            return "";
        }
    }
}
