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
package com.epam.deltix.tbwg.webapp.utils;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;

public class BordersTimeBarChartsUtils {

    public static final long DAY_MILLISECONDS = 24 * 60 * 60 * 1000L;
    public static final long MONTH_MILLISECONDS = 30 * DAY_MILLISECONDS;
    private static final long MAX_ALLOWABLE_DEVIATION_BEGIN_OF_YEAR = 13; //(day in february / 2) - 1
    private static final long MAX_ALLOWABLE_DEVIATION = 15; //(day in january / 2)
    private static final long FIRST_MONDAY = 4 * DAY_MILLISECONDS; // 5 Jan 1970 00:00:00.000

    public static boolean isDynamicBar(long pointInterval) {
        return isWeekBar(pointInterval) ||
                pointInterval % (30 * DAY_MILLISECONDS) == 0 ||
                pointInterval % (365 * DAY_MILLISECONDS) == 0;
    }

    public static boolean isWeekBar(long pointInterval) {
        return pointInterval % (7 * DAY_MILLISECONDS) == 0 && pointInterval % MONTH_MILLISECONDS != 0;
    }

    public static Instant toBeginOfPeriod(Instant time, long barSize, boolean correctDayTime) {
        return Instant.ofEpochMilli(toBeginOfPeriod(time.toEpochMilli(), barSize, correctDayTime));
    }

    public static long toBeginOfPeriod(long time, long barSize, boolean correctDayTime) {
        if (correctDayTime) {
            time = toBeginOfDay(time);
        }
        if (isWeekBar(barSize)) {
            return toBeginOfWeekBar(time, barSize);
        }
        LocalDate startDate = LocalDateTime.ofEpochSecond(time / 1000,0, ZoneOffset.UTC).toLocalDate();
        while (startDate.getDayOfMonth() != 1 || !isBeginOfPeriod(startDate.getDayOfYear(), barSize, time)) {
            //1 day of month to prev month or to 1 day of month
            int days = Math.max(startDate.getDayOfMonth() - 1, 1);
            startDate = startDate.minusDays(days);
            time -= days * DAY_MILLISECONDS;
        }
        // start range 10-01-00-00-00 000 not included -> +1
        return time + 1;
    }

    public static long toBeginOfWeekBar(long time, long barSize) {
        return time - ((time - FIRST_MONDAY) % barSize) + 1;
    }

    public static Instant toEndOfPeriod(Instant time, long barSize, boolean correctDayTime) {
        return Instant.ofEpochMilli(toEndOfPeriod(time.toEpochMilli(), barSize, correctDayTime));
    }

    public static long toEndOfPeriod(long time, long barSize, boolean correctDayTime) {
        if (correctDayTime) {
            //because we move forward in all algorithm, but here we move back without this if
            if (time % DAY_MILLISECONDS > 0) {
                time += DAY_MILLISECONDS;
            }
            time = toBeginOfDay(time);
        }
        if (isWeekBar(barSize)) {
            return toEndOfWeekBar(time, barSize);
        }
        LocalDate endDate = LocalDateTime.ofEpochSecond(time / 1000,0, ZoneOffset.UTC).toLocalDate();
        while (endDate.getDayOfMonth() != 1 || !isBeginOfPeriod(endDate.getDayOfYear(), barSize, time)) {
            //to last day of month or to next month
            long days = Math.max(endDate.lengthOfMonth() - endDate.getDayOfMonth(), 1);
            endDate = endDate.plusDays(days);
            time += days * DAY_MILLISECONDS;
        }
        // end range 11-01-00-00-00 000 included
        return time;
    }

    public static long toEndOfWeekBar(long time, long barSize) {
        return ((time - FIRST_MONDAY) % barSize) == 0 ? time : time + barSize - ((time - FIRST_MONDAY) % barSize);
    }

    public static long getTransformationTimestamp(long timestamp, long periodicity) {
        if (isDynamicBar(periodicity)) {
            return toEndOfPeriod(timestamp, periodicity, true);
        } else {
            return timestamp % periodicity == 0 ? timestamp : timestamp + periodicity - (timestamp % periodicity);
        }
    }

    public static long getTransformationStopBarTimestamp(long timestamp, long periodicity) {
        if (isDynamicBar(periodicity)) {
            return toEndOfPeriod(timestamp, periodicity, true);
        } else {
            return timestamp % periodicity == 0 ? timestamp : timestamp + periodicity - (timestamp % periodicity) + 1;
        }
    }

    public static Instant roundStartTime(Instant startTime, long pointInterval) {
        if (isDynamicBar(pointInterval)) {
            return toBeginOfPeriod(startTime, pointInterval, true);
        } else {
            //+1 because of left border not included into interval
            return Instant.ofEpochMilli((startTime.toEpochMilli() / pointInterval) * pointInterval + 1);
        }
    }

    public static Instant roundEndTime(Instant endTime, long pointInterval) {
        return Instant.ofEpochMilli(roundEndTime(endTime.toEpochMilli(), pointInterval));
    }

    public static long roundEndTime(long endTime, long pointInterval) {
        if (isDynamicBar(pointInterval)) {
            return toEndOfPeriod(endTime, pointInterval, true);
        } else {
            return endTime % pointInterval == 0 ? endTime : (endTime / pointInterval) * pointInterval + pointInterval;
        }
    }

    private static boolean isBeginOfPeriod(int dayOfYear, long barSize, long time) {
        return (dayOfYear % (barSize / DAY_MILLISECONDS)) < MAX_ALLOWABLE_DEVIATION_BEGIN_OF_YEAR && startFromBeginOfYear(barSize) || //2,3,4,6 month
                !startFromBeginOfYear(barSize) && (time % barSize < DAY_MILLISECONDS * MAX_ALLOWABLE_DEVIATION ||
                        (barSize - time % barSize) < DAY_MILLISECONDS * MAX_ALLOWABLE_DEVIATION);
    }

    private static boolean startFromBeginOfYear(long barSize) {
        return barSize > 30 * DAY_MILLISECONDS && 12 % (barSize / DAY_MILLISECONDS / 30) == 0;
    }

    private static long toBeginOfDay(long time) {
        return time - (time % DAY_MILLISECONDS);
    }
}
