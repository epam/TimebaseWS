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
import org.junit.Ignore;
import org.junit.Test;
import org.junit.jupiter.api.DisplayName;

import java.time.Instant;

public class DynamicBarSizeStartEndTest extends ChartingBaseTest {

    @Test
    @DisplayName("Start/end time close to bar borders BarMessage 1 week bar test")
    @Ignore
    public void barMessageWeekBordersTest() {
        Instant startTime = Instant.parse("2021-03-29T00:00:00.001Z");
        Instant endTime = Instant.parse("2021-04-04T00:00:00.000Z");
        String streamDataFilename = "barMessageWeek.csv";
        String resultFilename = "startEnd/barMessageWeekBordersResult.json";
        BarMessageCsvProducer messageProducer = new BarMessageCsvProducer(streamDataFilename);
        runTestFullResponseCheck(WEEK_MILLIS, startTime, endTime, resultFilename, MessageType.BAR_MESSAGE, ChartType.BARS, messageProducer);
    }

    @Test
    @DisplayName("Start/end time close to bar borders BarMessage 2 week bar test")
    @Ignore
    public void barMessage2WeekBordersTest() {
        Instant startTime = Instant.parse("2021-03-22T00:00:00.001Z");
        Instant endTime = Instant.parse("2021-04-04T00:00:00.000Z");
        String streamDataFilename = "barMessageWeek.csv";
        String resultFilename = "startEnd/barMessage2WeekBordersResult.json";
        BarMessageCsvProducer messageProducer = new BarMessageCsvProducer(streamDataFilename);
        runTestFullResponseCheck(2 * WEEK_MILLIS, startTime, endTime, resultFilename, MessageType.BAR_MESSAGE, ChartType.BARS, messageProducer);
    }

    @Test
    @DisplayName("Start/end time close to bar borders BarMessage 1 month bar test")
    @Ignore
    public void barMessageMonthBordersTest() {
        Instant startTime = Instant.parse("2021-10-01T00:00:00.001Z");
        Instant endTime = Instant.parse("2021-11-01T00:00:00.000Z");
        String streamDataFilename = "startEnd/barMessageMonthBorders.csv";
        String resultFilename = "startEnd/barMessageMonthBordersResult.json";
        BarMessageCsvProducer messageProducer = new BarMessageCsvProducer(streamDataFilename);
        runTestFullResponseCheck(MONTH_MILLIS, startTime, endTime, resultFilename, MessageType.BAR_MESSAGE, ChartType.BARS, messageProducer);
    }

    @Test
    @DisplayName("Start/end time close to bar borders BarMessage 2 month bar test")
    @Ignore
    public void barMessage2MonthBordersTest() {
        Instant startTime = Instant.parse("2021-09-01T00:00:00.001Z");
        Instant endTime = Instant.parse("2021-11-01T00:00:00.000Z");
        String streamDataFilename = "startEnd/barMessageMonthBorders.csv";
        String resultFilename = "startEnd/barMessage2MonthBordersResult.json";
        BarMessageCsvProducer messageProducer = new BarMessageCsvProducer(streamDataFilename);
        runTestFullResponseCheck(2 * MONTH_MILLIS, startTime, endTime, resultFilename, MessageType.BAR_MESSAGE, ChartType.BARS, messageProducer);
    }

    @Test
    @DisplayName("Start/end time close to bar borders BarMessage 1 quarter bar test")
    @Ignore
    public void barMessageQuarterBordersTest() {
        Instant startTime = Instant.parse("2021-10-01T00:00:00.001Z");
        Instant endTime = Instant.parse("2022-01-01T00:00:00.000Z");
        String streamDataFilename = "startEnd/barMessageQuarterBorders.csv";
        String resultFilename = "startEnd/barMessageQuarterBordersResult.json";
        BarMessageCsvProducer messageProducer = new BarMessageCsvProducer(streamDataFilename);
        runTestFullResponseCheck(QUARTER_MILLIS, startTime, endTime, resultFilename, MessageType.BAR_MESSAGE, ChartType.BARS, messageProducer);
    }

    @Test
    @DisplayName("Start/end time close to bar borders BarMessage 4 month bar test")
    @Ignore
    public void barMessage4MonthBordersTest() {
        Instant startTime = Instant.parse("2021-05-01T00:00:00.001Z");
        Instant endTime = Instant.parse("2021-08-01T00:00:00.000Z");
        String streamDataFilename = "startEnd/barMessageYearBorders.csv";
        String resultFilename = "startEnd/barMessage4MonthBordersResult.json";
        BarMessageCsvProducer messageProducer = new BarMessageCsvProducer(streamDataFilename);
        runTestFullResponseCheck(4 * MONTH_MILLIS, startTime, endTime, resultFilename, MessageType.BAR_MESSAGE, ChartType.BARS, messageProducer);
    }

    @Test
    @DisplayName("Start/end time close to bar borders BarMessage 5 month bar test")
    @Ignore
    public void barMessage5MonthBordersTest() {
        Instant startTime = Instant.parse("2021-05-01T00:00:00.001Z");
        Instant endTime = Instant.parse("2021-10-01T00:00:00.000Z");
        String streamDataFilename = "startEnd/barMessageYearBorders.csv";
        String resultFilename = "startEnd/barMessage5MonthBordersResult.json";
        BarMessageCsvProducer messageProducer = new BarMessageCsvProducer(streamDataFilename);
        runTestFullResponseCheck(5 * MONTH_MILLIS, startTime, endTime, resultFilename, MessageType.BAR_MESSAGE, ChartType.BARS, messageProducer);
    }

    @Test
    @DisplayName("Start/end time close to bar borders BarMessage 6 month bar test")
    @Ignore
    public void barMessage6MonthBordersTest() {
        Instant startTime = Instant.parse("2021-01-01T00:00:00.001Z");
        Instant endTime = Instant.parse("2021-07-01T00:00:00.000Z");
        String streamDataFilename = "startEnd/barMessageYearBorders.csv";
        String resultFilename = "startEnd/barMessage6MonthBordersResult.json";
        BarMessageCsvProducer messageProducer = new BarMessageCsvProducer(streamDataFilename);
        runTestFullResponseCheck(6 * MONTH_MILLIS, startTime, endTime, resultFilename, MessageType.BAR_MESSAGE, ChartType.BARS, messageProducer);
    }

    @Test
    @DisplayName("Start/end time close to bar borders BarMessage 7 month bar test")
    @Ignore
    public void barMessage7MonthBordersTest() {
        Instant startTime = Instant.parse("2021-03-01T00:00:00.001Z");
        Instant endTime = Instant.parse("2021-10-01T00:00:00.000Z");
        String streamDataFilename = "startEnd/barMessageYearBorders.csv";
        String resultFilename = "startEnd/barMessage7MonthBordersResult.json";
        BarMessageCsvProducer messageProducer = new BarMessageCsvProducer(streamDataFilename);
        runTestFullResponseCheck(7 * MONTH_MILLIS, startTime, endTime, resultFilename, MessageType.BAR_MESSAGE, ChartType.BARS, messageProducer);
    }

    @Test
    @DisplayName("Start/end time close to bar borders BarMessage 1 year bar test")
    @Ignore
    public void barMessageYearBordersTest() {
        Instant startTime = Instant.parse("2021-01-01T00:00:00.001Z");
        Instant endTime = Instant.parse("2022-01-01T00:00:00.000Z");
        String streamDataFilename = "startEnd/barMessageYearBorders.csv";
        String resultFilename = "startEnd/barMessageYearBordersResult.json";
        BarMessageCsvProducer messageProducer = new BarMessageCsvProducer(streamDataFilename);
        runTestFullResponseCheck(YEAR_MILLIS, startTime, endTime, resultFilename, MessageType.BAR_MESSAGE, ChartType.BARS, messageProducer);
    }


    @Test
    @DisplayName("Start/end time close to bar borders PackageHeader 1 week bar test")
    public void packageHeaderWeekBordersTest() {
        Instant startTime = Instant.parse("2021-10-04T00:00:00.001Z");
        Instant endTime = Instant.parse("2021-10-11T00:00:00.000Z");
        String resultFilename = "startEnd/packageHeaderWeekBordersResult.json";
        PackageHeaderMessageGenerator messageProducer = new PackageHeaderMessageGenerator(0, startTime.toEpochMilli() - 2 * WEEK_MILLIS,
                endTime.toEpochMilli() + 2 * WEEK_MILLIS, 6 * HOUR_MILLIS, 3, 1000, 10, 10);
        runTestFullResponseCheck(WEEK_MILLIS, startTime, endTime, resultFilename, MessageType.PACKAGE_HEADER, ChartType.BARS, messageProducer);
    }

    @Test
    @DisplayName("Start/end time close to bar borders PackageHeader 2 week bar test")
    public void packageHeader2WeekBordersTest() {
        Instant startTime = Instant.parse("2021-10-04T00:00:00.001Z");
        Instant endTime = Instant.parse("2021-10-18T00:00:00.000Z");
        String resultFilename = "startEnd/packageHeader2WeekBordersResult.json";
        PackageHeaderMessageGenerator messageProducer = new PackageHeaderMessageGenerator(0, startTime.toEpochMilli() - 4 * WEEK_MILLIS,
                endTime.toEpochMilli() + 4 * WEEK_MILLIS, 6 * HOUR_MILLIS, 3, 1000, 10, 10);
        runTestFullResponseCheck(2 * WEEK_MILLIS, startTime, endTime, resultFilename, MessageType.PACKAGE_HEADER, ChartType.BARS, messageProducer);
    }

    @Test
    @DisplayName("Start/end time close to bar borders PackageHeader 1 month bar test")
    public void packageHeaderMonthBordersTest() {
        Instant startTime = Instant.parse("2021-10-01T00:00:00.001Z");
        Instant endTime = Instant.parse("2021-11-01T00:00:00.000Z");
        String resultFilename = "startEnd/packageHeaderMonthBordersResult.json";
        PackageHeaderMessageGenerator messageProducer = new PackageHeaderMessageGenerator(0, startTime.toEpochMilli() - 2 * MONTH_MILLIS,
                endTime.toEpochMilli() + 2 * MONTH_MILLIS, DAY_MILLIS, 3, 1000, 10, 10);
        runTestFullResponseCheck(MONTH_MILLIS, startTime, endTime, resultFilename, MessageType.PACKAGE_HEADER, ChartType.BARS, messageProducer);
    }

    @Test
    @DisplayName("Start/end time close to bar borders PackageHeader 1 month bar test")
    public void packageHeader2MonthBordersTest() {
        Instant startTime = Instant.parse("2021-09-01T00:00:00.001Z");
        Instant endTime = Instant.parse("2021-11-01T00:00:00.000Z");
        String resultFilename = "startEnd/packageHeader2MonthBordersResult.json";
        PackageHeaderMessageGenerator messageProducer = new PackageHeaderMessageGenerator(0, startTime.toEpochMilli() - 4 * MONTH_MILLIS,
                endTime.toEpochMilli() + 4 * MONTH_MILLIS, DAY_MILLIS, 3, 1000, 10, 10);
        runTestFullResponseCheck(2 * MONTH_MILLIS, startTime, endTime, resultFilename, MessageType.PACKAGE_HEADER, ChartType.BARS, messageProducer);
    }

    @Test
    @DisplayName("Start/end time close to bar borders PackageHeader 1 quarter bar test")
    public void packageHeaderQuarterBordersTest() {
        Instant startTime = Instant.parse("2021-10-01T00:00:00.001Z");
        Instant endTime = Instant.parse("2022-01-01T00:00:00.000Z");
        String resultFilename = "startEnd/packageHeaderQuarterBordersResult.json";
        PackageHeaderMessageGenerator messageProducer = new PackageHeaderMessageGenerator(0, startTime.toEpochMilli() - 2 * QUARTER_MILLIS,
                endTime.toEpochMilli() + 2 * QUARTER_MILLIS, DAY_MILLIS, 3, 1000, 10, 10);
        runTestFullResponseCheck(QUARTER_MILLIS, startTime, endTime, resultFilename, MessageType.PACKAGE_HEADER, ChartType.BARS, messageProducer);
    }

    @Test
    @DisplayName("Start/end time close to bar borders PackageHeader 4 month bar test")
    public void packageHeader4MonthBordersTest() {
        Instant startTime = Instant.parse("2021-05-01T00:00:00.001Z");
        Instant endTime = Instant.parse("2021-09-01T00:00:00.000Z");
        String resultFilename = "startEnd/packageHeader4MonthBordersResult.json";
        PackageHeaderMessageGenerator messageProducer = new PackageHeaderMessageGenerator(0, startTime.toEpochMilli() - 8 * MONTH_MILLIS,
                endTime.toEpochMilli() + 8 * MONTH_MILLIS, DAY_MILLIS, 3, 1000, 10, 10);
        runTestFullResponseCheck(4 * MONTH_MILLIS, startTime, endTime, resultFilename, MessageType.PACKAGE_HEADER, ChartType.BARS, messageProducer);
    }

    @Test
    @DisplayName("Start/end time close to bar borders PackageHeader 5 month bar test")
    public void packageHeader5MonthBordersTest() {
        Instant startTime = Instant.parse("2021-05-01T00:00:00.001Z");
        Instant endTime = Instant.parse("2021-10-01T00:00:00.000Z");
        String resultFilename = "startEnd/packageHeader5MonthBordersResult.json";
        PackageHeaderMessageGenerator messageProducer = new PackageHeaderMessageGenerator(0, startTime.toEpochMilli() - 10 * MONTH_MILLIS,
                endTime.toEpochMilli() + 10 * MONTH_MILLIS, DAY_MILLIS, 3, 1000, 10, 10);
        runTestFullResponseCheck(5 * MONTH_MILLIS, startTime, endTime, resultFilename, MessageType.PACKAGE_HEADER, ChartType.BARS, messageProducer);
    }

    @Test
    @DisplayName("Start/end time close to bar borders PackageHeader 6 month bar test")
    public void packageHeader6MonthBordersTest() {
        Instant startTime = Instant.parse("2021-01-01T00:00:00.001Z");
        Instant endTime = Instant.parse("2021-07-01T00:00:00.000Z");
        String resultFilename = "startEnd/packageHeader6MonthBordersResult.json";
        PackageHeaderMessageGenerator messageProducer = new PackageHeaderMessageGenerator(0, startTime.toEpochMilli() - 12 * MONTH_MILLIS,
                endTime.toEpochMilli() + 12 * MONTH_MILLIS, DAY_MILLIS, 3, 1000, 10, 10);
        runTestFullResponseCheck(6 * MONTH_MILLIS, startTime, endTime, resultFilename, MessageType.PACKAGE_HEADER, ChartType.BARS, messageProducer);
    }

    @Test
    @DisplayName("Start/end time close to bar borders PackageHeader 7 month bar test")
    public void packageHeader7MonthBordersTest() {
        Instant startTime = Instant.parse("2021-03-01T00:00:00.001Z");
        Instant endTime = Instant.parse("2021-10-01T00:00:00.000Z");
        String resultFilename = "startEnd/packageHeader7MonthBordersResult.json";
        PackageHeaderMessageGenerator messageProducer = new PackageHeaderMessageGenerator(0, startTime.toEpochMilli() - 14 * MONTH_MILLIS,
                endTime.toEpochMilli() + 14 * MONTH_MILLIS, DAY_MILLIS, 3, 1000, 10, 10);
        runTestFullResponseCheck(7 * MONTH_MILLIS, startTime, endTime, resultFilename, MessageType.PACKAGE_HEADER, ChartType.BARS, messageProducer);
    }

    @Test
    @DisplayName("Start/end time close to bar borders PackageHeader 1 year bar test")
    public void packageHeaderYearBordersTest() {
        Instant startTime = Instant.parse("2021-01-01T00:00:00.000Z");
        Instant endTime = Instant.parse("2022-01-01T00:00:00.000Z");
        String resultFilename = "startEnd/packageHeaderYearBordersResult.json";
        PackageHeaderMessageGenerator messageProducer = new PackageHeaderMessageGenerator(0, startTime.toEpochMilli() - 2 * YEAR_MILLIS,
                endTime.toEpochMilli() + 2 * YEAR_MILLIS, DAY_MILLIS, 3, 1000, 10, 10);
        runTestFullResponseCheck(YEAR_MILLIS, startTime, endTime, resultFilename, MessageType.PACKAGE_HEADER, ChartType.BARS, messageProducer);
    }

}
