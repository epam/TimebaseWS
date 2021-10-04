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
