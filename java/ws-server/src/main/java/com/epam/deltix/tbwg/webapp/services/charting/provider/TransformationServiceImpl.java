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

import com.epam.deltix.qsrv.hf.pub.md.NamedDescriptor;
import com.epam.deltix.tbwg.messages.BarMessage;
import com.epam.deltix.tbwg.messages.WCTBarMessage;
import com.epam.deltix.tbwg.webapp.model.ModelDataSourceType;
import com.epam.deltix.tbwg.webapp.services.charting.datasource.ChartDataSource;
import com.epam.deltix.tbwg.webapp.services.charting.datasource.MarketDataTypeLoader;
import com.epam.deltix.tbwg.webapp.services.charting.queries.*;
import com.epam.deltix.tbwg.webapp.services.charting.transformations.*;
import com.epam.deltix.tbwg.webapp.services.timebase.TimebaseRegistry;
import com.epam.deltix.gflog.api.Log;
import com.epam.deltix.gflog.api.LogFactory;
import com.epam.deltix.qsrv.hf.pub.md.ClassDescriptor;
import com.epam.deltix.qsrv.hf.pub.md.RecordClassDescriptor;
import com.epam.deltix.qsrv.hf.pub.md.RecordClassSet;
import com.epam.deltix.tbwg.webapp.model.charting.ChartType;
import com.epam.deltix.tbwg.webapp.services.charting.datasource.ReactiveMessageSource;
import com.epam.deltix.tbwg.webapp.services.charting.datasource.MessageSourceFactory;

import com.epam.deltix.tbwg.webapp.utils.TBWGUtils;
import com.epam.deltix.timebase.messages.service.SecurityFeedStatusMessage;
import com.epam.deltix.timebase.messages.universal.PackageHeader;
import io.reactivex.Observable;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

import static com.epam.deltix.tbwg.webapp.utils.VersionUtils.versionHasRecord;

@Service
public class TransformationServiceImpl implements TransformationService {

    private static final Log LOGGER = LogFactory.getLog(TransformationServiceImpl.class);

    private static final long EXTEND_INTERVAL_MS = 60 * 1000;

    private static final double ZOOM_DETAILS_FACTOR = 0.9d;

    @Value("${charting.transformations.l2-optimization-threshold-ms:10000}")
    private long l2OptimizationThresholdMs;

    @Value("${charting.transformations.aggregation-optimization-threshold-ms:10800000}") // 3 hours
    private long aggregationOptimizationThresholdMs;

    @Value("${charting.transformations.use-qll:true}")
    private boolean useQql;

    private final TimebaseRegistry registry;
    private final MessageSourceFactory messageSourceFactory;

    private interface TransformationPlanBuilder {
        LinesQueryResult        build(ReactiveMessageSource source);
    }

    private class BasePlanBuild {

        protected final LinesQuery query;
        protected final long startTime;
        protected final long endTime;
        protected final long aggregation;
        protected final long newWindowSize;

        private BasePlanBuild(LinesQuery query, AggregationCalculator aggregationCalculator) {
            this.query = query;
            this.startTime = query.getInterval().getStartTimeMilli();
            this.endTime = query.getInterval().getEndTimeMilli();
            this.aggregation = aggregationCalculator.getAggregation(query.getInterval());
            this.newWindowSize = aggregationCalculator.getNewWindowSize(query.getInterval());
        }
    }

    private class LinearPlanBuilder extends BasePlanBuild implements TransformationPlanBuilder {

        private final SymbolQuery query;

        private final String[] columns;

        private LinearPlanBuilder(SymbolQuery query, String[] columns) {
            super(query, new FixedAggregationImpl(query.getPointInterval()));

            this.query = query;
            this.columns = columns;
        }

        @Override
        public LinesQueryResult build(ReactiveMessageSource source) {
            LinesQueryResult result = new LinesQueryResultImpl(
                query.getStream() + printSymbols(query.getSymbols()), source, query.getInterval()
            );

            Observable<?> inputObservable = source.getMessageSource()
                .takeWhile(x -> x.getTimeStampMs() <= endTime);
            ChartDataSource dataSource = source.getDataSource();

            inputObservable = inputObservable.share();

            boolean isSingleSymbolSource = query.getSymbols().length == 1;
            for (String symbol : query.getSymbols()) {
                LinearPointsToDtoTransformation linearTransformation = new LinearPointsToDtoTransformation(
                        columns, startTime, endTime, aggregation, symbol, dataSource, isSingleSymbolSource
                );
                result.getLines().add(
                        new LineResultImpl(
                                symbol + "_LINEAR[]", columns, inputObservable.lift(linearTransformation), aggregation, newWindowSize
                        )
                );
            }
            return result;
        }
    }

    private class L2PricesPlanBuilder extends BasePlanBuild implements TransformationPlanBuilder {

        private final BookSymbolQuery query;
        private final boolean legacy;

        private L2PricesPlanBuilder(BookSymbolQuery query, boolean legacy) {
            super(query, new FixedAggregationImpl(query.getPointInterval()));

            this.query = query;
            this.legacy = legacy;
        }

        private boolean buildBySnapshots() {
            return aggregation >= l2OptimizationThresholdMs && !query.isLive();
        }

        private boolean buildByQuery() {
            return useQql && buildBySnapshots() && !legacy && !useL1();
        }

        private boolean useL1() {
            return query.getDataSource() == ModelDataSourceType.L1;
        }

        @Override
        public LinesQueryResult build(ReactiveMessageSource source) {
            LinesQueryResult result = new LinesQueryResultImpl(
                query.getStream() + printSymbols(query.getSymbols()), source, query.getInterval()
            );

            Observable<?> inputObservable = source.getMessageSource()
                .takeWhile(x -> x.getTimeStampMs() <= endTime);
            ChartDataSource dataSource = source.getDataSource();

//            if (legacy) {
//                inputObservable = inputObservable.lift(new LegacyToUniversalTransformation());
//            }

            inputObservable = inputObservable.lift(new FeedStatusTransformation());
            inputObservable = inputObservable.share();

            boolean isSingleSymbolSource = query.getSymbols().length == 1;
            for (String symbol : query.getSymbols()) {
                // Levels
                Observable<?> observable;
                if (useL1()) {
                    observable = inputObservable.lift(
                            new UniversalL1ToLevelPointsTransformation(symbol, aggregation, dataSource, isSingleSymbolSource)
                    );
                } else {
                    if (buildBySnapshots()) {
                        observable = inputObservable.lift(
                                new SnapshotToLevelPointsTransformation(query.getDataSource(),
                                    symbol, query.getLevelsCount(), aggregation, dataSource, isSingleSymbolSource)
                        );
                    } else {
//                        if (useQuoteflow && query.getDataSource() == ModelDataSourceType.L3) {
//                            throw new IllegalArgumentException("L3 book is not supported for QuoteFlow component.");
//                        }

                        observable = inputObservable.lift(
                                        new OrderBookToLevelPointsTransformation(query.getDataSource(),
                                            symbol, query.getLevelsCount(), aggregation, dataSource, isSingleSymbolSource)
                        );
                    }
                }
                observable = observable.share();

                int levels = query.getLevelsCount();
                MultiLevelPointToDtoTransformation bidLevelTransformation = new MultiLevelPointToDtoTransformation(
                        levels, true, startTime, endTime
                );
                result.getLines().add(
                        new LineResultImpl(
                                symbol + "_BID[]", levels, observable.lift(bidLevelTransformation), aggregation, newWindowSize
                        )
                );

                MultiLevelPointToDtoTransformation askLevelTransformation = new MultiLevelPointToDtoTransformation(
                        levels, false, startTime, endTime
                );
                result.getLines().add(
                        new LineResultImpl(
                                symbol + "_ASK[]", levels, observable.lift(askLevelTransformation), aggregation, newWindowSize
                        )
                );

                // Trades
                result.getLines().add(
                        new LineResultImpl(
                                symbol + "_TRADES",
                                inputObservable.lift(new UniversalToTradeTransformation(symbol, dataSource, isSingleSymbolSource)).lift(new TradeTransformation(aggregation, startTime, endTime)),
                                aggregation, newWindowSize
                        )
                );
            }
            return result;
        }
    }

    private class BarPlanBuilder extends BasePlanBuild implements TransformationPlanBuilder {

        private final BookSymbolQuery query;
        private final boolean legacy;
        private final ChartType chartType;

        private BarPlanBuilder(BookSymbolQuery query, boolean legacy, ChartType chartType) {
            super(query, query.getPointInterval() >= 0 ?
                new FixedAggregationImpl(query.getPointInterval()) :
                new BarsAggregationCalculatorImpl());

            this.query = query;
            this.legacy = legacy;
            this.chartType = chartType;
        }

        private boolean buildBySnapshots() {
            return (endTime - startTime >= aggregationOptimizationThresholdMs) && !query.isLive() && !(useL1());
        }

        private boolean buildByQuery() {
            return useQql && buildBySnapshots() && !legacy && !useL1();
        }

        private boolean useL1() {
            return query.getDataSource() == ModelDataSourceType.L1;
        }

        @Override
        public LinesQueryResult build(ReactiveMessageSource source) {
            LinesQueryResult result = new LinesQueryResultImpl(
                query.getStream() +printSymbols(query.getSymbols()), source, query.getInterval()
            );

            Observable<?> inputObservable = source.getMessageSource()
                .takeWhile(x -> x.getTimeStampMs() <= endTime);
            ChartDataSource dataSource = source.getDataSource();

            if (query.isLive()) {
                inputObservable = inputObservable.lift(new TriggerPeriodicSnapshot(1000));
            }

            inputObservable = inputObservable.lift(new TradeToUniversalTransformation());

//            if (legacy) {
//                inputObservable = inputObservable.lift(new LegacyToUniversalTransformation());
//            }

            inputObservable = inputObservable.lift(new FeedStatusTransformation());

            inputObservable = inputObservable.share();

            boolean isSingleSymbolSource = query.getSymbols().length == 1;
            for (String symbol : query.getSymbols()) {
                Observable<?> observable;
                if (chartType == ChartType.BARS_TRADES) {
                    observable = inputObservable.lift(
                            new UniversalTradeToBarTransformation(symbol, dataSource, aggregation, startTime, endTime, isSingleSymbolSource));
                } else {
                    AbstractChartTransformation<?, ?> bboTransformation;
                    if (useL1()) {
                        bboTransformation = new UniversalL1ToBboTransformation(symbol, dataSource, isSingleSymbolSource);
                    } else {
                        if (buildBySnapshots()) {
                            bboTransformation = new SnapshotToBboTransformation(query.getDataSource(), symbol, dataSource, isSingleSymbolSource);
                        } else {
//                            if (useQuoteflow && query.getDataSource() == ModelDataSourceType.L3) {
//                                throw new IllegalArgumentException("L3 book is not supported for QuoteFlow component.");
//                            }

                            bboTransformation = new OrderBookToBboTransformation(query.getDataSource(), symbol, dataSource, isSingleSymbolSource);
                        }
                    }
                    observable = inputObservable.lift(bboTransformation);
                    observable = observable.lift(
                            new BboToBarTransformation(null, aggregation, startTime, endTime, chartType));
                }

                result.getLines().add(
                        new LineResultImpl(
                                symbol + "_BARS",
                                observable,
                                aggregation, newWindowSize
                        )
                );
            }
            return result;
        }
    }

    private class BboPlanBuilder extends BasePlanBuild implements TransformationPlanBuilder {

        private final BookSymbolQuery query;
        private final boolean legacy;

        private BboPlanBuilder(BookSymbolQuery query, boolean legacy) {
            super(query, new FixedAggregationImpl(query.getPointInterval()));

            this.query = query;
            this.legacy = legacy;
        }

        private boolean buildBySnapshots() {
            return (endTime - startTime >= aggregationOptimizationThresholdMs) && !query.isLive() && !(useL1());
        }

        private boolean buildByQuery() {
            return useQql && buildBySnapshots() && !legacy && !useL1();
        }

        private boolean useL1() {
            return query.getDataSource() == ModelDataSourceType.L1;
        }

        @Override
        public LinesQueryResult build(ReactiveMessageSource source) {
            LinesQueryResult result = new LinesQueryResultImpl(
                query.getStream() + printSymbols(query.getSymbols()), source, query.getInterval()
            );

            Observable<?> inputObservable = source.getMessageSource()
                .takeWhile(x -> x.getTimeStampMs() <= endTime + EXTEND_INTERVAL_MS);
            ChartDataSource dataSource = source.getDataSource();

            if (query.isLive()) {
                inputObservable = inputObservable.lift(new TriggerPeriodicSnapshot(1000));
            }

//            if (legacy) {
//                inputObservable = inputObservable.lift(new LegacyToUniversalTransformation());
//            }

            inputObservable = inputObservable.lift(new FeedStatusTransformation());
            inputObservable = inputObservable.share();

            boolean isSingleSymbolSource = query.getSymbols().length == 1;
            for (String symbol : query.getSymbols()) {
                AbstractChartTransformation<?, ?> bboTransformation;
                if (useL1()) {
                    bboTransformation = new UniversalL1ToBboTransformation(symbol, dataSource, isSingleSymbolSource);
                } else {
                    if (buildBySnapshots()) {
                        bboTransformation = new SnapshotToBboTransformation(query.getDataSource(), symbol, dataSource, isSingleSymbolSource);
                    } else {
//                        if (useQuoteflow && query.getDataSource() == ModelDataSourceType.L3) {
//                            throw new IllegalArgumentException("L3 book is not supported for QuoteFlow component.");
//                        }

                        bboTransformation = new OrderBookToBboTransformation(query.getDataSource(), symbol, dataSource, isSingleSymbolSource);
                    }
                }
                Observable<?> observable = inputObservable.lift(bboTransformation);

                // BBO
                result.getLines().add(
                        new LineResultImpl(
                                symbol + "_BBO",
                                observable.lift(new BboAggregationTransformation(symbol, aggregation, startTime, endTime)),
                                aggregation, newWindowSize
                        )
                );

                // Trades
                result.getLines().add(
                        new LineResultImpl(
                                symbol + "_TRADES",
                                inputObservable.lift(new UniversalToTradeTransformation(symbol, dataSource, isSingleSymbolSource))
                                        .lift(new TradeTransformation(aggregation, startTime, endTime)),
                                aggregation, newWindowSize
                        )
                );
            }

            return result;
        }

    }

    private class BarConversionPlanBuilder extends BasePlanBuild implements TransformationPlanBuilder {

        private final BookSymbolQuery query;
        private final boolean wct;
        private final ChartType chartType;

        private BarConversionPlanBuilder(BookSymbolQuery query, boolean wct, ChartType chartType) {
            super(query, query.getPointInterval() >= 0 ?
                new FixedAggregationImpl(query.getPointInterval()) :
                new BarsAggregationCalculatorImpl());

            this.query = query;
            this.wct = wct;
            this.chartType = chartType;
        }

        @Override
        public LinesQueryResult build(ReactiveMessageSource source) {
            LinesQueryResult result = new LinesQueryResultImpl(
                query.getStream() + printSymbols(query.getSymbols()), source, query.getInterval()
            );

            Observable<?> inputObservable = source.getMessageSource();
            ChartDataSource dataSource = source.getDataSource();

            if (wct) {
                inputObservable = inputObservable.lift(new WctToBarTransformation(chartType));
            }

            inputObservable = inputObservable.share();

            boolean isSingleSymbolSource = query.getSymbols().length == 1;
            for (String symbol : query.getSymbols()) {
                result.getLines().add(
                        new LineResultImpl(
                                symbol + "_BARS",
                                inputObservable.lift(
                                        new BarConversionTransformation(aggregation, startTime, endTime, symbol, dataSource, isSingleSymbolSource)
                                ),
                                aggregation, newWindowSize
                        )
                );
            }

            return result;
        }

    }

    private static class QqlQueryPlanBuilder implements TransformationPlanBuilder {

        private final QqlQuery query;

        private QqlQueryPlanBuilder(QqlQuery query) {
            this.query = query;
        }

        private QqlQuery query() {
            return query;
        }

        @Override
        public LinesQueryResult build(ReactiveMessageSource source) {
            long startTime = query.getInterval().getStartTimeMilli();
            long endTime = query.getInterval().getEndTimeMilli();
            long aggregation = query.getPointInterval();

            LinesQueryResult result = new LinesQueryResultImpl(
                query.getQql(), source, query.getInterval()
            );

            Observable<?> inputObservable = source.getMessageSource()
                .takeWhile(x -> x.getTimeStampMs() <= endTime);

            result.getLines().add(
                new LineResultImpl(
                    "QQL",
                    inputObservable.lift(new QqlConversionTransformation()),
                    aggregation, 0
                )
            );

            return result;
        }
    }

    private static class TransformationType {
        private final Set<String> types;
        private final TransformationPlanBuilder planBuilder;

        public TransformationType(Set<String> types, TransformationPlanBuilder planBuilder) {
            this.types = types;
            this.planBuilder = planBuilder;
        }
    }

    public TransformationServiceImpl(TimebaseRegistry registry, MessageSourceFactory messageSourceFactory) {
        this.registry = registry;
        this.messageSourceFactory = messageSourceFactory;
    }

    @Override
    public LinesQueryResult buildTransformationPlan(LinesQuery query) {
        com.epam.deltix.tbwg.webapp.services.timebase.TimebaseService svc = registry.resolve(query.getService());
        RecordClassSet metadata = null;
        if (query instanceof SymbolQuery) {
            metadata = svc.getStreamMetadata(((SymbolQuery) query).getStream());
        }

        TransformationType transformationType = transformationType(query, metadata);
        TransformationPlanBuilder planBuilder = transformationType.planBuilder;

        ReactiveMessageSource source = null;
        if (planBuilder instanceof QqlQueryPlanBuilder) {
            QqlQueryPlanBuilder queryPlanBuilder = (QqlQueryPlanBuilder) planBuilder;
            QqlQuery qqlQuery = queryPlanBuilder.query();
            source = messageSourceFactory.buildSource(
                svc, qqlQuery.getQql(), qqlQuery.getInterval(), qqlQuery.isLive(), true
            );
        } else if (planBuilder instanceof LinearPlanBuilder) {
            if (query instanceof SymbolQuery) {
                SymbolQuery symbolQuery = (SymbolQuery) query;
                source = messageSourceFactory.buildSource(
                    svc, symbolQuery.getStream(), symbolQuery.getSymbols(),
                    transformationType.types,
                    symbolQuery.getInterval(), symbolQuery.isLive(),
                    true
                );
            } else {
                throw new RuntimeException("Invalid type of chart query");
            }
        } else if (query instanceof BookSymbolQuery) {
            BookSymbolQuery symbolQuery = (BookSymbolQuery) query;
            if (planBuilder instanceof L2PricesPlanBuilder) {
                L2PricesPlanBuilder l2PricesPlanBuilder = (L2PricesPlanBuilder) planBuilder;
                if (l2PricesPlanBuilder.buildByQuery()) {
                    ChartQueryGenerator qqlB = createQueryGenerator(svc, symbolQuery, metadata);
                    source = messageSourceFactory.buildSource(
                        svc, symbolQuery.getStream(), symbolQuery.getSymbols(), qqlB.generateL2PricesQuery(),
                        symbolQuery.getInterval(), symbolQuery.isLive(), false
                    );
                }
            } else if (planBuilder instanceof BboPlanBuilder) {
                BboPlanBuilder bboPlanBuilder = (BboPlanBuilder) planBuilder;
                if (bboPlanBuilder.buildByQuery()) {
                    ChartQueryGenerator qqlB = createQueryGenerator(svc, symbolQuery, metadata);
                    source = messageSourceFactory.buildSource(
                        svc, symbolQuery.getStream(), symbolQuery.getSymbols(), qqlB.generateBboQuery(),
                        symbolQuery.getInterval(), symbolQuery.isLive(), false
                    );
                }
            } else if (planBuilder instanceof BarPlanBuilder) {
                BarPlanBuilder barPlanBuilder = (BarPlanBuilder) planBuilder;
                if (barPlanBuilder.buildByQuery()) {
                    ChartQueryGenerator qqlB = createQueryGenerator(svc, symbolQuery, metadata);
                    source = messageSourceFactory.buildSource(
                        svc, symbolQuery.getStream(), symbolQuery.getSymbols(), qqlB.generateBarQuery(),
                        symbolQuery.getInterval(), symbolQuery.isLive(), false
                    );
                }
            }

            if (source == null) {
                source = messageSourceFactory.buildSource(
                    svc, symbolQuery.getStream(), symbolQuery.getSymbols(),
                    transformationType.types,
                    symbolQuery.getInterval(), symbolQuery.isLive(),
                    false
                );
            }
        }

        return planBuilder.build(source);
    }

    private ChartQueryGenerator createQueryGenerator(com.epam.deltix.tbwg.webapp.services.timebase.TimebaseService svc,
                                                      BookSymbolQuery symbolQuery, RecordClassSet metadata) {
        return versionHasRecord(svc.getServerVersion()) ?
            new RecordChartQueryGenerator(symbolQuery, metadata) :
            new UnionChartQueryGenerator(symbolQuery, metadata);
    }

    private TransformationType transformationType(LinesQuery query, RecordClassSet metadata) {
        if (query instanceof QqlQuery) {
            return new TransformationType(new HashSet<>(), new QqlQueryPlanBuilder((QqlQuery) query));
        } else if (query instanceof BookSymbolQuery) {
            return transformationType((BookSymbolQuery) query, metadata.getContentClasses());
        }

        throw new IllegalArgumentException("Unknown type of getQuery");
    }

    private TransformationType transformationType(BookSymbolQuery query, RecordClassDescriptor[] descriptors) {
        if (query.getType() == ChartType.LINEAR) {
            RecordClassDescriptor[] chartableDescriptors = TBWGUtils.getLinearChartDescriptors(descriptors);
            if (chartableDescriptors.length == 0) {
                throw new RuntimeException("Specified query result not contains valid output");
            }
            return new TransformationType(
                Arrays.stream(chartableDescriptors).map(NamedDescriptor::getName).collect(Collectors.toSet()),
                new LinearPlanBuilder(query, TBWGUtils.getLinearChartColumns(chartableDescriptors))
            );
        }

        if (query.getType() == ChartType.PRICE_LEVELS) {
            if (TBWGUtils.mayContainSubclasses(descriptors, PackageHeader.class)) {
                Set<String> descriptorsSet = getDescriptors(descriptors, PackageHeader.class, SecurityFeedStatusMessage.class); //, SecurityStatusMessage.class);
                return new TransformationType(descriptorsSet, new L2PricesPlanBuilder(query, false));
            }
//            else if (TBWGUtils.mayContainSubclasses(descriptors, Level2Message.class) || TBWGUtils.mayContainSubclasses(descriptors, L2Message.class)) {
//                return new TransformationType(
//                    getDescriptors(descriptors, Level2Message.class, L2Message.class, L2SnapshotMessage.class, TradeMessage.class),
//                    new L2PricesPlanBuilder(query, true)
//                );
//            } else if (TBWGUtils.mayContainSubclasses(descriptors, BestBidOfferMessage.class)) {
//                return new TransformationType(
//                        getDescriptors(descriptors, BestBidOfferMessage.class, TradeMessage.class),
//                        new L2PricesPlanBuilder(query, true)
//                );
//            }
        }

        if (query.getType().isBars()) {
            if (TBWGUtils.mayContainSubclasses(descriptors, PackageHeader.class)) {
                Set<String> descriptorsSet = getDescriptors(descriptors, PackageHeader.class, SecurityFeedStatusMessage.class); //, SecurityStatusMessage.class);
                return new TransformationType(
                    descriptorsSet, new BarPlanBuilder(query, false, query.getType())
                );
            }
//            if (TBWGUtils.mayContainSubclasses(descriptors, Level2Message.class) || TBWGUtils.mayContainSubclasses(descriptors, L2Message.class)) {
//                return new TransformationType(
//                    getDescriptors(descriptors, Level2Message.class, L2Message.class, L2SnapshotMessage.class, TradeMessage.class),
//                    new BarPlanBuilder(query, true, query.getType())
//                );
//            }
//            if (TBWGUtils.mayContainSubclasses(descriptors, BestBidOfferMessage.class) ||
//                TBWGUtils.mayContainSubclasses(descriptors, TradeMessage.class)) {
//
//                return new TransformationType(
//                        getDescriptors(descriptors, BestBidOfferMessage.class, TradeMessage.class),
//                        new BarPlanBuilder(query, true, query.getType())
//                );
//            }
            if (TBWGUtils.mayContainSubclasses(descriptors, BarMessage.class)) {
                return new TransformationType(
                    getDescriptors(descriptors, BarMessage.class),
                    new BarConversionPlanBuilder(query, false, query.getType())
                );
            }
            if (TBWGUtils.mayContainSubclasses(descriptors, MarketDataTypeLoader.WCT_BAR_MESSAGE_CLASS)) {
                return new TransformationType(
                    getDescriptors(descriptors, WCTBarMessage.class),
                    new BarConversionPlanBuilder(query, true, query.getType())
                );
            }
        }

        if (query.getType() == ChartType.TRADES_BBO) {
            if (TBWGUtils.mayContainSubclasses(descriptors, PackageHeader.class)) {
                Set<String> descriptorsSet = getDescriptors(descriptors, PackageHeader.class, SecurityFeedStatusMessage.class); //, SecurityStatusMessage.class);
                return new TransformationType(descriptorsSet, new BboPlanBuilder(query, false));
            }
//            if (TBWGUtils.mayContainSubclasses(descriptors, Level2Message.class) ||
//                TBWGUtils.mayContainSubclasses(descriptors, L2Message.class))
//            {
//                return new TransformationType(
//                    getDescriptors(descriptors, Level2Message.class, L2Message.class, L2SnapshotMessage.class, TradeMessage.class),
//                    new BboPlanBuilder(query, true)
//                );
//            }
//            if (TBWGUtils.mayContainSubclasses(descriptors, BestBidOfferMessage.class)) {
//                return new TransformationType(
//                        getDescriptors(descriptors, BestBidOfferMessage.class, TradeMessage.class),
//                        new BboPlanBuilder(query, true)
//                );
//            }
        }

        throw new IllegalArgumentException("Unknown type of getQuery: " + query.getType());
    }

    private static Set<String> getDescriptors(RecordClassDescriptor[] descriptors, Class<?>... classes) {
        Set<String> foundClasses = new HashSet<>();
        for (int i = 0; i < classes.length; ++i) {
            String className = ClassDescriptor.getClassNameWithAssembly(classes[i]);
            foundClasses.add(className);
            foundClasses.addAll(
                TBWGUtils.getConvertible(descriptors, className)
                    .stream()
                    .map(NamedDescriptor::getName)
                    .collect(Collectors.toList())
            );
        }

        return foundClasses;
    }

    private static String printSymbols(String[] symbols) {
        StringBuilder sb = new StringBuilder();
        sb.append("[");
        for (int i = 0; i < symbols.length; i++) {
            sb.append(symbols[i]);
            if (i < symbols.length - 1) {
                sb.append("|");
            }
        }
        sb.append("]");
        return sb.toString();
    }
}