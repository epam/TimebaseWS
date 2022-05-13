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

public class DynamicBarSizeEndTimeBugTest extends ChartingBaseTest {

    @Test
    @DisplayName("EndTime after transformation <dayTime = 00:00:00> like border, but actually should be moved forward time BarMessage 1 week bar test")
    public void barMessageWeekBordersEndTest() {
        Instant startTime = Instant.parse("2021-03-30T20:14:45.684Z");
        Instant endTime = Instant.parse("2021-04-05T02:03:52.158Z");
        String streamDataFilename = "barMessageWeek.csv";
        String resultFilename = "endTimeBug/barMessageWeekBordersEndResult.json";
        BarMessageCsvProducer messageProducer = new BarMessageCsvProducer(streamDataFilename);
        runTestFullResponseCheck(WEEK_MILLIS, startTime, endTime, resultFilename, MessageType.BAR_MESSAGE, ChartType.BARS, messageProducer);
    }

    @Test
    @DisplayName("EndTime after transformation <dayTime = 00:00:00> like border, but actually should be moved forward time BarMessage 2 week bar test")
    public void barMessage2WeekBordersEndTest() {
        Instant startTime = Instant.parse("2021-03-22T20:14:45.684Z");
        Instant endTime = Instant.parse("2021-04-05T02:03:52.158Z");
        String streamDataFilename = "barMessageWeek.csv";
        String resultFilename = "endTimeBug/barMessage2WeekBordersEndResult.json";
        BarMessageCsvProducer messageProducer = new BarMessageCsvProducer(streamDataFilename);
        runTestFullResponseCheck(2 * WEEK_MILLIS, startTime, endTime, resultFilename, MessageType.BAR_MESSAGE, ChartType.BARS, messageProducer);
    }


    @Test
    @DisplayName("EndTime after transformation <dayTime = 00:00:00> like border, but actually should be moved forward time BarMessage 1 month bar test")
    public void barMessageMonthBordersEndTest() {
        Instant startTime = Instant.parse("2021-10-01T00:00:00.001Z");
        Instant endTime = Instant.parse("2021-11-01T10:00:00.000Z");
        String streamDataFilename = "endTimeBug/barMessageMonthBordersEnd.csv";
        String resultFilename = "endTimeBug/barMessageMonthBordersEndResult.json";
        BarMessageCsvProducer messageProducer = new BarMessageCsvProducer(streamDataFilename);
        runTestFullResponseCheck(MONTH_MILLIS, startTime, endTime, resultFilename, MessageType.BAR_MESSAGE, ChartType.BARS, messageProducer);
    }

    @Test
    @DisplayName("EndTime after transformation <dayTime = 00:00:00> like border, but actually should be moved forward time BarMessage 2 month bar test")
    public void barMessage2MonthBordersEndTest() {
        Instant startTime = Instant.parse("2021-10-01T00:00:00.001Z");
        Instant endTime = Instant.parse("2021-12-01T10:00:00.000Z");
        String streamDataFilename = "endTimeBug/barMessageMonthBordersEnd.csv";
        String resultFilename = "endTimeBug/barMessage2MonthBordersEndResult.json";
        BarMessageCsvProducer messageProducer = new BarMessageCsvProducer(streamDataFilename);
        runTestFullResponseCheck(2 * MONTH_MILLIS, startTime, endTime, resultFilename, MessageType.BAR_MESSAGE, ChartType.BARS, messageProducer);
    }

    @Test
    @DisplayName("EndTime after transformation <dayTime = 00:00:00> like border, but actually should be moved forward time BarMessage 1 quarter bar test")
    public void barMessageQuarterBordersEndTest() {
        Instant startTime = Instant.parse("2021-10-01T00:00:00.001Z");
        Instant endTime = Instant.parse("2022-01-01T10:00:00.000Z");
        String streamDataFilename = "endTimeBug/barMessageQuarterBordersEnd.csv";
        String resultFilename = "endTimeBug/barMessageQuarterBordersEndResult.json";
        BarMessageCsvProducer messageProducer = new BarMessageCsvProducer(streamDataFilename);
        runTestFullResponseCheck(QUARTER_MILLIS, startTime, endTime, resultFilename, MessageType.BAR_MESSAGE, ChartType.BARS, messageProducer);
    }

    @Test
    @DisplayName("EndTime after transformation <dayTime = 00:00:00> like border, but actually should be moved forward time BarMessage 4 month bar test")
    public void barMessage4MonthBordersEndTest() {
        Instant startTime = Instant.parse("2021-05-01T00:00:00.001Z");
        Instant endTime = Instant.parse("2021-09-01T10:00:00.000Z");
        String streamDataFilename = "endTimeBug/barMessageYearBordersEnd.csv";
        String resultFilename = "endTimeBug/barMessage4MonthBordersEndResult.json";
        BarMessageCsvProducer messageProducer = new BarMessageCsvProducer(streamDataFilename);
        runTestFullResponseCheck(4 * MONTH_MILLIS, startTime, endTime, resultFilename, MessageType.BAR_MESSAGE, ChartType.BARS, messageProducer);
    }

    @Test
    @DisplayName("EndTime after transformation <dayTime = 00:00:00> like border, but actually should be moved forward time BarMessage 5 month bar test")
    public void barMessage5MonthBordersEndTest() {
        Instant startTime = Instant.parse("2021-03-01T00:00:00.001Z");
        Instant endTime = Instant.parse("2021-05-01T10:00:00.000Z");
        String streamDataFilename = "endTimeBug/barMessageYearBordersEnd.csv";
        String resultFilename = "endTimeBug/barMessage5MonthBordersEndResult.json";
        BarMessageCsvProducer messageProducer = new BarMessageCsvProducer(streamDataFilename);
        runTestFullResponseCheck(5 * MONTH_MILLIS, startTime, endTime, resultFilename, MessageType.BAR_MESSAGE, ChartType.BARS, messageProducer);
    }

    @Test
    @DisplayName("EndTime after transformation <dayTime = 00:00:00> like border, but actually should be moved forward time BarMessage 6 month bar test")
    public void barMessage6MonthBordersEndTest() {
        Instant startTime = Instant.parse("2021-01-01T00:00:00.001Z");
        Instant endTime = Instant.parse("2021-07-01T10:00:00.000Z");
        String streamDataFilename = "endTimeBug/barMessageYearBordersEnd.csv";
        String resultFilename = "endTimeBug/barMessage6MonthBordersEndResult.json";
        BarMessageCsvProducer messageProducer = new BarMessageCsvProducer(streamDataFilename);
        runTestFullResponseCheck(6 * MONTH_MILLIS, startTime, endTime, resultFilename, MessageType.BAR_MESSAGE, ChartType.BARS, messageProducer);
    }

    @Test
    @DisplayName("EndTime after transformation <dayTime = 00:00:00> like border, but actually should be moved forward time BarMessage 7 month bar test")
    public void barMessage7MonthBordersEndTest() {
        Instant startTime = Instant.parse("2021-01-01T00:00:00.001Z");
        Instant endTime = Instant.parse("2021-07-01T10:00:00.000Z");
        String streamDataFilename = "endTimeBug/barMessageYearBordersEnd.csv";
        String resultFilename = "endTimeBug/barMessage7MonthBordersEndResult.json";
        BarMessageCsvProducer messageProducer = new BarMessageCsvProducer(streamDataFilename);
        runTestFullResponseCheck(7 * MONTH_MILLIS, startTime, endTime, resultFilename, MessageType.BAR_MESSAGE, ChartType.BARS, messageProducer);
    }

    @Test
    @DisplayName("EndTime after transformation <dayTime = 00:00:00> like border, but actually should be moved forward time BarMessage 1 year bar test")
    public void barMessageYearBordersEndTest() {
        Instant startTime = Instant.parse("2021-01-01T00:00:00.000Z");
        Instant endTime = Instant.parse("2022-01-01T10:00:00.000Z");
        String streamDataFilename = "endTimeBug/barMessageYearBordersEnd.csv";
        String resultFilename = "endTimeBug/barMessageYearBordersEndResult.json";
        BarMessageCsvProducer messageProducer = new BarMessageCsvProducer(streamDataFilename);
        runTestFullResponseCheck(YEAR_MILLIS, startTime, endTime, resultFilename, MessageType.BAR_MESSAGE, ChartType.BARS, messageProducer);
    }

    @Test
    @DisplayName("EndTime after transformation <dayTime = 00:00:00> like border, but actually should be moved forward time PackageHeader 1 week bar test")
    public void packageHeaderWeekBordersEndTest() {
        Instant startTime = Instant.parse("2021-10-04T00:00:00.001Z");
        Instant endTime = Instant.parse("2021-10-11T10:00:00.000Z");
        String resultFilename = "endTimeBug/packageHeaderWeekBordersEndResult.json";
        PackageHeaderMessageGenerator messageProducer = new PackageHeaderMessageGenerator(0, startTime.toEpochMilli() - 2 * WEEK_MILLIS,
                endTime.toEpochMilli() + 2 * WEEK_MILLIS, 6 * HOUR_MILLIS, 3, 1000, 10, 10);
        runTestFullResponseCheck(WEEK_MILLIS, startTime, endTime, resultFilename, MessageType.PACKAGE_HEADER, ChartType.BARS, messageProducer);
    }

    @Test
    @DisplayName("EndTime after transformation <dayTime = 00:00:00> like border, but actually should be moved forward time PackageHeader 2 week bar test")
    public void packageHeader2WeekBordersEndTest() {
        Instant startTime = Instant.parse("2021-10-04T00:00:00.001Z");
        Instant endTime = Instant.parse("2021-10-18T10:00:00.000Z");
        String resultFilename = "endTimeBug/packageHeader2WeekBordersEndResult.json";
        PackageHeaderMessageGenerator messageProducer = new PackageHeaderMessageGenerator(0, startTime.toEpochMilli() - 4 * WEEK_MILLIS,
                endTime.toEpochMilli() + 4 * WEEK_MILLIS, 6 * HOUR_MILLIS, 3, 1000, 10, 10);
        runTestFullResponseCheck(2 * WEEK_MILLIS, startTime, endTime, resultFilename, MessageType.PACKAGE_HEADER, ChartType.BARS, messageProducer);
    }

    @Test
    @DisplayName("EndTime after transformation <dayTime = 00:00:00> like border, but actually should be moved forward time PackageHeader 1 month bar test")
    public void packageHeaderMonthBordersEndTest() {
        Instant startTime = Instant.parse("2021-10-01T00:00:00.001Z");
        Instant endTime = Instant.parse("2021-11-01T10:00:00.000Z");
        String resultFilename = "endTimeBug/packageHeaderMonthBordersEndResult.json";
        PackageHeaderMessageGenerator messageProducer = new PackageHeaderMessageGenerator(0, startTime.toEpochMilli() - 2 * MONTH_MILLIS,
                endTime.toEpochMilli() + 2 * MONTH_MILLIS, DAY_MILLIS, 3, 1000, 10, 10);
        runTestFullResponseCheck(MONTH_MILLIS, startTime, endTime, resultFilename, MessageType.PACKAGE_HEADER, ChartType.BARS, messageProducer);
    }

    @Test
    @DisplayName("EndTime after transformation <dayTime = 00:00:00> like border, but actually should be moved forward time PackageHeader 2 month bar test")
    public void packageHeader2MonthBordersEndTest() {
        Instant startTime = Instant.parse("2021-09-01T00:00:00.001Z");
        Instant endTime = Instant.parse("2021-11-01T10:00:00.000Z");
        String resultFilename = "endTimeBug/packageHeader2MonthBordersEndResult.json";
        PackageHeaderMessageGenerator messageProducer = new PackageHeaderMessageGenerator(0, startTime.toEpochMilli() - 4 * MONTH_MILLIS,
                endTime.toEpochMilli() + 4 * MONTH_MILLIS, DAY_MILLIS, 3, 1000, 10, 10);
        runTestFullResponseCheck(2 * MONTH_MILLIS, startTime, endTime, resultFilename, MessageType.PACKAGE_HEADER, ChartType.BARS, messageProducer);
    }

    @Test
    @DisplayName("EndTime after transformation <dayTime = 00:00:00> like border, but actually should be moved forward time PackageHeader 1 quarter bar test")
    public void packageHeaderQuarterBordersEndTest() {
        Instant startTime = Instant.parse("2021-10-01T00:00:00.001Z");
        Instant endTime = Instant.parse("2022-01-01T10:00:00.000Z");
        String resultFilename = "endTimeBug/packageHeaderQuarterBordersEndResult.json";
        PackageHeaderMessageGenerator messageProducer = new PackageHeaderMessageGenerator(0, startTime.toEpochMilli() - 2 * QUARTER_MILLIS,
                endTime.toEpochMilli() + 2 * QUARTER_MILLIS, DAY_MILLIS, 3, 1000, 10, 10);
        runTestFullResponseCheck(QUARTER_MILLIS, startTime, endTime, resultFilename, MessageType.PACKAGE_HEADER, ChartType.BARS, messageProducer);
    }

    @Test
    @DisplayName("EndTime after transformation <dayTime = 00:00:00> like border, but actually should be moved forward time PackageHeader 4 month bar test")
    public void packageHeader4MonthBordersEndTest() {
        Instant startTime = Instant.parse("2021-05-01T00:00:00.001Z");
        Instant endTime = Instant.parse("2021-09-01T10:00:00.000Z");
        String resultFilename = "endTimeBug/packageHeader4MonthBordersEndResult.json";
        PackageHeaderMessageGenerator messageProducer = new PackageHeaderMessageGenerator(0, startTime.toEpochMilli() - 8 * MONTH_MILLIS,
                endTime.toEpochMilli() + 8 * MONTH_MILLIS, DAY_MILLIS, 3, 1000, 10, 10);
        runTestFullResponseCheck(4 * MONTH_MILLIS, startTime, endTime, resultFilename, MessageType.PACKAGE_HEADER, ChartType.BARS, messageProducer);
    }

    @Test
    @DisplayName("EndTime after transformation <dayTime = 00:00:00> like border, but actually should be moved forward time PackageHeader 5 month bar test")
    public void packageHeader5MonthBordersEndTest() {
        Instant startTime = Instant.parse("2021-05-01T00:00:00.001Z");
        Instant endTime = Instant.parse("2021-10-01T10:00:00.000Z");
        String resultFilename = "endTimeBug/packageHeader5MonthBordersEndResult.json";
        PackageHeaderMessageGenerator messageProducer = new PackageHeaderMessageGenerator(0, startTime.toEpochMilli() - 10 * MONTH_MILLIS,
                endTime.toEpochMilli() + 10 * MONTH_MILLIS, DAY_MILLIS, 3, 1000, 10, 10);
        runTestFullResponseCheck(5 * MONTH_MILLIS, startTime, endTime, resultFilename, MessageType.PACKAGE_HEADER, ChartType.BARS, messageProducer);
    }

    @Test
    @DisplayName("EndTime after transformation <dayTime = 00:00:00> like border, but actually should be moved forward time PackageHeader 6 month bar test")
    public void packageHeader6MonthBordersEndTest() {
        Instant startTime = Instant.parse("2021-01-01T00:00:00.001Z");
        Instant endTime = Instant.parse("2021-07-01T10:00:00.000Z");
        String resultFilename = "endTimeBug/packageHeader6MonthBordersEndResult.json";
        PackageHeaderMessageGenerator messageProducer = new PackageHeaderMessageGenerator(0, startTime.toEpochMilli() - 12 * MONTH_MILLIS,
                endTime.toEpochMilli() + 12 * MONTH_MILLIS, DAY_MILLIS, 3, 1000, 10, 10);
        runTestFullResponseCheck(6 * MONTH_MILLIS, startTime, endTime, resultFilename, MessageType.PACKAGE_HEADER, ChartType.BARS, messageProducer);
    }

    @Test
    @DisplayName("EndTime after transformation <dayTime = 00:00:00> like border, but actually should be moved forward time PackageHeader 7 month bar test")
    public void packageHeader7MonthBordersEndTest() {
        Instant startTime = Instant.parse("2021-06-01T00:00:00.001Z");
        Instant endTime = Instant.parse("2021-10-01T10:00:00.000Z");
        String resultFilename = "endTimeBug/packageHeader7MonthBordersEndResult.json";
        PackageHeaderMessageGenerator messageProducer = new PackageHeaderMessageGenerator(0, startTime.toEpochMilli() - 14 * MONTH_MILLIS,
                endTime.toEpochMilli() + 14 * MONTH_MILLIS, DAY_MILLIS, 3, 1000, 10, 10);
        runTestFullResponseCheck(7 * MONTH_MILLIS, startTime, endTime, resultFilename, MessageType.PACKAGE_HEADER, ChartType.BARS, messageProducer);
    }

    @Test
    @DisplayName("EndTime after transformation <dayTime = 00:00:00> like border, but actually should be moved forward time PackageHeader 1 year bar test")
    public void packageHeaderYearBordersEndTest() {
        Instant startTime = Instant.parse("2021-01-01T00:00:00.001Z");
        Instant endTime = Instant.parse("2022-01-01T10:00:00.000Z");
        String resultFilename = "endTimeBug/packageHeaderYearBordersEndResult.json";
        PackageHeaderMessageGenerator messageProducer = new PackageHeaderMessageGenerator(0, startTime.toEpochMilli() - 2 * YEAR_MILLIS,
                endTime.toEpochMilli() + 2 * YEAR_MILLIS, DAY_MILLIS, 3, 1000, 10, 10);
        runTestFullResponseCheck(YEAR_MILLIS, startTime, endTime, resultFilename, MessageType.PACKAGE_HEADER, ChartType.BARS, messageProducer);
    }

}
