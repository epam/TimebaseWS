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

package com.epam.deltix.tbwg.webapp.services.grafana;

import com.epam.deltix.gflog.api.Log;
import com.epam.deltix.gflog.api.LogFactory;
import com.epam.deltix.util.collections.generated.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

class Utils {

    private static final Log LOG = LogFactory.getLog(Utils.class);
    private static final Map<Class<?>, Class<? extends List<? extends Number>>> map = new HashMap<>();

    static {
        map.put(byte.class, ByteArrayList.class);
        map.put(Byte.class, ByteArrayList.class);
        map.put(short.class, ShortArrayList.class);
        map.put(Short.class, ShortArrayList.class);
        map.put(int.class, IntegerArrayList.class);
        map.put(Integer.class, IntegerArrayList.class);
        map.put(long.class, LongArrayList.class);
        map.put(Long.class, LongArrayList.class);

        map.put(float.class, FloatArrayList.class);
        map.put(Float.class, FloatArrayList.class);
        map.put(double.class, DoubleArrayList.class);
        map.put(Double.class, DoubleArrayList.class);
    }

    static List<Number> listFor(Class<?> clazz) {
        if (map.containsKey(clazz)) {
            try {
                map.get(clazz).getConstructor().newInstance();
            } catch (Exception e) {
                LOG.error().append(e).commit();
            }
        }
        return null;
    }
}
