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
package com.epam.deltix.tbwg.webapp.services.charting;

import com.epam.deltix.tbwg.webapp.services.charting.provider.LinesProvider;
import com.epam.deltix.tbwg.webapp.services.charting.queries.*;
import com.epam.deltix.tbwg.webapp.websockets.subscription.SubscriptionChannel;
import com.epam.deltix.gflog.api.Log;
import com.epam.deltix.gflog.api.LogFactory;
import com.epam.deltix.tbwg.webapp.model.ErrorDef;
import com.epam.deltix.tbwg.webapp.model.charting.ChartingFrameDef;
import com.epam.deltix.tbwg.webapp.model.charting.ChartingLineDef;
import com.epam.deltix.tbwg.webapp.model.charting.line.LineElement;
import com.epam.deltix.tbwg.webapp.model.charting.line.LineElementDef;
import com.epam.deltix.tbwg.webapp.services.tasks.StompSubscriptionTask;
import com.epam.deltix.tbwg.webapp.utils.TBWGUtils;

import java.util.*;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;

public class LiveChartingStompSubscriptionTask extends StompSubscriptionTask {

    private static final Log LOGGER = LogFactory.getLog(LiveChartingStompSubscriptionTask.class);

    private final SubscriptionChannel channel;
    private final ChartingResult result;
    private final Map<String, LineElements> lineElementsMap = new HashMap<>();

    private volatile ScheduledFuture<?> periodicTask;

    private static class LineElements {
        private final List<List<LineElement>> elements = new ArrayList<>();

        private LineElements(LineResult lineResult) {
            initElements(lineResult.linesCount());
        }

        private void initElements(int count) {
            elements.clear();
            for (int i = 0; i < count; ++i) {
                elements.add(new ArrayList<>());
            }
        }

        private synchronized void addElement(LineElementDef element) {
            int id = element.lineId();
            if (id >= 0 && id < elements.size()) {
                elements.get(id).add(element.copy());
            }
        }

        private synchronized List<List<LineElement>> snapshot() {
            List<List<LineElement>> snapshot = new ArrayList<>(elements);
            initElements(elements.size());
            return snapshot;
        }

    }

    public LiveChartingStompSubscriptionTask(LinesProvider linesProvider,
                                             ChartingSettings chartingSettings,
                                             SubscriptionChannel channel)
    {
        this.channel = channel;

        this.result = linesProvider.getLines(
            chartingSettings.getQql() == null ?
                new BookSymbolQueryImpl(
                    chartingSettings.getStream(),
                    chartingSettings.getSymbol(),
                    chartingSettings.getType(),
                    chartingSettings.getInterval(),
                    0,
                    chartingSettings.getPointInterval(),
                    chartingSettings.getLevels(),
                    true
                ) :
                new QqlQueryImpl(
                    chartingSettings.getQql(),
                    chartingSettings.getType(),
                    chartingSettings.getInterval(),
                    0,
                    chartingSettings.getPointInterval(),
                    true
                )
        );

        result.result().getLines().forEach(lineResult -> {
            LineElements linesElements = new LineElements(lineResult);
            lineElementsMap.put(lineResult.getName(), linesElements);
            lineResult.getPoints().subscribe(message -> {
                if (message instanceof LineElementDef) {
                    linesElements.addElement((LineElementDef) message);
                }
            });
        });
    }

    @Override
    public void run() {
        try {
            periodicTask = taskExecutor.scheduleTask(
                this::sendSnapshot, 1000, 1000, TimeUnit.MILLISECONDS
            );

            result.run(taskExecutor.executorService());
        } catch (Throwable t) {
            LOGGER.error().append("Live charting failed").append(t).commit();
            channel.sendError(new ErrorDef(t.getMessage(), "chart_stomp_error"));
        } finally {
            close();
        }
    }

    private void sendSnapshot() {
        LinesQueryResult chartResult = result.result();
        Map<String, ChartingLineDef> lines = new HashMap<>();
        chartResult.getLines().forEach(lineResult ->
                updateLines(lineElementsMap.get(lineResult.getName()), lines, lineResult));

        boolean isEmpty = true;
        for (ChartingLineDef line : lines.values()) {
            if (line.getPoints().size() > 0) {
                isEmpty = false;
                break;
            }
        }

        if (!isEmpty) {
            channel.sendMessage(
                new ChartingFrameDef(chartResult.getName(), lines, chartResult.getInterval())
            );
        }
    }

    private void updateLines(LineElements lineElements, Map<String, ChartingLineDef> lines, LineResult lineResult) {
        List<List<LineElement>> elements = lineElements.snapshot();
        for (int i = 0; i < elements.size(); ++i) {
            lines.put(
                    lineResult.getName().replace("[]", "[" + i + "]"),
                    new ChartingLineDef(lineResult.getAggregation(), lineResult.getNewWindowSize(), elements.get(i))
            );
        }
    }

    @Override
    public void close() {
        if (periodicTask != null) {
            TBWGUtils.cancel(periodicTask, true);
        }
        result.close();
    }

}
