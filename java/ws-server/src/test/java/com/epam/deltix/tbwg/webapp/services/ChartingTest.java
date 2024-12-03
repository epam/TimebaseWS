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

import com.epam.deltix.tbwg.webapp.model.charting.ChartType;
import com.epam.deltix.tbwg.webapp.services.producers.PackageHeaderMessageGzipProducer;
import org.junit.Test;
import org.junit.jupiter.api.DisplayName;

import java.time.Instant;

import static com.epam.deltix.tbwg.webapp.services.ChartingBaseTest.MessageType.PACKAGE_HEADER;

public class ChartingTest extends ChartingBaseTest {

    //1 hour of data from 2022-01-10T12:00 till 2022-01-10-13:00
    // leave incorrect qsmgs instead of changing binary file name
    private final static String STREAM_1HOUR_BITFINEX = "BITFINEX1hour.qsmsg.gz";

    @Test
    @DisplayName("Real data PackageHeader 1 minute bar test")
    public void packageHeader1MinuteBitfinex() {
        Instant startTime = Instant.parse("2022-01-10T12:43:35.001Z");
        Instant endTime = Instant.parse("2022-01-10T12:47:32.000Z");
        String resultFilename = "realData/packageHeader1MinuteBitfinexResult.json";
        PackageHeaderMessageGzipProducer messageProducer = new PackageHeaderMessageGzipProducer(STREAM_1HOUR_BITFINEX,
                "deltix.qsrv.hf.plugins.data.bitfinex.types.BitfinexPackageHeader");
        runTestFullResponseCheck(MINUTE_MILLIS, startTime, endTime, resultFilename, PACKAGE_HEADER, ChartType.BARS, messageProducer, "BTC/USD");
    }

    @Test
    @DisplayName("Real data PackageHeader 1 minute bar test")
    public void packageHeader1MinuteBitfinexFullHour() {
        Instant startTime = Instant.parse("2022-01-10T12:00:35.001Z");
        Instant endTime = Instant.parse("2022-01-10T12:59:32.000Z");
        String resultFilename = "realData/packageHeader1MinuteFullDataBitfinexResult.json";
        PackageHeaderMessageGzipProducer messageProducer = new PackageHeaderMessageGzipProducer(STREAM_1HOUR_BITFINEX,
                "deltix.qsrv.hf.plugins.data.bitfinex.types.BitfinexPackageHeader");
        runTestFullResponseCheck(MINUTE_MILLIS, startTime, endTime, resultFilename, PACKAGE_HEADER, ChartType.BARS, messageProducer, "BTC/USD");
    }

    @Test
    @DisplayName("Real data PackageHeader 5 minute bar test")
    public void packageHeader5MinuteBitfinex() {
        Instant startTime = Instant.parse("2022-01-10T12:26:35.001Z");
        Instant endTime = Instant.parse("2022-01-10T12:49:32.000Z");
        String resultFilename = "realData/packageHeader5MinuteBitfinexResult.json";
        PackageHeaderMessageGzipProducer messageProducer = new PackageHeaderMessageGzipProducer(STREAM_1HOUR_BITFINEX,
                "deltix.qsrv.hf.plugins.data.bitfinex.types.BitfinexPackageHeader");
        runTestFullResponseCheck(5 * MINUTE_MILLIS, startTime, endTime, resultFilename, PACKAGE_HEADER, ChartType.BARS, messageProducer, "BTC/USD");
    }

    @Test
    @DisplayName("Real data PackageHeader 15 minute bar test")
    public void packageHeader15MinuteBitfinex() {
        Instant startTime = Instant.parse("2022-01-10T12:11:00.001Z");
        Instant endTime = Instant.parse("2022-01-10T12:49:00.000Z");
        String resultFilename = "realData/packageHeader15MinuteBitfinexResult.json";
        PackageHeaderMessageGzipProducer messageProducer = new PackageHeaderMessageGzipProducer(STREAM_1HOUR_BITFINEX,
                "deltix.qsrv.hf.plugins.data.bitfinex.types.BitfinexPackageHeader");
        runTestFullResponseCheck(15 * MINUTE_MILLIS, startTime, endTime, resultFilename, PACKAGE_HEADER, ChartType.BARS, messageProducer, "BTC/USD");
    }

    @Test
    @DisplayName("Real data PackageHeader 30 minute bar test")
    public void packageHeader30MinuteBitfinex() {
        Instant startTime = Instant.parse("2022-01-10T12:11:00.001Z");
        Instant endTime = Instant.parse("2022-01-10T12:49:00.000Z");
        String resultFilename = "realData/packageHeader30MinuteBitfinexResult.json";
        PackageHeaderMessageGzipProducer messageProducer = new PackageHeaderMessageGzipProducer(STREAM_1HOUR_BITFINEX,
                "deltix.qsrv.hf.plugins.data.bitfinex.types.BitfinexPackageHeader");
        runTestFullResponseCheck(30 * MINUTE_MILLIS, startTime, endTime, resultFilename, PACKAGE_HEADER, ChartType.BARS, messageProducer, "BTC/USD");
    }

    @Test
    @DisplayName("Real data PackageHeader 1 hour bar test")
    public void packageHeader1HourBitfinex() {
        Instant startTime = Instant.parse("2022-01-10T12:11:00.001Z");
        Instant endTime = Instant.parse("2022-01-10T12:49:00.000Z");
        String resultFilename = "realData/packageHeader1HourBitfinexResult.json";
        PackageHeaderMessageGzipProducer messageProducer = new PackageHeaderMessageGzipProducer(STREAM_1HOUR_BITFINEX,
                "deltix.qsrv.hf.plugins.data.bitfinex.types.BitfinexPackageHeader");
        runTestFullResponseCheck(60 * MINUTE_MILLIS, startTime, endTime, resultFilename, PACKAGE_HEADER, ChartType.BARS, messageProducer, "BTC/USD");
    }

    @Test
    @DisplayName("Real data PackageHeader 5 minute bar by trades test")
    public void packageHeaderTrade5MinuteBitfinex() {
        Instant startTime = Instant.parse("2022-01-10T12:00:35.001Z");
        Instant endTime = Instant.parse("2022-01-10T12:59:32.000Z");

        String resultFilename = "realData/packageHeaderTrade5MinuteFullDataBitfinexResult.json";
        PackageHeaderMessageGzipProducer messageProducer = new PackageHeaderMessageGzipProducer(STREAM_1HOUR_BITFINEX,
                "deltix.qsrv.hf.plugins.data.bitfinex.types.BitfinexPackageHeader");
        runTestFullResponseCheck(5 * MINUTE_MILLIS, startTime, endTime, resultFilename, PACKAGE_HEADER, ChartType.BARS_TRADES, messageProducer, "BTC/USD");
    }

    @Test
    @DisplayName("Real data PackageHeader 5 minute bar by trades by 5 symbols test")
    public void packageHeaderTrade5Minute5SymbolsBitfinex() {
        Instant startTime = Instant.parse("2023-08-08T09:20:00.001Z");
        Instant endTime = Instant.parse("2023-08-08T09:25:00.001Z");

        String resultFilename = "realData/packageHeaderTrade5Symbols.json";
        PackageHeaderMessageGzipProducer messageProducer = new PackageHeaderMessageGzipProducer("BITFINEX5Symbols.qsmsg.gz",
                "deltix.qsrv.hf.plugins.data.bitfinex.types.BitfinexPackageHeader");
        String[] symbols = new String[] {"ETC/BTC", "BTC/USD", "BTC/USDT", "ETC/USD", "USDT/USD"};
        runTestFullResponseCheck( MINUTE_MILLIS, startTime, endTime, resultFilename, PACKAGE_HEADER, ChartType.BARS_TRADES, messageProducer, symbols);
    }

    @Test
    @DisplayName("Real data PackageHeader 5 minute bar by trades by 5 symbols test")
    public void packageHeader5Minute5SymbolsBitfinex() {
        Instant startTime = Instant.parse("2023-08-08T09:20:00.001Z");
        Instant endTime = Instant.parse("2023-08-08T09:25:00.001Z");

        String resultFilename = "realData/packageHeaderBars5Symbols.json";
        PackageHeaderMessageGzipProducer messageProducer = new PackageHeaderMessageGzipProducer("BITFINEX5Symbols.qsmsg.gz",
                "deltix.qsrv.hf.plugins.data.bitfinex.types.BitfinexPackageHeader");
        String[] symbols = new String[] { "BTC/USDT","BTC/USD", "ETC/BTC", "ETC/USD", "USDT/USD"};
        runTestFullResponseCheck( MINUTE_MILLIS, startTime, endTime, resultFilename, PACKAGE_HEADER, ChartType.BARS, messageProducer, symbols);
    }

    @Test
    @DisplayName("Real data PackageHeader 5 minute bar by trades by 5 symbols test")
    public void packageHeaderL25Minute5SymbolsBitfinex() {
        Instant startTime = Instant.parse("2023-08-08T09:20:00.001Z");
        Instant endTime = Instant.parse("2023-08-08T09:25:00.001Z");

        String resultFilename = "realData/packageHeaderL25Symbols.json";
        PackageHeaderMessageGzipProducer messageProducer = new PackageHeaderMessageGzipProducer("BITFINEX5Symbols.qsmsg.gz",
                "deltix.qsrv.hf.plugins.data.bitfinex.types.BitfinexPackageHeader");
        String[] symbols = new String[] { "BTC/USDT","BTC/USD", "ETC/BTC", "ETC/USD", "USDT/USD"};
        runTestFullResponseCheck(5 * MINUTE_MILLIS, startTime, endTime, resultFilename, PACKAGE_HEADER, ChartType.PRICE_LEVELS, messageProducer, symbols);
    }
}