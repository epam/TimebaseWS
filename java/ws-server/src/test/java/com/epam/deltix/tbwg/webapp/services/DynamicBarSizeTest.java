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
package com.epam.deltix.tbwg.webapp.services;

import com.epam.deltix.tbwg.webapp.model.charting.ChartType;
import com.epam.deltix.tbwg.webapp.services.producers.BarMessageCsvProducer;
import com.epam.deltix.tbwg.webapp.services.producers.PackageHeaderMessageGenerator;
import org.junit.Test;
import org.junit.jupiter.api.DisplayName;

import java.time.Instant;

public class DynamicBarSizeTest extends ChartingBaseTest {

    @Test
    @DisplayName("Simple BarMessage 1 week bar test")
    public void barMessageWeekTest() {
        Instant startTime = Instant.parse("2021-03-30T20:14:45.684Z");
        Instant endTime = Instant.parse("2021-04-12T02:03:52.158Z");
        String streamDataFilename = "barMessageWeek.csv";
        String resultFilename = "barMessageWeekResult.json";
        BarMessageCsvProducer messageProducer = new BarMessageCsvProducer(streamDataFilename);
        runTestFullResponseCheck(WEEK_MILLIS, startTime, endTime, resultFilename, MessageType.BAR_MESSAGE, ChartType.BARS, messageProducer);
    }

    @Test
    @DisplayName("Simple BarMessage 2 week bar test")
    public void barMessage2WeekTest() {
        Instant startTime = Instant.parse("2021-03-30T20:14:45.684Z");
        Instant endTime = Instant.parse("2021-04-12T02:03:52.158Z");
        String streamDataFilename = "barMessageWeek.csv";
        String resultFilename = "barMessage2WeekResult.json";
        BarMessageCsvProducer messageProducer = new BarMessageCsvProducer(streamDataFilename);
        runTestFullResponseCheck(2 * WEEK_MILLIS, startTime, endTime, resultFilename, MessageType.BAR_MESSAGE, ChartType.BARS, messageProducer);
    }

    @Test
    @DisplayName("Simple BarMessage 1 month bar test")
    public void barMessageMonthTest() {
        Instant startTime = Instant.parse("2021-10-30T20:14:45.684Z");
        Instant endTime = Instant.parse("2021-12-01T02:03:52.158Z");
        String streamDataFilename = "barMessageMonth.csv";
        String resultFilename = "barMessageMonthResult.json";
        BarMessageCsvProducer messageProducer = new BarMessageCsvProducer(streamDataFilename);
        runTestFullResponseCheck(MONTH_MILLIS, startTime, endTime, resultFilename, MessageType.BAR_MESSAGE, ChartType.BARS, messageProducer);
    }

    @Test
    @DisplayName("Simple BarMessage 2 month bar test")
    public void barMessage2MonthTest() {
        Instant startTime = Instant.parse("2021-10-30T20:14:45.684Z");
        Instant endTime = Instant.parse("2021-12-01T02:03:52.158Z");
        String streamDataFilename = "barMessageMonth.csv";
        String resultFilename = "barMessage2MonthResult.json";
        BarMessageCsvProducer messageProducer = new BarMessageCsvProducer(streamDataFilename);
        runTestFullResponseCheck(2 * MONTH_MILLIS, startTime, endTime, resultFilename, MessageType.BAR_MESSAGE, ChartType.BARS, messageProducer);
    }

    @Test
    @DisplayName("Simple BarMessage 1 quarter bar test")
    public void barMessageQuarterTest() {
        Instant startTime = Instant.parse("2021-08-30T20:14:45.684Z");
        Instant endTime = Instant.parse("2021-12-01T02:03:52.158Z");
        String streamDataFilename = "barMessageQuarter.csv";
        String resultFilename = "barMessageQuarterResult.json";
        BarMessageCsvProducer messageProducer = new BarMessageCsvProducer(streamDataFilename);
        runTestFullResponseCheck(QUARTER_MILLIS, startTime, endTime, resultFilename, MessageType.BAR_MESSAGE, ChartType.BARS, messageProducer);
    }

    @Test
    @DisplayName("Simple BarMessage 4 month bar test")
    public void barMessage4MonthTest() {
        Instant startTime = Instant.parse("2021-10-30T20:14:45.684Z");
        Instant endTime = Instant.parse("2021-12-01T02:03:52.158Z");
        String streamDataFilename = "barMessageMonth.csv";
        String resultFilename = "barMessage4MonthResult.json";
        BarMessageCsvProducer messageProducer = new BarMessageCsvProducer(streamDataFilename);
        runTestFullResponseCheck(4 * MONTH_MILLIS, startTime, endTime, resultFilename, MessageType.BAR_MESSAGE, ChartType.BARS, messageProducer);
    }

    @Test
    @DisplayName("Simple BarMessage 5 month bar test")
    public void barMessage5MonthTest() {
        Instant startTime = Instant.parse("2021-03-30T20:14:45.684Z");
        Instant endTime = Instant.parse("2021-05-01T02:03:52.158Z");
        String streamDataFilename = "barMessageYear.csv";
        String resultFilename = "barMessage5MonthResult.json";
        BarMessageCsvProducer messageProducer = new BarMessageCsvProducer(streamDataFilename);
        runTestFullResponseCheck(5 * MONTH_MILLIS, startTime, endTime, resultFilename, MessageType.BAR_MESSAGE, ChartType.BARS, messageProducer);
    }

    @Test
    @DisplayName("Simple BarMessage 6 month bar test")
    public void barMessage6MonthTest() {
        Instant startTime = Instant.parse("2021-03-30T20:14:45.684Z");
        Instant endTime = Instant.parse("2021-05-01T02:03:52.158Z");
        String streamDataFilename = "barMessageYear.csv";
        String resultFilename = "barMessage6MonthResult.json";
        BarMessageCsvProducer messageProducer = new BarMessageCsvProducer(streamDataFilename);
        runTestFullResponseCheck(6 * MONTH_MILLIS, startTime, endTime, resultFilename, MessageType.BAR_MESSAGE, ChartType.BARS, messageProducer);
    }

    @Test
    @DisplayName("Simple BarMessage 7 month bar test")
    public void barMessage7MonthTest() {
        Instant startTime = Instant.parse("2021-03-30T20:14:45.684Z");
        Instant endTime = Instant.parse("2021-05-01T02:03:52.158Z");
        String streamDataFilename = "barMessageYear.csv";
        String resultFilename = "barMessage7MonthResult.json";
        BarMessageCsvProducer messageProducer = new BarMessageCsvProducer(streamDataFilename);
        runTestFullResponseCheck(7 * MONTH_MILLIS, startTime, endTime, resultFilename, MessageType.BAR_MESSAGE, ChartType.BARS, messageProducer);
    }

    @Test
    @DisplayName("Simple BarMessage 1 year bar test")
    public void barMessageYearTest() {
        Instant startTime = Instant.parse("2021-10-30T20:14:45.684Z");
        Instant endTime = Instant.parse("2021-12-01T02:03:52.158Z");
        String streamDataFilename = "barMessageYear.csv";
        String resultFilename = "barMessageYearResult.json";
        BarMessageCsvProducer messageProducer = new BarMessageCsvProducer(streamDataFilename);
        runTestFullResponseCheck(YEAR_MILLIS, startTime, endTime, resultFilename, MessageType.BAR_MESSAGE, ChartType.BARS, messageProducer);
    }

    @Test
    @DisplayName("Simple PackageHeader 1 week bar test")
    public void packageHeaderWeekTest() {
        Instant startTime = Instant.parse("2021-11-27T20:14:45.684Z");
        Instant endTime = Instant.parse("2021-12-01T02:03:52.158Z");
        String resultFilename = "packageHeaderWeekResult.json";
        PackageHeaderMessageGenerator messageProducer = new PackageHeaderMessageGenerator(0, startTime.toEpochMilli() - 2 * WEEK_MILLIS,
                endTime.toEpochMilli() + 2 * WEEK_MILLIS, 6 * HOUR_MILLIS, 5, 1000, 10, 10);
        runTestFullResponseCheck(WEEK_MILLIS, startTime, endTime, resultFilename, MessageType.PACKAGE_HEADER, ChartType.BARS, messageProducer);
    }

    @Test
    @DisplayName("Simple PackageHeader 2 week bar test")
    public void packageHeader2WeekTest() {
        Instant startTime = Instant.parse("2021-11-17T20:14:45.684Z");
        Instant endTime = Instant.parse("2021-12-01T02:03:52.158Z");
        String resultFilename = "packageHeader2WeekResult.json";
        PackageHeaderMessageGenerator messageProducer = new PackageHeaderMessageGenerator(0, startTime.toEpochMilli() - 3 * WEEK_MILLIS,
                endTime.toEpochMilli() + 3 * WEEK_MILLIS, 6 * HOUR_MILLIS, 5, 1000, 10, 10);
        runTestFullResponseCheck(2 * WEEK_MILLIS, startTime, endTime, resultFilename, MessageType.PACKAGE_HEADER, ChartType.BARS, messageProducer);
    }

    @Test
    @DisplayName("Simple PackageHeader 1 month bar test")
    public void packageHeaderMonthTest() {
        Instant startTime = Instant.parse("2021-10-30T20:14:45.684Z");
        Instant endTime = Instant.parse("2021-12-01T02:03:52.158Z");
        String resultFilename = "packageHeaderMonthResult.json";
        PackageHeaderMessageGenerator messageProducer = new PackageHeaderMessageGenerator(0, startTime.toEpochMilli() - 2 * MONTH_MILLIS,
                endTime.toEpochMilli() + 2 * MONTH_MILLIS, DAY_MILLIS, 5, 1000, 10, 10);
        runTestFullResponseCheck(MONTH_MILLIS, startTime, endTime, resultFilename, MessageType.PACKAGE_HEADER, ChartType.BARS, messageProducer);
    }

    @Test
    @DisplayName("Simple PackageHeader 2 month bar test")
    public void packageHeader2MonthTest() {
        Instant startTime = Instant.parse("2021-09-30T20:14:45.684Z");
        Instant endTime = Instant.parse("2021-12-01T02:03:52.158Z");
        String resultFilename = "packageHeader2MonthResult.json";
        PackageHeaderMessageGenerator messageProducer = new PackageHeaderMessageGenerator(0, startTime.toEpochMilli() - 4 * MONTH_MILLIS,
                endTime.toEpochMilli() + 4 * MONTH_MILLIS, DAY_MILLIS, 5, 1000, 10, 10);
        runTestFullResponseCheck(2 * MONTH_MILLIS, startTime, endTime, resultFilename, MessageType.PACKAGE_HEADER, ChartType.BARS, messageProducer);
    }

    @Test
    @DisplayName("Simple PackageHeader 1 quarter bar test")
    public void packageHeaderQuarterTest() {
        Instant startTime = Instant.parse("2021-05-30T20:14:45.684Z");
        Instant endTime = Instant.parse("2021-11-15T02:03:52.158Z");
        String resultFilename = "packageHeaderQuarterResult.json";
        PackageHeaderMessageGenerator messageProducer = new PackageHeaderMessageGenerator(0, startTime.toEpochMilli() - 2 * QUARTER_MILLIS,
                endTime.toEpochMilli() + 2 * QUARTER_MILLIS, DAY_MILLIS, 5, 1000, 10, 10);
        runTestFullResponseCheck(QUARTER_MILLIS, startTime, endTime, resultFilename, MessageType.PACKAGE_HEADER, ChartType.BARS, messageProducer);
    }

    @Test
    @DisplayName("Simple PackageHeader 4 month bar test")
    public void packageHeader4MonthTest() {
        Instant startTime = Instant.parse("2021-05-30T20:14:45.684Z");
        Instant endTime = Instant.parse("2021-12-01T02:03:52.158Z");
        String resultFilename = "packageHeader4MonthResult.json";
        PackageHeaderMessageGenerator messageProducer = new PackageHeaderMessageGenerator(0, startTime.toEpochMilli() - 6 * MONTH_MILLIS,
                endTime.toEpochMilli() , 3 * DAY_MILLIS, 5, 1000, 10, 10);
        runTestFullResponseCheck(4 * MONTH_MILLIS, startTime, endTime, resultFilename, MessageType.PACKAGE_HEADER, ChartType.BARS, messageProducer);
    }

    @Test
    @DisplayName("Simple PackageHeader 5 month bar test")
    public void packageHeader5MonthTest() {
        Instant startTime = Instant.parse("2021-03-30T20:14:45.684Z");
        Instant endTime = Instant.parse("2021-12-01T02:03:52.158Z");
        String resultFilename = "packageHeader5MonthResult.json";
        PackageHeaderMessageGenerator messageProducer = new PackageHeaderMessageGenerator(0, startTime.toEpochMilli() - 10 * MONTH_MILLIS,
                endTime.toEpochMilli(), 3 * DAY_MILLIS, 5, 1000, 10, 10);
        runTestFullResponseCheck(5 * MONTH_MILLIS, startTime, endTime, resultFilename, MessageType.PACKAGE_HEADER, ChartType.BARS, messageProducer);
    }

    @Test
    @DisplayName("Simple PackageHeader 6 month bar test")
    public void packageHeader6MonthTest() {
        Instant startTime = Instant.parse("2021-03-30T20:14:45.684Z");
        Instant endTime = Instant.parse("2021-12-01T02:03:52.158Z");
        String resultFilename = "packageHeader6MonthResult.json";
        PackageHeaderMessageGenerator messageProducer = new PackageHeaderMessageGenerator(0, startTime.toEpochMilli() - 12 * MONTH_MILLIS,
                endTime.toEpochMilli() + 12 * MONTH_MILLIS, 3 * DAY_MILLIS, 5, 1000, 10, 10);
        runTestFullResponseCheck(6 * MONTH_MILLIS, startTime, endTime, resultFilename, MessageType.PACKAGE_HEADER, ChartType.BARS, messageProducer);
    }

    @Test
    @DisplayName("Simple PackageHeader 7 month bar test")
    public void packageHeader7MonthTest() {
        Instant startTime = Instant.parse("2021-03-30T20:14:45.684Z");
        Instant endTime = Instant.parse("2021-12-01T02:03:52.158Z");
        String resultFilename = "packageHeader7MonthResult.json";
        PackageHeaderMessageGenerator messageProducer = new PackageHeaderMessageGenerator(0, startTime.toEpochMilli() - 14 * MONTH_MILLIS,
                endTime.toEpochMilli() + 14 * MONTH_MILLIS, 3 * DAY_MILLIS, 5, 1000, 10, 10);
        runTestFullResponseCheck(7 * MONTH_MILLIS, startTime, endTime, resultFilename, MessageType.PACKAGE_HEADER, ChartType.BARS, messageProducer);
    }

    @Test
    @DisplayName("Simple PackageHeader 1 year bar test")
    public void packageHeaderYearTest() {
        Instant startTime = Instant.parse("2020-10-30T20:14:45.684Z");
        Instant endTime = Instant.parse("2021-05-01T02:03:52.158Z");
        String resultFilename = "packageHeaderYearResult.json";
        PackageHeaderMessageGenerator messageProducer = new PackageHeaderMessageGenerator(0, startTime.toEpochMilli() - 2 * YEAR_MILLIS,
                endTime.toEpochMilli() + 2 * YEAR_MILLIS, 3 * DAY_MILLIS, 5, 1000, 10, 10);
        runTestFullResponseCheck(YEAR_MILLIS, startTime, endTime, resultFilename, MessageType.PACKAGE_HEADER, ChartType.BARS, messageProducer);
    }

}
