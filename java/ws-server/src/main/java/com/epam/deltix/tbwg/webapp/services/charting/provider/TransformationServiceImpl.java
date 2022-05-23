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
package com.epam.deltix.tbwg.webapp.services.charting.provider;

import com.epam.deltix.qsrv.hf.pub.md.NamedDescriptor;
import com.epam.deltix.tbwg.messages.BarMessage;
import com.epam.deltix.tbwg.webapp.services.charting.queries.*;
import com.epam.deltix.tbwg.webapp.services.charting.transformations.*;
import com.epam.deltix.tbwg.webapp.services.timebase.TimebaseService;
import com.epam.deltix.gflog.api.Log;
import com.epam.deltix.gflog.api.LogFactory;
import com.epam.deltix.qsrv.hf.pub.md.ClassDescriptor;
import com.epam.deltix.qsrv.hf.pub.md.RecordClassDescriptor;
import com.epam.deltix.qsrv.hf.pub.md.RecordClassSet;
import com.epam.deltix.tbwg.webapp.model.charting.ChartType;
import com.epam.deltix.tbwg.webapp.services.charting.datasource.ReactiveMessageSource;
import com.epam.deltix.tbwg.webapp.services.charting.datasource.MessageSourceFactory;

import com.epam.deltix.timebase.messages.SchemaElement;
import com.epam.deltix.timebase.messages.service.SecurityFeedStatusMessage;
import com.epam.deltix.timebase.messages.universal.PackageHeader;
import com.epam.deltix.timebase.messages.universal.TradeEntry;
import com.epam.deltix.util.time.GMT;
import io.reactivex.Observable;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class TransformationServiceImpl implements TransformationService {

    private static final Log LOGGER = LogFactory.getLog(TransformationServiceImpl.class);

    private static final long EXTEND_INTERVAL_MS = 60 * 1000;

    private static final double ZOOM_DETAILS_FACTOR = 0.9d;

    @Value("${charting.transformations.l2-optimization-threshold-ms:10000}")
    private long l2OptimizationThresholdMs;

    @Value("${charting.transformations.aggregation-optimization-threshold-ms:21600000}") // 12 hours
    private long aggregationOptimizationThresholdMs;

    @Value("${charting.transformations.use-qll:false}")
    private boolean useQql;

    @Value("${charting.transformations.use-l1:false}")
    private boolean useL1;

    private final TimebaseService timebaseService;
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

    private class L2PricesPlanBuilder extends BasePlanBuild implements TransformationPlanBuilder {

        private final BookSymbolQuery query;
        private final boolean legacy;

        private L2PricesPlanBuilder(BookSymbolQuery query, boolean legacy) {
            super(query, query.getPointInterval() >= 0 ?
                new FixedAggregationImpl(query.getPointInterval()) :
                new AggregationCalculatorImpl(query.getMaxPointsCount(), ZOOM_DETAILS_FACTOR)
            );

            this.query = query;
            this.legacy = legacy;
        }

        private boolean buildBySnapshots() {
            return aggregation >= l2OptimizationThresholdMs && !query.isLive();
        }

        private boolean buildByQuery() {
            return useQql && buildBySnapshots() && !legacy;
        }

        @Override
        public LinesQueryResult build(ReactiveMessageSource source) {
            LinesQueryResult result = new LinesQueryResultImpl(
                query.getStream() + "[" + query.getSymbol() + "]", source, query.getInterval()
            );

            Observable<?> inputObservable = source.getMessageSource()
                .takeWhile(x -> x.getTimeStampMs() <= endTime);

            inputObservable = inputObservable.lift(new FeedStatusTransformation());
            inputObservable = inputObservable.lift(new AdaptPeriodicityTransformation(query.getLevelsCount(), aggregation));
            inputObservable = inputObservable.share();

            // Levels
            Observable<?> observable;
            if (buildBySnapshots()) {
                observable = inputObservable.lift(
                    new UniversalL2SnapshotsToLevelPointsTransformation(query.getSymbol(), query.getLevelsCount(), aggregation)
                );
            } else {
                observable = inputObservable.lift(
                    new UniversalL2OrderbookToLevelPointsTransformation(query.getSymbol(), query.getLevelsCount(), aggregation)
                );
            }
            observable = observable.share();

            int levels = query.getLevelsCount();
            MultiLevelPointToDtoTransformation bidLevelTransformation = new MultiLevelPointToDtoTransformation(
                levels, true, startTime, endTime
            );
            result.getLines().add(
                new LineResultImpl(
                    "BID[]", levels, observable.lift(bidLevelTransformation), aggregation, newWindowSize
                )
            );

            MultiLevelPointToDtoTransformation askLevelTransformation = new MultiLevelPointToDtoTransformation(
                levels, false, startTime, endTime
            );
            result.getLines().add(
                new LineResultImpl(
                    "ASK[]", levels, observable.lift(askLevelTransformation), aggregation, newWindowSize
                )
            );

            // Trades
            result.getLines().add(
                new LineResultImpl(
                    "TRADES",
                    inputObservable.lift(new UniversalToTradeTransformation()).lift(new TradeTransformation(aggregation, startTime, endTime)),
                    aggregation, newWindowSize
                )
            );

            return result;
        }

    }

    private class BarPlanBuilder extends BasePlanBuild implements TransformationPlanBuilder {

        private final BookSymbolQuery query;
        private final boolean legacy;
        private final boolean hasL1Data;

        private BarPlanBuilder(BookSymbolQuery query, boolean legacy, boolean hasL1Data) {
            super(query, query.getPointInterval() >= 0 ?
                new FixedAggregationImpl(query.getPointInterval()) :
                new BarsAggregationCalculatorImpl());

            this.query = query;
            this.legacy = legacy;
            this.hasL1Data = hasL1Data;
        }

        private boolean buildBySnapshots() {
            return (endTime - startTime >= aggregationOptimizationThresholdMs) && !query.isLive() && !(useL1 && hasL1Data);
        }

        private boolean buildByQuery() {
            return useQql && buildBySnapshots() && !legacy;
        }

        @Override
        public LinesQueryResult build(ReactiveMessageSource source) {
            LinesQueryResult result = new LinesQueryResultImpl(
                query.getStream() + "[" + query.getSymbol() + "]", source, query.getInterval()
            );

            Observable<?> inputObservable = source.getMessageSource()
                .takeWhile(x -> x.getTimeStampMs() <= endTime);

            inputObservable = inputObservable.lift(new FeedStatusTransformation());
            if (query.isLive()) {
                inputObservable = inputObservable.lift(new TriggerPeriodicSnapshot(1000));
            }

            AbstractChartTransformation<?, ?> bboTransformation;
            if (useL1 && hasL1Data) {
                bboTransformation = new UniversalL1ToBboTransformation();
            } else {
                if (buildBySnapshots()) {
                    bboTransformation = new UniversalL2SnapshotsToBboTransformation(query.getSymbol());
                } else {
                    bboTransformation = new UniversalL2OrderbookToBboTransformation(query.getSymbol());
                }
            }
            Observable<?> observable = inputObservable.lift(bboTransformation);

            result.getLines().add(
                new LineResultImpl(
                    "BARS",
                    observable.lift(new BarAggregationMidptTransformation(query.getSymbol(), aggregation, startTime, endTime)),
                    aggregation, newWindowSize
                )
            );

            return result;
        }

    }

    private class BboPlanBuilder extends BasePlanBuild implements TransformationPlanBuilder {

        private final BookSymbolQuery query;
        private final boolean legacy;
        private final boolean hasL1Data;

        private BboPlanBuilder(BookSymbolQuery query, boolean legacy, boolean hasL1Data) {
            super(query, query.getPointInterval() >= 0 ?
                new FixedAggregationImpl(query.getPointInterval()) :
                new AggregationCalculatorImpl(query.getMaxPointsCount(), ZOOM_DETAILS_FACTOR));

            this.query = query;
            this.legacy = legacy;
            this.hasL1Data = hasL1Data;
        }

        private boolean buildBySnapshots() {
            return (endTime - startTime >= aggregationOptimizationThresholdMs) && !query.isLive() && !(useL1 && hasL1Data);
        }

        private boolean buildByQuery() {
            return useQql && buildBySnapshots() && !legacy;
        }

        @Override
        public LinesQueryResult build(ReactiveMessageSource source) {
            LinesQueryResult result = new LinesQueryResultImpl(
                query.getStream() + "[" + query.getSymbol() + "]", source, query.getInterval()
            );

            Observable<?> inputObservable = source.getMessageSource()
                .takeWhile(x -> x.getTimeStampMs() <= endTime + EXTEND_INTERVAL_MS);

            inputObservable = inputObservable.lift(new FeedStatusTransformation());
            if (query.isLive()) {
                inputObservable = inputObservable.lift(new TriggerPeriodicSnapshot(1000));
            }

            inputObservable = inputObservable.share();

            AbstractChartTransformation<?, ?> bboTransformation;
            if (useL1 && hasL1Data) {
                bboTransformation = new UniversalL1ToBboTransformation();
            } else {
                if (buildBySnapshots()) {
                    bboTransformation = new UniversalL2SnapshotsToBboTransformation(query.getSymbol());
                } else {
                    bboTransformation = new UniversalL2OrderbookToBboTransformation(query.getSymbol());
                }
            }
            Observable<?> observable = inputObservable.lift(bboTransformation);

            // BBO
            result.getLines().add(
                new LineResultImpl(
                    "BBO",
                    observable.lift(new BboAggregationTransformation(query.getSymbol(), aggregation, startTime, endTime)),
                    aggregation, newWindowSize
                )
            );

            // Trades
            result.getLines().add(
                new LineResultImpl(
                    "TRADES",
                    inputObservable.lift(new UniversalToTradeTransformation())
                        .lift(new TradeTransformation(aggregation, startTime, endTime)),
                    aggregation, newWindowSize
                )
            );

            return result;
        }

    }

    private class BarConversionPlanBuilder extends BasePlanBuild implements TransformationPlanBuilder {

        private final BookSymbolQuery query;

        private BarConversionPlanBuilder(BookSymbolQuery query) {
            super(query, query.getPointInterval() >= 0 ?
                new FixedAggregationImpl(query.getPointInterval()) :
                new BarsAggregationCalculatorImpl());

            this.query = query;
        }

        @Override
        public LinesQueryResult build(ReactiveMessageSource source) {
            LinesQueryResult result = new LinesQueryResultImpl(
                query.getStream() + "[" + query.getSymbol() + "]", source, query.getInterval()
            );

            Observable<?> inputObservable = source.getMessageSource();

            result.getLines().add(
                new LineResultImpl(
                    "BARS",
                    inputObservable.lift(
                        new BarConversionTransformation(aggregation, startTime, endTime)
                    ),
                    aggregation, newWindowSize
                )
            );

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

    public TransformationServiceImpl(TimebaseService timebaseService, MessageSourceFactory messageSourceFactory) {
        this.timebaseService = timebaseService;
        this.messageSourceFactory = messageSourceFactory;
    }

    @Override
    public LinesQueryResult buildTransformationPlan(LinesQuery query) {
        RecordClassSet metadata = null;
        if (query instanceof SymbolQuery) {
            metadata = timebaseService.getStreamMetadata(((SymbolQuery) query).getStream());
        }

        TransformationType transformationType = transformationType(query, metadata);
        TransformationPlanBuilder planBuilder = transformationType.planBuilder;

        ReactiveMessageSource source = null;
        if (planBuilder instanceof QqlQueryPlanBuilder) {
            QqlQueryPlanBuilder queryPlanBuilder = (QqlQueryPlanBuilder) planBuilder;
            QqlQuery qqlQuery = queryPlanBuilder.query();
            source = messageSourceFactory.buildSource(
                qqlQuery.getQql(), qqlQuery.getInterval(), qqlQuery.isLive(), true
            );
        } else if (query instanceof BookSymbolQuery) {
            BookSymbolQuery symbolQuery = (BookSymbolQuery) query;

            String startTimestamp = GMT.formatDateTimeMillis(symbolQuery.getInterval().getStartTimeMilli());
            String endTimestamp = GMT.formatDateTimeMillis(symbolQuery.getInterval().getEndTimeMilli());

            if (planBuilder instanceof L2PricesPlanBuilder) {
                Set<String> tradeTypes = findDerivedTypes(metadata,
                    TradeEntry.class.getName(), "deltix.timebase.api.messages.universal.TradeEntry"
                );
                L2PricesPlanBuilder l2PricesPlanBuilder = (L2PricesPlanBuilder) planBuilder;
                if (l2PricesPlanBuilder.buildByQuery()) {
                    String qql =
                        String.format(
                            "SELECT packageType, entries as entries \n" +
                                "TYPE \"deltix.timebase.api.messages.universal.PackageHeader\"\n" +
                                "FROM \"%s\"\n" +
                                "OVER time(%ds)\n" +
                                "where symbol == '%s' and entries != null\n" +
                                "and size(entries[%s]) > 0\n" +
                                "and packageType == INCREMENTAL_UPDATE\n" +
                                "and timestamp >= '%s'd and timestamp <= '%s'd\n" +
                                "UNION\n" +
                                "SELECT packageType, entries[level < %d] as entries, " +
                                "SecurityFeedStatusMessage:status as status, SecurityFeedStatusMessage:exchangeId as exchangeId\n" +
                                "TYPE \"deltix.tbwg.messages.StatusPackageHeader\"\n" +
                                "FROM \"%s\"\n" +
                                "OVER time(%ds)\n" +
                                "where symbol == '%s' and \n" +
                                "((entries != null and (packageType == PERIODICAL_SNAPSHOT or packageType == VENDOR_SNAPSHOT)) " +
                                "or this is SecurityFeedStatusMessage)\n" +
                                "and timestamp >= '%s'd and timestamp <= '%s'd",
                            symbolQuery.getStream(), symbolQuery.getPointInterval() / 1000,
                            symbolQuery.getSymbol(), buildTypeFilter(tradeTypes), startTimestamp, endTimestamp,
                            symbolQuery.getLevelsCount(), symbolQuery.getStream(), symbolQuery.getPointInterval() / 1000,
                            symbolQuery.getSymbol(), startTimestamp, endTimestamp
                        );

                    source = messageSourceFactory.buildSource(
                        symbolQuery.getStream(), symbolQuery.getSymbol(), qql,
                        symbolQuery.getInterval(), symbolQuery.isLive(), false
                    );
                }
            } else if (planBuilder instanceof BboPlanBuilder) {
                Set<String> tradeTypes = findDerivedTypes(metadata,
                    TradeEntry.class.getName(), "deltix.timebase.api.messages.universal.TradeEntry"
                );
                BboPlanBuilder bboPlanBuilder = (BboPlanBuilder) planBuilder;
                if (bboPlanBuilder.buildByQuery()) {
                    String qql =
                        String.format(
                            "SELECT packageType, entries as entries TYPE \"deltix.timebase.api.messages.universal.PackageHeader\"\n" +
                                "FROM \"%s\"\n" +
                                "OVER time(%ds)\n" +
                                "where symbol == '%s' and entries != null\n" +
                                "and size(entries[%s]) > 0\n" +
                                "and packageType == INCREMENTAL_UPDATE\n" +
                                "and timestamp >= '%s'd and timestamp <= '%s'd\n" +
                                "UNION\n" +
                                "SELECT packageType, entries[level == 0] as entries, " +
                                "SecurityFeedStatusMessage:status as status, SecurityFeedStatusMessage:exchangeId as exchangeId\n" +
                                "type \"deltix.tbwg.messages.StatusPackageHeader\"\n" +
                                "FROM \"%s\"\n" +
                                "OVER time(%ds)\n" +
                                "where symbol == '%s' and \n" +
                                "((entries != null and (packageType == PERIODICAL_SNAPSHOT or packageType == VENDOR_SNAPSHOT)) " +
                                "or this is SecurityFeedStatusMessage)\n" +
                                "and timestamp >= '%s'd and timestamp <= '%s'd",
                            symbolQuery.getStream(), symbolQuery.getPointInterval() / 1000,
                            symbolQuery.getSymbol(), buildTypeFilter(tradeTypes), startTimestamp, endTimestamp,
                            symbolQuery.getStream(), symbolQuery.getPointInterval() / 1000,
                            symbolQuery.getSymbol(), startTimestamp, endTimestamp
                        );

                    source = messageSourceFactory.buildSource(
                        symbolQuery.getStream(), symbolQuery.getSymbol(), qql,
                        symbolQuery.getInterval(), symbolQuery.isLive(), false
                    );
                }
            } else if (planBuilder instanceof BarPlanBuilder) {
                BarPlanBuilder barPlanBuilder = (BarPlanBuilder) planBuilder;
                if (barPlanBuilder.buildByQuery()) {
                    String qql =
                        String.format(
                            "SELECT packageType, entries[level == 0] as entries, " +
                                "SecurityFeedStatusMessage:status as status, SecurityFeedStatusMessage:exchangeId as exchangeId\n" +
                                "TYPE \"deltix.tbwg.messages.StatusPackageHeader\"\n" +
                                "FROM \"%s\"\n" +
                                "OVER time(10s)\n" +
                                "where symbol == '%s' and\n" +
                                "((entries != null and (packageType == PERIODICAL_SNAPSHOT or packageType == VENDOR_SNAPSHOT)) " +
                                "or this is SecurityFeedStatusMessage)\n" +
                                "and timestamp >= '%s'd and timestamp <= '%s'd",
                            symbolQuery.getStream(), symbolQuery.getSymbol(), startTimestamp, endTimestamp
                        );

                    source = messageSourceFactory.buildSource(
                        symbolQuery.getStream(), symbolQuery.getSymbol(), qql,
                        symbolQuery.getInterval(), symbolQuery.isLive(), false
                    );
                }
            }

            if (source == null) {
                source = messageSourceFactory.buildSource(
                    symbolQuery.getStream(), symbolQuery.getSymbol(),
                    transformationType.types,
                    symbolQuery.getInterval(), symbolQuery.isLive()
                );
            }
        }

        return planBuilder.build(source);
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
        if (query.getType() == ChartType.PRICES_L2) {
            if (mayContainSubclasses(descriptors, PackageHeader.class)) {
                return new TransformationType(
                    getDescriptors(descriptors, PackageHeader.class, SecurityFeedStatusMessage.class),
                    new L2PricesPlanBuilder(query, false)
                );
            }
            if (mayContainSubclasses(descriptors, "deltix.timebase.api.messages.universal.PackageHeader")) {
                return new TransformationType(
                    null /* read all types */, new L2PricesPlanBuilder(query, false)
                );
            }
        }

        if (query.getType() == ChartType.BARS) {
            if (mayContainSubclasses(descriptors, PackageHeader.class)) {
                return new TransformationType(
                    getDescriptors(descriptors, PackageHeader.class, SecurityFeedStatusMessage.class),
                    new BarPlanBuilder(query, false, false)
                );
            }
            if (mayContainSubclasses(descriptors, "deltix.timebase.api.messages.universal.PackageHeader")) {
                return new TransformationType(
                    null /* read all types */, new BarPlanBuilder(query, false, false)
                );
            }
            if (mayContainSubclasses(descriptors, BarMessage.class)) {
                Set<String> descriptorsSet = getDescriptors(descriptors, BarMessage.class);
                return new TransformationType(
                    descriptorsSet, new BarConversionPlanBuilder(query)
                );
            }
        }

        if (query.getType() == ChartType.TRADES_BBO) {
            if (mayContainSubclasses(descriptors, PackageHeader.class)) {
                return new TransformationType(
                    getDescriptors(descriptors, PackageHeader.class, SecurityFeedStatusMessage.class),
                    new BboPlanBuilder(query, false, false)
                );
            }
            if (mayContainSubclasses(descriptors, "deltix.timebase.api.messages.universal.PackageHeader")) {
                return new TransformationType(
                    null /* read all types */, new BboPlanBuilder(query, false, false)
                );
            }
        }

        throw new IllegalArgumentException("Stream " + query.getStream() + " type mismatch with chart type " + query.getType());
    }

    private Set<String> getDescriptors(RecordClassDescriptor[] descriptors, Class<?>... classes) {
        Set<String> foundClasses = new HashSet<>();
        for (int i = 0; i < classes.length; ++i) {
            String className = ClassDescriptor.getClassNameWithAssembly(classes[i]);
            foundClasses.add(className);
            foundClasses.addAll(
                getConvertible(descriptors, className)
                    .stream()
                    .map(NamedDescriptor::getName)
                    .collect(Collectors.toList())
            );
        }

        return foundClasses;
    }

    static String getClassName(Class<?> cls) {
        return ClassDescriptor.getClassNameWithAssembly(cls);
    }

    static boolean mayContainSubclasses(RecordClassDescriptor[] descriptors, Class<?> cls) {
        return mayContainSubclasses(descriptors, getClassName(cls));
    }

    static boolean mayContainSubclasses(RecordClassDescriptor[] descriptors, String className) {
        return getConvertible(descriptors, className).size() > 0;
    }

    static List<RecordClassDescriptor> getConvertible(RecordClassDescriptor[] descriptors, String className) {
        List<RecordClassDescriptor> convertible = new ArrayList<>();
        for (int j = 0; j < descriptors.length; ++j) {
            RecordClassDescriptor descriptor = descriptors[j];
            if (descriptor.isConvertibleTo(className)) {
                convertible.add(descriptor);
            }
        }

        return convertible;
    }

    private static Set<String> findDerivedTypes(RecordClassSet rcs, String... names) {
        Set<String> result = new HashSet<>();

        for (String name : names) {
            ClassDescriptor[] descriptors = rcs.getClasses();
            for (ClassDescriptor descriptor : descriptors) {
                if (descriptor instanceof RecordClassDescriptor) {
                    RecordClassDescriptor rcd = (RecordClassDescriptor) descriptor;
                    if (hadDerivedType(rcd, name)) {
                        result.add(rcd.getName());
                    }
                }
            }
        }

        return result;
    }

    private static boolean hadDerivedType(RecordClassDescriptor rcd, String className) {
        do {
            if (rcd.getName().equalsIgnoreCase(className)) {
                return true;
            }

            rcd = rcd.getParent();
        } while (rcd != null);

        return false;
    }

    private static String buildTypeFilter(Set<String> types) {
        StringBuilder sb = new StringBuilder();
        boolean first = true;
        for (String type : types) {
            if (!first) {
                sb.append(" or ");
            } else {
                first = false;
            }

            sb.append("this is \"").append(type).append("\"");
        }

        return sb.toString();
    }
}
