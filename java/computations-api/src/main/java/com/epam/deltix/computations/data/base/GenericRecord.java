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
package com.epam.deltix.computations.data.base;

import com.epam.deltix.computations.data.base.complex.ObjectValueInfo;

import javax.annotation.Nullable;

/**
 * Class, describing generic record optionally associated with time.
 * If record is not associated with time, {@link GenericRecord#timestamp()} should return {@link GenericRecord#TIMESTAMP_UNDEFINED}.
 */
public interface GenericRecord extends ObjectValueInfo {

    /**
     * Undefined timestamp value.
     */
    long TIMESTAMP_UNDEFINED = Long.MIN_VALUE;
    long TIMESTAMP_LAST_VALUE = Long.MAX_VALUE;

    /**
     * Record timestamp.
     *
     * @return timestamp
     */
    long timestamp();

    /**
     * Record key.
     *
     * @return record key
     */
    @Nullable
    String recordKey();

    /**
     * Value associated with key.
     *
     * @param key string key
     * @return object, associated with key. If object is complex, GenericRecord will be returned.
     */
    GenericValueInfo getValue(CharSequence key);

    default boolean containsValue(CharSequence key) {
        return getValue(key) != null;
    }

    default boolean containsNonNull(CharSequence key) {
        GenericValueInfo value = getValue(key);
        return value != null && !value.isNull();
    }

}
