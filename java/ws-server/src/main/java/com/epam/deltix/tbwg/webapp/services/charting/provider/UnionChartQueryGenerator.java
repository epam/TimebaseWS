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
package com.epam.deltix.tbwg.webapp.services.charting.provider;

import com.epam.deltix.qsrv.hf.pub.md.RecordClassSet;
import com.epam.deltix.tbwg.messages.StatusPackageHeader;
import com.epam.deltix.tbwg.messages.TradePoint;
import com.epam.deltix.tbwg.webapp.services.charting.queries.BookSymbolQuery;
import com.epam.deltix.timebase.messages.universal.*;
import com.epam.deltix.util.time.GMT;

public class UnionChartQueryGenerator implements ChartQueryGenerator {
    private final BookSymbolQuery symbolQuery;
    private final RecordClassSet metadata;

    public UnionChartQueryGenerator(BookSymbolQuery symbolQuery, RecordClassSet metadata) {
        this.symbolQuery = symbolQuery;
        this.metadata = metadata;
    }

    @Override
    public String generateL2PricesQuery() {
        return buildTradesQql() +
            "\nUNION\n" +
            buildSnapshotQql();
    }

    @Override
    public String generateBboQuery() {
        return buildTradesQql() +
            "\nUNION\n" +
            buildSnapshotQql(1, symbolQuery.getPointInterval() / 1000);
    }

    @Override
    public String generateBarQuery() {
        return buildTradePointsQql() +
            "\nUNION\n" +
            buildSnapshotQql(1, symbolQuery.getPointInterval() / 1000);
    }

    private String buildSnapshotQql() {
        return buildSnapshotQql(
            symbolQuery.getLevelsCount(), symbolQuery.getPointInterval() / 1000
        );
    }

    private String buildSnapshotQql(int levelCount, long interval) {
//        if (ChartQueryGenerator.containsClassName(metadata.getContentClasses(), SecurityStatusMessage.CLASS_NAME)) {
//            return buildStatusSnapshotQql(levelCount, interval);
//        } else
        {
            return buildSimpleSnapshotQql(levelCount, interval);
        }
    }

    private String buildSimpleSnapshotQql(int levelCount, long interval) {
        return String.format(
            "(SELECT packageType, entries%s as entries " +
                "TYPE \"%s\"\n" +
                "FROM \"%s\"\n" +
                "OVER time(%ds)\n" +
                "where %s and \n" +
                "(entries != null and (packageType == %s or packageType == %s)) " +
                "and timestamp >= '%s'd and timestamp <= '%s'd%s)",
            ChartQueryGenerator.buildEntriesLevelFilter(symbolQuery.getDataSource(), levelCount),
            StatusPackageHeader.CLASS_NAME,
            symbolQuery.getStream(), interval,
            ChartQueryGenerator.buildSymbolsFilter(symbolQuery.getSymbols()),
            PackageType.PERIODICAL_SNAPSHOT, PackageType.VENDOR_SNAPSHOT,
            GMT.formatDateTimeMillis(symbolQuery.getInterval().getStartTimeMilli()),
            GMT.formatDateTimeMillis(symbolQuery.getInterval().getEndTimeMilli()),
            symbolQuery.getSymbols().length > 1 ? "\nGROUP BY symbol" : ""
        );
    }

    private String buildTradesQql() {
        return String.format(
            "(SELECT packageType, entries as entries TYPE \"%s\"\n" +
                "FROM \"%s\"\n" +
                "OVER time(%ds)\n" +
                "where %s and entries != null\n" +
                "and size(entries[%s]) > 0\n" +
                "and packageType == %s\n" +
                "and timestamp >= '%s'd and timestamp <= '%s'd%s)",
            PackageHeader.CLASS_NAME,
            symbolQuery.getStream(), symbolQuery.getPointInterval() / 1000,
            ChartQueryGenerator.buildSymbolsFilter(symbolQuery.getSymbols()),
            ChartQueryGenerator.buildTypeFilter(ChartQueryGenerator.findDerivedTypes(metadata, TradeEntry.class.getName())),
            PackageType.INCREMENTAL_UPDATE,
            GMT.formatDateTimeMillis(symbolQuery.getInterval().getStartTimeMilli()),
            GMT.formatDateTimeMillis(symbolQuery.getInterval().getEndTimeMilli()),
            symbolQuery.getSymbols().length > 1 ? "\nGROUP BY symbol" : ""

        );
    }

    private String buildTradePointsQql() {
        return String.format(
            "(SELECT sum{}(sum(entries.size)) as size, entries[0].price as price TYPE \"%s\"\n" +
                "FROM \"%s\"\n" +
                "OVER time(%ds)\n" +
                "where %s and entries != null\n" +
                "and size(entries[%s]) > 0\n" +
                "and packageType == %s\n" +
                "and timestamp >= '%s'd and timestamp <= '%s'd%s)",
            TradePoint.CLASS_NAME,
            symbolQuery.getStream(), symbolQuery.getPointInterval() / 1000,
            ChartQueryGenerator.buildSymbolsFilter(symbolQuery.getSymbols()),
            ChartQueryGenerator.buildTypeFilter(ChartQueryGenerator.findDerivedTypes(metadata, TradeEntry.class.getName())),
            PackageType.INCREMENTAL_UPDATE,
            GMT.formatDateTimeMillis(symbolQuery.getInterval().getStartTimeMilli()),
            GMT.formatDateTimeMillis(symbolQuery.getInterval().getEndTimeMilli()),
            symbolQuery.getSymbols().length > 1 ? "\nGROUP BY symbol" : ""

        );
    }

    private String buildStatusSnapshotQql(int levelCount, long interval) {
        return String.format(
            "(SELECT packageType, entries%s as entries, " +
                "SecurityStatusMessage:status as status, SecurityStatusMessage:exchangeId as exchangeId\n" +
                "TYPE \"%s\"\n" +
                "FROM \"%s\"\n" +
                "OVER time(%ds)\n" +
                "where %s and \n" +
                "((entries != null and (packageType == %s or packageType == %s)) " +
                "or this is SecurityStatusMessage)\n" +
                "and timestamp >= '%s'd and timestamp <= '%s'd%s)",
            ChartQueryGenerator.buildEntriesLevelFilter(symbolQuery.getDataSource(), levelCount),
            StatusPackageHeader.CLASS_NAME,
            symbolQuery.getStream(), interval,
            ChartQueryGenerator.buildSymbolsFilter(symbolQuery.getSymbols()),
            PackageType.PERIODICAL_SNAPSHOT, PackageType.VENDOR_SNAPSHOT,
            GMT.formatDateTimeMillis(symbolQuery.getInterval().getStartTimeMilli()),
            GMT.formatDateTimeMillis(symbolQuery.getInterval().getEndTimeMilli()),
            symbolQuery.getSymbols().length > 1 ? "\nGROUP BY symbol" : ""
        );
    }

}