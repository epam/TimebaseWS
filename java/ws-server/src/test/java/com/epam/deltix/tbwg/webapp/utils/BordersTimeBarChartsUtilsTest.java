/*
 * Copyright 2023 EPAM Systems, Inc
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

import org.junit.Test;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Arrays;
import java.util.List;
import java.util.Random;

import static com.epam.deltix.tbwg.webapp.utils.BordersTimeBarChartsUtils.*;
import static org.junit.Assert.assertEquals;

public class BordersTimeBarChartsUtilsTest {

    public static int COUNT_PER_TEST = 1_000;
    private final Random random = new Random(0);

    @Test
    public void toBeginOfPeriodTest() {
        List<Long> barSizes = Arrays.asList(30 * 24 * 60 * 60 * 1000L, // month
                60 * 24 * 60 * 60 * 1000L, // 2 month
                90 * 24 * 60 * 60 * 1000L, // quarter
                120 * 24 * 60 * 60 * 1000L, // 4 month
                180 * 24 * 60 * 60 * 1000L, // half of year
                365 * 24 * 60 * 60 * 1000L); // year
        for (long barSize : barSizes) {
            for (int i = 0; i < COUNT_PER_TEST; i++) {
                long originalTime = random.nextLong() % 2524608000L; // 01.01.2050
                if (originalTime < 0) {
                    originalTime *= -1;
                }

                assertEquals("Flag correct day time not work, for Instant", 1, toBeginOfPeriod(Instant.ofEpochMilli(originalTime), barSize, true).toEpochMilli() % (24 * 60 * 60 * 1000L)); // +1 for not included border
                assertEquals("Flag correct day time not work", 1, toBeginOfPeriod(originalTime, barSize, true) % (24 * 60 * 60 * 1000L)); // +1 for not included border

                long checkTime = originalTime;
                checkTime -= (checkTime % (24 * 60 * 60 * 1000L));
                LocalDate date = LocalDateTime.ofEpochSecond(checkTime / 1000, 0, ZoneOffset.UTC).toLocalDate();
                while (date.getDayOfMonth() != 1 ||
                        (barSize == 365 * 24 * 60 * 60 * 1000L && date.getMonthValue() != 1) ||
                        (barSize == 180 * 24 * 60 * 60 * 1000L && date.getMonthValue() % 6 != 1) ||
                        (barSize == 120 * 24 * 60 * 60 * 1000L && date.getMonthValue() % 4 != 1) ||
                        (barSize == 90 * 24 * 60 * 60 * 1000L && date.getMonthValue() % 3 != 1) ||
                        (barSize == 60 * 24 * 60 * 60 * 1000L && date.getMonthValue() % 2 != 1)) {
                    date = date.minusDays(1);
                    checkTime -= 24 * 60 * 60 * 1000L;
                }

                assertEquals("For time = " + Instant.ofEpochMilli(originalTime) + " and barSize = " + barSize + " (month = " + barSize / (30 * 24 * 60 * 60 * 1000L) + ") result not match, for Instant", Instant.ofEpochMilli(checkTime + 1), toBeginOfPeriod(Instant.ofEpochMilli(originalTime), barSize, true));
                assertEquals("For time = " + originalTime + " and barSize = " + barSize + " (month = " + barSize / (30 * 24 * 60 * 60 * 1000L) + ") result not match", checkTime + 1, toBeginOfPeriod(originalTime, barSize, true));
            }
        }
    }

    @Test
    public void toEndOfPeriodTest() {
        List<Long> barSizes = Arrays.asList(30 * 24 * 60 * 60 * 1000L, // month
                60 * 24 * 60 * 60 * 1000L, // 2 month
                90 * 24 * 60 * 60 * 1000L, // quarter
                120 * 24 * 60 * 60 * 1000L, // 4 month
                180 * 24 * 60 * 60 * 1000L, // half of year
                365 * 24 * 60 * 60 * 1000L); // year
        for (long barSize : barSizes) {
            for (int i = 0; i < COUNT_PER_TEST; i++) {
                long originalTime = random.nextLong() % 2524608000L; // 01.01.2050
                if (originalTime < 0) {
                    originalTime *= -1;
                }
                assertEquals("Flag correct day time not work", 0, toEndOfPeriod(originalTime, barSize, true) % (24 * 60 * 60 * 1000L));
                assertEquals("Flag correct day time not work, for Instant", 0, toEndOfPeriod(Instant.ofEpochMilli(originalTime), barSize, true).toEpochMilli() % (24 * 60 * 60 * 1000L));

                long checkTime = originalTime;
                checkTime -= (checkTime % (24 * 60 * 60 * 1000L));
                checkTime += (24 * 60 * 60 * 1000L); // test for this thing in the end of test
                LocalDate date = LocalDateTime.ofEpochSecond(checkTime / 1000, 0, ZoneOffset.UTC).toLocalDate();
                while (date.getDayOfMonth() != 1 ||
                        (barSize == 365 * 24 * 60 * 60 * 1000L && date.getMonthValue() != 1) ||
                        (barSize == 180 * 24 * 60 * 60 * 1000L && date.getMonthValue() % 6 != 1) ||
                        (barSize == 120 * 24 * 60 * 60 * 1000L && date.getMonthValue() % 4 != 1) ||
                        (barSize == 90 * 24 * 60 * 60 * 1000L && date.getMonthValue() % 3 != 1) ||
                        (barSize == 60 * 24 * 60 * 60 * 1000L && date.getMonthValue() % 2 != 1)) {
                    date = date.plusDays(1);
                    checkTime += 24 * 60 * 60 * 1000L;
                }

                assertEquals("For time = " + Instant.ofEpochMilli(originalTime) + " and barSize = " + barSize + " (month = " + barSize / (30 * 24 * 60 * 60 * 1000L) + ") result not match, for Instant", Instant.ofEpochMilli(checkTime), toEndOfPeriod(Instant.ofEpochMilli(originalTime), barSize, true));
                assertEquals("For time = " + originalTime + " and barSize = " + barSize + " (month = " + barSize / (30 * 24 * 60 * 60 * 1000L) + ") result not match", checkTime, toEndOfPeriod(originalTime, barSize, true));
            }
        }

        // check that correctDayTime don't make any minus from time
        assertEquals("For time = " + Instant.ofEpochMilli(1638362910000L) + " result not match, Instant", Instant.ofEpochMilli(1640995200000L), toEndOfPeriod(Instant.ofEpochMilli(1638362910000L), 30 * 24 * 60 * 60 * 1000L, true));
        assertEquals("For time = " + Instant.ofEpochMilli(1638362910000L) + " result not match", 1640995200000L, toEndOfPeriod(1638362910000L, 30 * 24 * 60 * 60 * 1000L, true));
        assertEquals("For time = " + Instant.ofEpochMilli(1640995200000L) + " result not match, Instant", Instant.ofEpochMilli(1640995200000L), toEndOfPeriod(Instant.ofEpochMilli(1633092510000L), 90 * 24 * 60 * 60 * 1000L, true));
        assertEquals("For time = " + Instant.ofEpochMilli(1640995200000L) + " result not match", 1640995200000L, toEndOfPeriod(1633092510000L, 90 * 24 * 60 * 60 * 1000L, true));
        assertEquals("For time = " + Instant.ofEpochMilli(1640995200000L) + " result not match, Instant", Instant.ofEpochMilli(1640995200000L), toEndOfPeriod(Instant.ofEpochMilli(1609505310000L), 365 * 24 * 60 * 60 * 1000L, true));
        assertEquals("For time = " + Instant.ofEpochMilli(1640995200000L) + " result not match", 1640995200000L, toEndOfPeriod(1609505310000L, 365 * 24 * 60 * 60 * 1000L, true));
    }

    @Test
    public void roundEndTimeTest() {
        List<Long> barSizes = Arrays.asList(1000L, // 1 second
                60 * 1000L, // 1 minute
                5 * 60 * 1000L, // 5 minutes
                15 * 60 * 1000L, // 15 minutes
                30 * 60 * 1000L, // 30 minutes
                60 * 60 * 1000L, // 1 hour
                4 * 60 * 60 * 1000L, // 4 hour
                24 * 60 * 60 * 1000L // 1 day
        );
        Instant endTime = Instant.parse("2021-08-02T13:35:11.000Z");
        assertEquals(endTime, roundEndTime(endTime, barSizes.get(0)));
        endTime = Instant.parse("2021-08-02T13:37:00.000Z");
        assertEquals(endTime, roundEndTime(endTime, barSizes.get(1)));
        endTime = Instant.parse("2021-08-02T13:35:00.000Z");
        assertEquals(endTime, roundEndTime(endTime, barSizes.get(2)));
        endTime = Instant.parse("2021-08-02T13:45:00.000Z");
        assertEquals(endTime, roundEndTime(endTime, barSizes.get(3)));
        endTime = Instant.parse("2021-08-02T13:30:00.000Z");
        assertEquals(endTime, roundEndTime(endTime, barSizes.get(4)));
        endTime = Instant.parse("2021-08-02T13:00:00.000Z");
        assertEquals(endTime, roundEndTime(endTime, barSizes.get(5)));
        endTime = Instant.parse("2021-08-02T16:00:00.000Z");
        assertEquals(endTime, roundEndTime(endTime, barSizes.get(6)));
        endTime = Instant.parse("2021-08-02T00:00:00.000Z");
        assertEquals(endTime, roundEndTime(endTime, barSizes.get(7)));
    }
}