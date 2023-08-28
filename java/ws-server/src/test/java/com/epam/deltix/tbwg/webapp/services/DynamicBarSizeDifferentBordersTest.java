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
package com.epam.deltix.tbwg.webapp.services;

import com.epam.deltix.tbwg.webapp.services.producers.BarMessageCsvProducer;
import com.epam.deltix.tbwg.webapp.model.charting.ChartType;
import com.epam.deltix.tbwg.webapp.services.producers.PackageHeaderMessageGenerator;
import org.junit.Test;
import org.junit.jupiter.api.DisplayName;

import java.time.LocalDateTime;
import java.time.ZoneOffset;

public class DynamicBarSizeDifferentBordersTest extends ChartingBaseTest {

    @Test
    @DisplayName("Check that every day of month correctly mapped to bar borders BarMessage 1 week bar test")
    public void barMessageEveryMonthDayWeekTest() {
        LocalDateTime startTime = LocalDateTime.of(2021, 4, 1, 1, 1, 1);
        LocalDateTime endTime = LocalDateTime.of(2021, 4, 2, 1, 1, 1);
        String streamDataFilename = "barMessageWeek.csv";
        for (int i = 0; i < 30; i++) {
            BarMessageCsvProducer messageProducer = new BarMessageCsvProducer(streamDataFilename);
            int expectedCountOfPoints = 1;
            //days of different week like start = sunday and end = monday
            if (endTime.getDayOfWeek().compareTo(startTime.getDayOfWeek()) < 0) {
                expectedCountOfPoints++;
            }
            runTestCheckCountOfPoints(WEEK_MILLIS, startTime.toInstant(ZoneOffset.UTC), endTime.toInstant(ZoneOffset.UTC),
                    MessageType.BAR_MESSAGE, ChartType.BARS, expectedCountOfPoints, messageProducer);
            startTime = startTime.plusDays(1);
            endTime = endTime.plusDays(1);
        }
    }

    @Test
    @DisplayName("Check that every day of month correctly mapped to bar borders BarMessage 2 week bar test")
    public void barMessageEveryMonthDay2WeekTest() {
        LocalDateTime startTime = LocalDateTime.of(2021, 4, 1, 1, 1, 1);
        LocalDateTime endTime = LocalDateTime.of(2021, 4, 2, 1, 1, 1);
        String streamDataFilename = "barMessageWeek.csv";
        for (int i = 0; i < 30; i++) {
            BarMessageCsvProducer messageProducer = new BarMessageCsvProducer(streamDataFilename);
            int expectedCountOfPoints = 1;
            //days of different 2week like start = sunday and end = monday
            if (startTime.getDayOfMonth() == 4 || startTime.getDayOfMonth() == 18) {
                expectedCountOfPoints++;
            }
            runTestCheckCountOfPoints(2 * WEEK_MILLIS, startTime.toInstant(ZoneOffset.UTC), endTime.toInstant(ZoneOffset.UTC),
                    MessageType.BAR_MESSAGE, ChartType.BARS, expectedCountOfPoints, messageProducer);
            startTime = startTime.plusDays(1);
            endTime = endTime.plusDays(1);
        }
    }

    @Test
    @DisplayName("Check that every month correctly mapped to bar borders BarMessage 1 month bar test")
    public void barMessageEveryMonthMonthTest() {
        LocalDateTime startTime = LocalDateTime.of(2021, 1, 5, 1, 1, 1);
        LocalDateTime endTime = LocalDateTime.of(2021, 1, 25, 1, 1, 1);
        String streamDataFilename = "barMessageEveryMonthMonth.csv";
        for (int i = 0; i < 12; i++) {
            BarMessageCsvProducer messageProducer = new BarMessageCsvProducer(streamDataFilename);
            runTestCheckCountOfPoints(MONTH_MILLIS, startTime.toInstant(ZoneOffset.UTC), endTime.toInstant(ZoneOffset.UTC),
                    MessageType.BAR_MESSAGE, ChartType.BARS, 1, messageProducer);
            startTime = startTime.plusMonths(1);
            endTime = endTime.plusMonths(1);
        }
    }

    @Test
    @DisplayName("Check that every month correctly mapped to bar borders  BarMessage 1 quarter bar test")
    public void barMessageEveryMonthQuarterTest() {
        LocalDateTime startTime = LocalDateTime.of(2021, 1, 5, 1, 1, 1);
        LocalDateTime endTime = LocalDateTime.of(2021, 1, 25, 1, 1, 1);
        String streamDataFilename = "barMessageEveryMonthQuarter.csv";
        for (int i = 0; i < 12; i++) {
            BarMessageCsvProducer messageProducer = new BarMessageCsvProducer(streamDataFilename);
            runTestCheckCountOfPoints(QUARTER_MILLIS, startTime.toInstant(ZoneOffset.UTC), endTime.toInstant(ZoneOffset.UTC),
                    MessageType.BAR_MESSAGE, ChartType.BARS, 1, messageProducer);
            startTime = startTime.plusMonths(1);
            endTime = endTime.plusMonths(1);
        }
    }

    @Test
    @DisplayName("Check that every month correctly mapped to bar borders  BarMessage 1 year bar test")
    public void barMessageEveryMonthYearTest() {
        LocalDateTime startTime = LocalDateTime.of(2021, 1, 5, 1, 1, 1);
        LocalDateTime endTime = LocalDateTime.of(2021, 1, 25, 1, 1, 1);
        String streamDataFilename = "barMessageEveryMonthYear.csv";
        for (int i = 0; i < 12; i++) {
            BarMessageCsvProducer messageProducer = new BarMessageCsvProducer(streamDataFilename);
            runTestCheckCountOfPoints(YEAR_MILLIS, startTime.toInstant(ZoneOffset.UTC), endTime.toInstant(ZoneOffset.UTC),
                    MessageType.BAR_MESSAGE, ChartType.BARS, 1, messageProducer);
            startTime = startTime.plusMonths(1);
            endTime = endTime.plusMonths(1);
        }
    }

    @Test
    @DisplayName("Check that every day of month correctly mapped to bar borders PackageHeader 1 week bar test")
    public void packageHeaderEveryMonthDayWeekTest() {
        LocalDateTime startTime = LocalDateTime.of(2021, 4, 1, 1, 1, 1);
        LocalDateTime endTime = LocalDateTime.of(2021, 4, 2, 1, 1, 1);
        for (int i = 0; i < 30; i++) {
            PackageHeaderMessageGenerator messageProducer = new PackageHeaderMessageGenerator(0,
                    startTime.toInstant(ZoneOffset.UTC).toEpochMilli() - MONTH_MILLIS - WEEK_MILLIS,
                    endTime.toInstant(ZoneOffset.UTC).toEpochMilli() +  MONTH_MILLIS + WEEK_MILLIS,
                    4 * HOUR_MILLIS, 5, 1000, 10, 10);
            int expectedCountOfPoints = 1;
            //days of different week like start = sunday and end = monday
            if (endTime.getDayOfWeek().compareTo(startTime.getDayOfWeek()) < 0) {
                expectedCountOfPoints++;
            }
            runTestCheckCountOfPoints(WEEK_MILLIS, startTime.toInstant(ZoneOffset.UTC), endTime.toInstant(ZoneOffset.UTC),
                    MessageType.PACKAGE_HEADER, ChartType.BARS, expectedCountOfPoints, messageProducer);
            startTime = startTime.plusDays(1);
            endTime = endTime.plusDays(1);
        }
    }

    @Test
    @DisplayName("Check that every day of month correctly mapped to bar borders PackageHeader 1 week bar test")
    public void packageHeaderEveryMonthDay2WeekTest() {
        LocalDateTime startTime = LocalDateTime.of(2021, 4, 1, 1, 1, 1);
        LocalDateTime endTime = LocalDateTime.of(2021, 4, 2, 1, 1, 1);
        for (int i = 0; i < 30; i++) {
            PackageHeaderMessageGenerator messageProducer = new PackageHeaderMessageGenerator(0,
                    startTime.toInstant(ZoneOffset.UTC).toEpochMilli() - MONTH_MILLIS - WEEK_MILLIS,
                    endTime.toInstant(ZoneOffset.UTC).toEpochMilli() +  MONTH_MILLIS + WEEK_MILLIS,
                    4 * HOUR_MILLIS, 5, 1000, 10, 10);
            int expectedCountOfPoints = 1;
            //days of different week like start = sunday and end = monday
            if (startTime.getDayOfMonth() == 4 || startTime.getDayOfMonth() == 18) {
                expectedCountOfPoints++;
            }
            runTestCheckCountOfPoints(2 * WEEK_MILLIS, startTime.toInstant(ZoneOffset.UTC), endTime.toInstant(ZoneOffset.UTC),
                    MessageType.PACKAGE_HEADER, ChartType.BARS, expectedCountOfPoints, messageProducer);
            startTime = startTime.plusDays(1);
            endTime = endTime.plusDays(1);
        }
    }

    @Test
    @DisplayName("Check that every month correctly mapped to bar borders PackageHeader 1 month bar test")
    public void packageHeaderEveryMonthMonthTest() {
        LocalDateTime startTime = LocalDateTime.of(2021, 1, 5, 1, 1, 1);
        LocalDateTime endTime = LocalDateTime.of(2021, 1, 25, 1, 1, 1);
        for (int i = 0; i < 12; i++) {
            PackageHeaderMessageGenerator messageProducer = new PackageHeaderMessageGenerator(0,
                    startTime.toInstant(ZoneOffset.UTC).toEpochMilli() - 2 * MONTH_MILLIS, endTime.toInstant(ZoneOffset.UTC).toEpochMilli() + 2 * MONTH_MILLIS,
                    4 * HOUR_MILLIS, 5, 1000, 10, 10);
            runTestCheckCountOfPoints(MONTH_MILLIS, startTime.toInstant(ZoneOffset.UTC), endTime.toInstant(ZoneOffset.UTC),
                    MessageType.PACKAGE_HEADER, ChartType.BARS, 1, messageProducer);
            startTime = startTime.plusMonths(1);
            endTime = endTime.plusMonths(1);
        }
    }

    @Test
    @DisplayName("Check that every month correctly mapped to bar borders PackageHeader 1 quarter bar test")
    public void packageHeaderEveryMonthQuarterTest() {
        LocalDateTime startTime = LocalDateTime.of(2021, 1, 5, 1, 1, 1);
        LocalDateTime endTime = LocalDateTime.of(2021, 1, 25, 1, 1, 1);
        for (int i = 0; i < 12; i++) {
            PackageHeaderMessageGenerator messageProducer = new PackageHeaderMessageGenerator(0,
                    startTime.toInstant(ZoneOffset.UTC).toEpochMilli() - 2 * QUARTER_MILLIS, endTime.toInstant(ZoneOffset.UTC).toEpochMilli() + 2 * QUARTER_MILLIS,
                    4 * HOUR_MILLIS, 5, 1000, 10, 10);
            runTestCheckCountOfPoints(QUARTER_MILLIS, startTime.toInstant(ZoneOffset.UTC), endTime.toInstant(ZoneOffset.UTC),
                    MessageType.PACKAGE_HEADER, ChartType.BARS, 1, messageProducer);
            startTime = startTime.plusMonths(1);
            endTime = endTime.plusMonths(1);
        }
    }

    @Test
    @DisplayName("Check that every month correctly mapped to bar borders PackageHeader 1 year bar test")
    public void packageHeaderEveryMonthYearTest() {
        LocalDateTime startTime = LocalDateTime.of(2021, 1, 5, 1, 1, 1);
        LocalDateTime endTime = LocalDateTime.of(2021, 1, 25, 1, 1, 1);
        for (int i = 0; i < 12; i++) {
            PackageHeaderMessageGenerator messageProducer = new PackageHeaderMessageGenerator(0,
                    startTime.toInstant(ZoneOffset.UTC).toEpochMilli() - 2 * YEAR_MILLIS, endTime.toInstant(ZoneOffset.UTC).toEpochMilli() + 2 * YEAR_MILLIS,
                    4 * DAY_MILLIS, 5, 1000, 10, 10);
            runTestCheckCountOfPoints(YEAR_MILLIS, startTime.toInstant(ZoneOffset.UTC), endTime.toInstant(ZoneOffset.UTC),
                    MessageType.PACKAGE_HEADER, ChartType.BARS, 1, messageProducer);
            startTime = startTime.plusMonths(1);
            endTime = endTime.plusMonths(1);
        }
    }

}