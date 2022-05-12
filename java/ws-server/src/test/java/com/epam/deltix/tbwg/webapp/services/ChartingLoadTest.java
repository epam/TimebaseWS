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

import com.epam.deltix.tbwg.webapp.services.producers.PackageHeaderMessageGenerator;
import com.epam.deltix.tbwg.webapp.services.producers.PackageHeaderMessageGzipProducer;
import com.epam.deltix.tbwg.webapp.model.charting.ChartType;
import org.junit.Ignore;
import org.junit.Test;

import java.text.DecimalFormat;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Ignore
public class ChartingLoadTest extends ChartingBaseTest {

    private static final DecimalFormat dfTime = new DecimalFormat("0.0");
    private static final DecimalFormat dfDelta = new DecimalFormat("0");

    @Test
    public void loadTest1HourData1MinBar() {
        final int countOfTests = 10;
        Instant startTime = Instant.parse("2021-12-01T20:00:00.001Z");
        Instant endTime = Instant.parse("2021-12-01T20:59:59.000Z");

        List<String> columnNames = new ArrayList<>();
        List<String> rowNames = new ArrayList<>();
        String[][] value = new String[5][6];
        int index1 = 0;
        int index2 = 0;

        for (long timestampStep : new int[]{1, 10, 60}) {
            rowNames.add("Time between snapshots   " + addSpaces(timestampStep) + "s: ");
            timestampStep *= 1000;
            index2 = 0;
            for (int countOfEntries : new int[] {10, 50, 200, 1000}) {
                if (index1 == 0) {
                    columnNames.add(addSpaces(countOfEntries) + "         ");
                }

                List<Long> list = new ArrayList<>();
                for (int i = 0; i < countOfTests + 1; i++) {
                    PackageHeaderMessageGenerator messageProducer = new PackageHeaderMessageGenerator(0,
                            startTime.toEpochMilli() - 5 * MINUTE_MILLIS, endTime.toEpochMilli() + 5 * MINUTE_MILLIS,
                            timestampStep, countOfEntries, 1000, 10, 10);
                    list.add(
                            runTestCheckCountOfPoints(MINUTE_MILLIS, startTime, endTime, MessageType.PACKAGE_HEADER, ChartType.BARS,
                                    60, messageProducer, false)
                    );
                }

                value[index1][index2] = makeValue(list, countOfTests);
                index2++;
            }
            index1++;
        }

        printTable("1 hour of generated data, 1 minute bars, average from " + countOfTests + " times", columnNames, rowNames, value);
    }

    @Test
    public void loadTest1DayData() {
        int countOfTests = 10;
        Instant startTime = Instant.parse("2021-12-01T00:00:00.001Z");
        Instant endTime = Instant.parse("2021-12-01T23:59:59.000Z");

        List<String> columnNames = new ArrayList<>();
        List<String> rowNames = new ArrayList<>();

        String[][] value = new String[5][6];
        int index2 = 0;
        long timestampStep = 10_000;
        for (int countOfEntries : new int[] {10, 50, 200, 500}) {
            if (countOfEntries == 200) {
                countOfTests = 5;
            }
            columnNames.add(addSpaces(countOfEntries) + "         ");
            if (index2 == 0) {
                rowNames.add("BARS 1 min                   : ");
            }

            List<Long> list = new ArrayList<>();
            for (int i = 0; i < countOfTests + 1; i++) {
                PackageHeaderMessageGenerator messageProducer = new PackageHeaderMessageGenerator(0,
                        startTime.toEpochMilli() - 5 * MINUTE_MILLIS, endTime.toEpochMilli() + 5 * MINUTE_MILLIS,
                        timestampStep, countOfEntries, 1000, 10, 10, true);
                list.add(
                        runTestCheckCountOfPoints(MINUTE_MILLIS, startTime, endTime, MessageType.PACKAGE_HEADER, ChartType.BARS,
                                1440, messageProducer, false)
                );
            }
            value[0][index2] = makeValue(list, countOfTests);

            if (index2 == 0) {
                rowNames.add("BARS 15 min                  : ");
            }
            list.clear();
            for (int i = 0; i < countOfTests + 1; i++) {
                PackageHeaderMessageGenerator messageProducer = new PackageHeaderMessageGenerator(0,
                        startTime.toEpochMilli() - 5 * MINUTE_MILLIS, endTime.toEpochMilli() + 5 * MINUTE_MILLIS,
                        timestampStep, countOfEntries, 1000, 10, 10, true);
                list.add(
                        runTestCheckCountOfPoints(15 * MINUTE_MILLIS, startTime, endTime, MessageType.PACKAGE_HEADER, ChartType.BARS,
                                96, messageProducer, false)
                );
            }
            value[1][index2] = makeValue(list, countOfTests);

            if (index2 == 0) {
                rowNames.add("BARS 1 hour                  : ");
            }
            list.clear();
            for (int i = 0; i < countOfTests + 1; i++) {
                PackageHeaderMessageGenerator messageProducer = new PackageHeaderMessageGenerator(0,
                        startTime.toEpochMilli() - 5 * MINUTE_MILLIS, endTime.toEpochMilli() + 5 * MINUTE_MILLIS,
                        timestampStep, countOfEntries, 1000, 10, 10, true);
                list.add(
                        runTestCheckCountOfPoints(HOUR_MILLIS, startTime, endTime, MessageType.PACKAGE_HEADER, ChartType.BARS,
                                24, messageProducer, false)
                );
            }
            value[2][index2] = makeValue(list, countOfTests);

            if (index2 == 0) {
                rowNames.add("PRICES_L2 1 minute           : ");
            }
            list.clear();
            //because of AdaptPeriodicityTransformation
            int countOfPoints = countOfEntries == 10 ? 2880 : 1440;
            for (int i = 0; i < countOfTests + 1; i++) {
                PackageHeaderMessageGenerator messageProducer = new PackageHeaderMessageGenerator(0,
                        startTime.toEpochMilli() - 5 * MINUTE_MILLIS, endTime.toEpochMilli() + 5 * MINUTE_MILLIS,
                        timestampStep, countOfEntries, 1000, 100, 10, true);
                list.add(
                        runTestCheckCountOfPoints(MINUTE_MILLIS, startTime, endTime, MessageType.PACKAGE_HEADER, ChartType.PRICES_L2,
                            countOfPoints, messageProducer, false)
                );
            }
            value[3][index2] = makeValue(list, countOfTests);

            if (index2 == 0) {
                rowNames.add("TRADES_BBO 1 minute          : ");
            }
            list.clear();
            for (int i = 0; i < countOfTests + 1; i++) {
                PackageHeaderMessageGenerator messageProducer = new PackageHeaderMessageGenerator(0,
                        startTime.toEpochMilli() - 5 * MINUTE_MILLIS, endTime.toEpochMilli() + 5 * MINUTE_MILLIS,
                        timestampStep, countOfEntries, 1000, 100, 10, true);
                list.add(
                        runTestCheckCountOfPoints(MINUTE_MILLIS, startTime, endTime, MessageType.PACKAGE_HEADER, ChartType.TRADES_BBO,
                                1440, messageProducer, false)
                );
            }
            value[4][index2] = makeValue(list, countOfTests);

            index2++;
        }

        printTable("1 day of generated data, snapshots frequency = " + timestampStep/1000 + "s, average from " + countOfTests + " times", columnNames, rowNames, value);
    }

    @Test
    public void loadTest1HourRealData() {
        int countOfTests = 10;
        String stream1HourBitfinex = "BITFINEX1hour.qsmsg.gz";
        Instant startTime = Instant.parse("2022-01-10T12:00:00.001Z");
        Instant endTime = Instant.parse("2022-01-10T13:00:00.000Z");

        List<String> columnNames = new ArrayList<>();
        List<String> rowNames = new ArrayList<>();

        String[][] value = new String[4][1];
        columnNames.add("1 hour of real BITFINEX BTC/USD data");

        rowNames.add("BARS 1 min                   : ");
        List<Long> list = new ArrayList<>();
        for (int i = 0; i < countOfTests + 1; i++) {
            PackageHeaderMessageGzipProducer messageProducer = new PackageHeaderMessageGzipProducer(stream1HourBitfinex,
                    "deltix.qsrv.hf.plugins.data.bitfinex.types.BitfinexPackageHeader");
            list.add(
                    runTestCheckCountOfPoints(MINUTE_MILLIS, startTime, endTime, MessageType.PACKAGE_HEADER, ChartType.BARS,
                            60, messageProducer, false)
            );
        }
        value[0][0] = makeValue(list, countOfTests);

        rowNames.add("BARS 15 min                  : ");
        list.clear();
        for (int i = 0; i < countOfTests + 1; i++) {
            PackageHeaderMessageGzipProducer messageProducer = new PackageHeaderMessageGzipProducer(stream1HourBitfinex,
                    "deltix.qsrv.hf.plugins.data.bitfinex.types.BitfinexPackageHeader");
            list.add(
                    runTestCheckCountOfPoints(15 * MINUTE_MILLIS, startTime, endTime, MessageType.PACKAGE_HEADER, ChartType.BARS,
                            4, messageProducer, false)
            );
        }
        value[1][0] = makeValue(list, countOfTests);

        rowNames.add("PRICES_L2 1 minute           : ");
        list.clear();
        for (int i = 0; i < countOfTests + 1; i++) {
            PackageHeaderMessageGzipProducer messageProducer = new PackageHeaderMessageGzipProducer(stream1HourBitfinex,
                    "deltix.qsrv.hf.plugins.data.bitfinex.types.BitfinexPackageHeader");
            list.add(
                    runTestCheckCountOfPoints(MINUTE_MILLIS, startTime, endTime, MessageType.PACKAGE_HEADER, ChartType.PRICES_L2,
                            57, messageProducer, false)
            );
        }
        value[2][0] = makeValue(list, countOfTests);

        rowNames.add("TRADES_BBO 1 minute          : ");
        list.clear();
        for (int i = 0; i < countOfTests + 1; i++) {
            PackageHeaderMessageGzipProducer messageProducer = new PackageHeaderMessageGzipProducer(stream1HourBitfinex,
                    "deltix.qsrv.hf.plugins.data.bitfinex.types.BitfinexPackageHeader");
            list.add(
                    runTestCheckCountOfPoints(MINUTE_MILLIS, startTime, endTime, MessageType.PACKAGE_HEADER, ChartType.TRADES_BBO,
                            58, messageProducer, false)
            );
        }
        value[3][0] = makeValue(list, countOfTests);

        printTable("1 hour of real data, average from " + countOfTests + " times", columnNames, rowNames, value);

    }

    private String makeValue(List<Long> list, int countOfTests) {
        Collections.sort(list);

        double sum = 0;
        for (int i = 0; i < list.size() - 1; i++)
            sum += list.get(i);

        double sumSquareDelta = 0;
        for (int i = 0; i < list.size() - 1; i++)
            sumSquareDelta += (list.get(i) - (sum / countOfTests)) * (list.get(i) - (sum / countOfTests));

        return addSpaces(sum / countOfTests) + "±" + addSpacesSmart(Math.sqrt(sumSquareDelta / countOfTests)) + "ms ";
    }


    private void printTable(String title, List<String> columnNames, List<String> rowNames, String[][] value) {
        System.out.println(title);
        StringBuilder sb = new StringBuilder();
        sb.append("Count of entries in snapshot : ");
        for (String columnName : columnNames) {
            sb.append(columnName).append(" ");
        }
        sb.append("\n");

        for (int i = 0; i < rowNames.size(); i++) {
            sb.append(rowNames.get(i));
            for (int j = 0; j < columnNames.size(); j++) {
                sb.append(value[i][j]);
            }
            sb.append("\n");
        }
        System.out.println(sb);
    }

    private String addSpaces(long v) {
        return v + (v < 10 ? " " : "") + (v < 100 ? " " : "");
    }

    private String addSpaces(double v) {
        return dfTime.format(v) + (v < 999.95 ? " " : "") + (v < 99.95 ? " " : "") + (v < 9.95 ? " " : "");
    }

    private String addSpacesSmart(double v) {
        return (v < 9.5 ? " " : "") + (v < 99.5 ? " " : "") + dfDelta.format(v);
    }
}
