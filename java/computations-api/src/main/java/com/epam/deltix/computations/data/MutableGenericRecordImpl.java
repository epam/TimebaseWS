package com.epam.deltix.computations.data;

import com.epam.deltix.computations.data.base.GenericRecord;
import com.epam.deltix.computations.data.base.GenericValueInfo;
import com.epam.deltix.computations.data.base.MutableGenericRecord;
import com.epam.deltix.computations.data.complex.MutableGenericObjectImpl;

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
