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
