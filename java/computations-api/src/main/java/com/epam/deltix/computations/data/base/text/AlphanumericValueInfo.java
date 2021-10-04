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
package com.epam.deltix.computations.data.base.text;

import com.epam.deltix.computations.data.base.GenericValueInfo;
import com.epam.deltix.containers.AlphanumericUtils;
import com.epam.deltix.util.annotations.Alphanumeric;

public interface AlphanumericValueInfo extends GenericValueInfo {

    @Alphanumeric
    long alphanumericValue();

    @Alphanumeric
    @Override
    default long longValue() {
        return alphanumericValue();
    }

    @Override
    default String value() {
        return AlphanumericUtils.toString(longValue());
    }

    @Override
    default boolean isText() {
        return true;
    }

    @Override
    default boolean isNull() {
        return alphanumericValue() == LONG_NULL;
    }

}
