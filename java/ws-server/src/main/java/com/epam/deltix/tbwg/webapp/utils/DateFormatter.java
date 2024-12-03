/*
 * Copyright 2024 EPAM Systems, Inc
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
package com.epam.deltix.tbwg.webapp.utils;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;

/**
 * Formats date in GMT, not thread-safe.
 */
public class DateFormatter {

    public static final String DATETIME_MILLIS_FORMAT_STR = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'";
    public static final String UTC_TIME_ZONE = "UTC";
    public static final long NONO_IN_SECOND = 1_000_000_000L;
    public static final long NONO_IN_MS = 1_000_000L;

    private final DateTimeFormatter formatter;
    private final ZoneId zoneId;
    private final boolean isNsFormate;

    public DateFormatter() {
        this(DATETIME_MILLIS_FORMAT_STR, UTC_TIME_ZONE);
    }

    public DateFormatter(String format) {
        this(format, UTC_TIME_ZONE);

    }

    public DateFormatter(String format, String timeZone) {
        format = format == null ? DATETIME_MILLIS_FORMAT_STR : format;
        zoneId = ZoneId.of(timeZone == null ? UTC_TIME_ZONE : timeZone);
        formatter = DateTimeFormatter.ofPattern(format).withZone(zoneId);
        isNsFormate = CsvImportUtil.isNsFormat(format);
    }

    public void toDateString(long timestamp, StringBuilder sb) {
        String dateString = toDateString(timestamp);
        sb.append(dateString);
    }

    public void toNanosDateString(long nanoTime, StringBuilder sb) {
        String dateString = toNanosDateString(nanoTime);
        sb.append(dateString);
    }

    public String toNanosDateString(long nanoTime) {
        Instant instant = Instant.ofEpochSecond(0, nanoTime);
        return formatter.format(instant);
    }

    public String toDateString(long timestamp) {
        Instant instant = Instant.ofEpochMilli(timestamp);
        return formatter.format(instant);
    }

    public long fromNanoDateString(String value) {
        ZonedDateTime zonedDateTime = fromString(value);
        return zonedDateTime.toInstant().getEpochSecond() * NONO_IN_SECOND + zonedDateTime.getNano();
    }

    public long fromDateString(String value) {
        ZonedDateTime zonedDateTime = fromString(value);
        return zonedDateTime.toInstant().toEpochMilli();
    }

    public long toConvertedLong(String value, boolean nanoResult) {
        if (isNsFormate) {
            long nanoTime = fromNanoDateString(value);
            return nanoResult ? nanoTime : nanoTime / NONO_IN_MS;
        }
        long msTime = fromDateString(value);
        return nanoResult ? msTime  * NONO_IN_MS : msTime;
    }

    private ZonedDateTime fromString(String value) {
        LocalDateTime localDateTime = LocalDateTime.parse(value, formatter);
        return localDateTime.atZone(zoneId);
    }
}