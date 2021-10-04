package com.epam.deltix.computations.data.base;

import com.epam.deltix.computations.data.base.complex.MutableObjectValueInfo;

public interface MutableGenericRecord extends GenericRecord, MutableObjectValueInfo {

    void setTimestamp(long timestamp);

    void setRecordKey(String recordKey);

}
