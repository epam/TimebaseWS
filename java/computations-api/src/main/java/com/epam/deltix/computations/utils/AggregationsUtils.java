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
package com.epam.deltix.computations.utils;

import com.epam.deltix.computations.data.base.GenericRecord;

import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.Properties;

public final class AggregationsUtils {

    private AggregationsUtils() {
    }

    private static final long MIN_TIMESTAMP = Instant.EPOCH.toEpochMilli();

    public static boolean areNumeric(GenericRecord record, List<String> fields) {
        return fields.stream().allMatch(field -> record.getValue(field).isNumeric());
    }

    public static boolean isValidTimestamp(long ts) {
        return ts >= MIN_TIMESTAMP;
    }

    public static List<String> getStringList(Properties properties, String key) {
        return Arrays.asList(properties.getProperty(key, "").split(","));
    }

    public static long getLong(Properties properties, String key) {
        return Long.parseLong(properties.getProperty(key));
    }

}
