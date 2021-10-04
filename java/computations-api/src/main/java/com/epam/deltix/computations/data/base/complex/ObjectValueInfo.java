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
package com.epam.deltix.computations.data.base.complex;

import com.epam.deltix.containers.ObjObjPair;
import com.epam.deltix.computations.data.base.GenericValueInfo;
import com.epam.deltix.computations.data.base.text.CharSequenceValueInfo;

import java.util.stream.Stream;
import java.util.stream.StreamSupport;

public interface ObjectValueInfo extends GenericValueInfo, Iterable<ObjObjPair<CharSequence, GenericValueInfo>> {

    String TYPE_KEY = "$type";

    @Override
    GenericValueInfo getValue(CharSequence key);

    @Override
    default boolean isNumeric() {
        return false;
    }

    @Override
    default boolean isNull() {
        return value() == null;
    }

    default CharSequenceValueInfo getType() {
        return (CharSequenceValueInfo) getValue(TYPE_KEY);
    }

    default Stream<ObjObjPair<CharSequence, GenericValueInfo>> stream() {
        return StreamSupport.stream(spliterator(), false);
    }

}
