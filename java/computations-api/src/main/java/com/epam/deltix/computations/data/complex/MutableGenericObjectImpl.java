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
package com.epam.deltix.computations.data.complex;

import com.epam.deltix.computations.utils.Reusable;
import com.epam.deltix.containers.ObjObjPair;
import com.epam.deltix.containers.generated.CharSequenceToObjHashMap;
import com.epam.deltix.computations.data.NullValue;
import com.epam.deltix.computations.data.base.GenericValueInfo;
import com.epam.deltix.computations.data.base.complex.MutableObjectValueInfo;

import javax.annotation.Nonnull;
import java.util.Iterator;
import java.util.stream.Collectors;

public class MutableGenericObjectImpl implements MutableObjectValueInfo, Reusable {

    protected final CharSequenceToObjHashMap<GenericValueInfo> values = new CharSequenceToObjHashMap<>(NullValue.INSTANCE);

    protected CharSequenceToObjHashMap<GenericValueInfo> map = null;

    @Override
    public CharSequenceToObjHashMap<GenericValueInfo> value() {
        return map;
    }

    @Override
    public GenericValueInfo getValue(CharSequence key) {
        return map == null ? NullValue.INSTANCE : map.get(key);
    }

    @Override
    public void set(CharSequence key, GenericValueInfo value) {
        if (map == null) {
            map = values;
        }
        values.set(key, value);
    }

    @Override
    public void setNull() {
        map = null;
    }

    @Override
    public void reuse() {
        values.clear();
        map = null;
    }

    @Nonnull
    @Override
    public Iterator<ObjObjPair<CharSequence, GenericValueInfo>> iterator() {
        return values.iterator();
    }

    @Override
    public String toString() {
        return "{" + stream().map(pair -> "\"" + pair.getFirst() + "\":" + pair.getSecond().toString())
                .collect(Collectors.joining(",")) +
                "}";
    }
}
