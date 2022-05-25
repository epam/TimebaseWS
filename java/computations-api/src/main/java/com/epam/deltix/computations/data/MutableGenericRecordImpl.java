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
package com.epam.deltix.computations.data;

import com.epam.deltix.computations.data.base.GenericRecord;
import com.epam.deltix.computations.data.base.GenericValueInfo;
import com.epam.deltix.computations.data.complex.MutableGenericObjectImpl;
import com.epam.deltix.computations.data.base.MutableGenericRecord;

import javax.annotation.Nullable;

public class MutableGenericRecordImpl extends MutableGenericObjectImpl implements MutableGenericRecord {

    private long timestamp = GenericRecord.TIMESTAMP_UNDEFINED;
    private String recordKey = null;

    @Override
    public long timestamp() {
        return timestamp;
    }

    @Nullable
    @Override
    public String recordKey() {
        return recordKey;
    }

    @Override
    public void reuse() {
        timestamp = GenericRecord.TIMESTAMP_UNDEFINED;
        recordKey = null;
        super.reuse();
    }

    @Override
    public void setTimestamp(long timestamp) {
        this.timestamp = timestamp;
    }

    @Override
    public void setRecordKey(String recordKey) {
        this.recordKey = recordKey;
    }

    @Override
    public String toString() {
        return "MutableGenericRecordImpl{" +
                "timestamp=" + timestamp +
                ", recordKey='" + recordKey + '\'' +
                ", values=" + super.toString() +
                '}';
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {

        private MutableGenericRecordImpl record = new MutableGenericRecordImpl();

        public Builder setRecordKey(String key) {
            record.setRecordKey(key);
            return this;
        }

        public Builder setTimestamp(long timestamp) {
            record.setTimestamp(timestamp);
            return this;
        }

        public Builder set(String key, GenericValueInfo value) {
            record.set(key, value);
            return this;
        }

        public MutableGenericRecordImpl build() {
            MutableGenericRecordImpl temp = record;
            record = new MutableGenericRecordImpl();
            return temp;
        }

    }
}
