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
import com.epam.deltix.tbwg.messages.TradePoint;
import com.epam.deltix.tbwg.webapp.services.charting.queries.BookSymbolQuery;
import com.epam.deltix.timebase.messages.universal.*;
import com.epam.deltix.util.time.GMT;

public class RecordChartQueryGenerator implements ChartQueryGenerator {

    private final BookSymbolQuery symbolQuery;
    private final RecordClassSet metadata;
    private final StringBuilder builder = new StringBuilder();
    private final boolean hasSecurityStatusMessage;

    public RecordChartQueryGenerator(BookSymbolQuery symbolQuery, RecordClassSet metadata) {
        this.symbolQuery = symbolQuery;
        this.metadata = metadata;
        hasSecurityStatusMessage = false; //ChartQueryGenerator.containsClassName(metadata.getContentClasses(), SecurityStatusMessage.CLASS_NAME);
    }

    @Override
    public String generateL2PricesQuery() {
        return with().select().recordSnapshotAndTrade(symbolQuery.getLevelsCount()).from()
                .interval(symbolQuery.getPointInterval() / 1000).where().group().build();
    }

    @Override
    public String generateBboQuery() {
        return with().select().recordSnapshotAndTrade(1).from()
                .interval(symbolQuery.getPointInterval() / 1000).where().group().build();
    }

    @Override
    public String generateBarQuery() {
        return with().select().recordSnapshot(1).recordVolume().from()
                .interval(symbolQuery.getPointInterval() / 1000).where().group().build();
    }

    private String build() {
        return builder.toString();
    }

    private RecordChartQueryGenerator with() {
        builder.append("WITH entries[").append(
                        ChartQueryGenerator.buildTypeFilter(
                                ChartQueryGenerator.findDerivedTypes(metadata, TradeEntry.class.getName()))).append("] as trades,\n")
                .append("entries[").append(
                        ChartQueryGenerator.buildTypeFilter(
                                ChartQueryGenerator.findDerivedTypes(metadata, BasePriceEntry.class.getName()))).append("] as snapshot,\n")
                .append("(size(trades) > 0 and packageType == ").append(PackageType.INCREMENTAL_UPDATE).append(") as isTrades,\n")
                .append("(size(snapshot) > 0 and (packageType == ").append(PackageType.PERIODICAL_SNAPSHOT)
                .append(" or packageType == ").append(PackageType.VENDOR_SNAPSHOT).append(")) as isSnapshot,\n");
        if (hasSecurityStatusMessage) {
            builder.append("(this is SecurityStatusMessage) as isStatus,\n");
        }
        builder.append("(CASE\n");
        if (hasSecurityStatusMessage) {
            builder.append(" WHEN isStatus THEN 'status'\n");
        }
        builder.append(" WHEN isTrades THEN 'trade'\n WHEN isSnapshot THEN 'snapshot'\nEND) as recordType\n\n");
        return this;
    }

    private RecordChartQueryGenerator select() {
        builder.append("SELECT\n\n");
        return this;
    }

    private RecordChartQueryGenerator recordSnapshotAndTrade(int levelCount) {
        builder.append("RECORD\n").append("packageType,\n")
                .append("snapshot")
                .append(ChartQueryGenerator.buildEntriesLevelFilter(symbolQuery.getDataSource(), levelCount))
                .append(" if recordType == 'snapshot' else trades field entries\n")
                .append("TYPE \"").append(PackageHeader.CLASS_NAME).append("\"\n")
                .append("WHEN recordType == 'trade' or recordType == 'snapshot'\n\n");

//        if (hasSecurityStatusMessage) {
//            return this.recordStatus();
//        }
        return this;
    }

//    private RecordChartQueryGenerator recordStatus() {
//        builder.append("RECORD\n").append("SecurityStatusMessage:status,\n SecurityStatusMessage:exchangeId\n")
//                .append("TYPE \"").append(SecurityStatusMessage.CLASS_NAME).append("\"\n")
//                .append("WHEN recordType == 'status'\n\n");
//        return this;
//    }

    private RecordChartQueryGenerator recordVolume() {
        builder.append("RECORD\n").append("sum{}(sum(trades.size)) as size, trades[0].price as price\n")
                .append("TYPE \"").append(TradePoint.CLASS_NAME).append("\"\n")
                .append("WHEN recordType == 'trade'\n\n");
        return this;
    }

    private RecordChartQueryGenerator recordSnapshot(int levelCount) {
        builder.append("RECORD\n").append("packageType,\n")
                .append("snapshot[level < ").append(levelCount).append("] field entries\n")
                .append("TYPE \"").append(PackageHeader.CLASS_NAME).append("\"\n")
                .append("WHEN recordType == 'snapshot'\n\n");

//        if (hasSecurityStatusMessage) {
//            return this.recordStatus();
//        }
        return this;
    }

    private RecordChartQueryGenerator from() {
        builder.append("FROM \"").append(symbolQuery.getStream()).append("\"\n\n");
        return this;
    }

    private RecordChartQueryGenerator interval(long interval) {
        builder.append("OVER time(").append(interval).append("s)\n\n");
        return this;
    }

    private RecordChartQueryGenerator where() {
        builder.append("WHERE ").append(ChartQueryGenerator.buildSymbolsFilter(symbolQuery.getSymbols())).append("\n")
                .append("and timestamp >= '").append(GMT.formatDateTimeMillis(symbolQuery.getInterval().getStartTimeMilli())).append("'d\n")
                .append("and timestamp <= '").append(GMT.formatDateTimeMillis(symbolQuery.getInterval().getEndTimeMilli())).append("'d\n\n");
        return this;
    }

    private RecordChartQueryGenerator group() {
        builder.append("GROUP BY recordType");
        if (symbolQuery.getSymbols().length > 1) {
            builder.append(", symbol");
        }
        builder.append("\n");
        return this;
    }

}