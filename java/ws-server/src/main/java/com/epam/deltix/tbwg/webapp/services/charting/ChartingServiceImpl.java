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
import com.epam.deltix.tbwg.webapp.services.charting.queries.BookSymbolQueryImpl;
import com.epam.deltix.tbwg.webapp.services.charting.queries.ChartingResult;
import com.epam.deltix.gflog.api.Log;
import com.epam.deltix.gflog.api.LogFactory;
import com.epam.deltix.tbwg.webapp.model.charting.ChartType;
import com.epam.deltix.tbwg.webapp.model.charting.ChartingFrameDef;
import com.epam.deltix.tbwg.webapp.model.charting.ChartingLineDef;
import com.epam.deltix.tbwg.webapp.model.charting.line.LineElement;
import com.epam.deltix.tbwg.webapp.model.charting.line.LineElementDef;
import com.epam.deltix.tbwg.webapp.services.charting.queries.LinesQueryResult;
import com.epam.deltix.tbwg.webapp.services.charting.queries.QqlQueryImpl;
import com.epam.deltix.util.collections.generated.LongToLongHashMap;
import com.epam.deltix.util.collections.generated.LongToObjectHashMap;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class ChartingServiceImpl implements ChartingService {

    private static final Log LOGGER = LogFactory.getLog(ChartingServiceImpl.class);

    private final LinesProvider provider;

    private final LongToObjectHashMap<ChartingResult> runningTasks = new LongToObjectHashMap<>();
    private final LongToLongHashMap stoppedTasks = new LongToLongHashMap();

    @Autowired
    public ChartingServiceImpl(LinesProvider provider) {
        this.provider = provider;
    }

    @Scheduled(fixedDelay = 5 * 60 * 1000)
    public void clearStoppedTasks() {
        synchronized (stoppedTasks) {
            long currentTime = System.currentTimeMillis();
            long[] keys = stoppedTasks.keysToArray(null);
            for (int i = 0; i < keys.length; ++i) {
                long time = stoppedTasks.get(keys[i], 0);
                if (currentTime - time > 2 * 60 * 1000) {
                    stoppedTasks.remove(keys[i]);
                }
            }
        }
    }

    @Override
    public ChartingFrameDef getData(String stream, String symbol, ChartType type,
                                    TimeInterval interval, int maxPoints, int levels)
    {
        ChartingResult result = provider.getLines(
            new BookSymbolQueryImpl(stream, symbol, type, interval, maxPoints, -1, levels, false)
        );

        return buildChartingFrames(result);
    }

    @Override
    public ChartingFrameDef getData(ChartingSettings settings, Long correlationId) {
        ChartingResult result = buildChartingResult(settings);

        newTask(result, correlationId);
        try {
            if (isTaskStopped(correlationId)) {
                return null;
            }

            return buildChartingFrames(result);
        } finally {
            endTask(correlationId);
        }
    }

    @Override
    public ChartingResult getDataStream(ChartingSettings settings, Long correlationId) {
        ChartingResult result = buildChartingResult(settings);

        newTask(result, correlationId);
        if (isTaskStopped(correlationId)) {
            return null;
        }

        return result;
    }

    private ChartingResult buildChartingResult(ChartingSettings settings) {
        return provider.getLines(
            settings.getQql() == null ?
                new BookSymbolQueryImpl(
                    settings.getStream(),
                    settings.getSymbol(),
                    settings.getType(),
                    settings.getInterval(),
                    0,
                    settings.getPointInterval(),
                    settings.getLevels(),
                    false
                ) :
                new QqlQueryImpl(
                    settings.getQql(),
                    settings.getType(),
                    settings.getInterval(),
                    0,
                    settings.getPointInterval(),
                    false
                )
        );
    }

    @Override
    public void stopCharting(long id) {
        addStoppedTask(id);
        closeTask(id);
    }

    private boolean isTaskStopped(Long id) {
        synchronized (stoppedTasks) {
            return id != null && stoppedTasks.containsKey(id);
        }
    }

    private void addStoppedTask(long id) {
        synchronized (stoppedTasks) {
            stoppedTasks.put(id, System.currentTimeMillis());
        }
    }

    private void newTask(ChartingResult result, Long correlationId) {
        if (correlationId != null) {
            synchronized (runningTasks) {
                runningTasks.put(correlationId, result);
            }
        }
    }

    private void endTask(Long correlationId) {
        if (correlationId != null) {
            synchronized (runningTasks) {
                runningTasks.remove(correlationId);
            }
        }
    }

    private void closeTask(long correlationId) {
        synchronized (runningTasks) {
            ChartingResult task = runningTasks.get(correlationId, null);
            if (task != null) {
                task.close();
            }
        }
    }

    private ChartingFrameDef buildChartingFrames(ChartingResult chartResult) {
        Map<String, ChartingLineDef> lines = new HashMap<>();
        LinesQueryResult linesResult = chartResult.result();
        linesResult.getLines().forEach(lineResult -> {
            List<List<LineElement>> elements = new ArrayList<>();
            for (int i = 0; i < lineResult.linesCount(); ++i) {
                elements.add(new ArrayList<>());
            }

            lineResult.getPoints().subscribe(message -> {
                if (message instanceof LineElementDef) {
                    LineElementDef element = (LineElementDef) message;
                    int id = element.lineId();
                    if (id >= 0 && id < elements.size()) {
                        elements.get(id).add(element.copy());
                    }
                }
            });

            for (int i = 0; i < elements.size(); ++i) {
                lines.put(
                    lineResult.getName().replace("[]", "[" + i + "]"),
                    new ChartingLineDef(lineResult.getAggregation(), lineResult.getNewWindowSize(), elements.get(i))
                );
            }
        });

        chartResult.run();

        return new ChartingFrameDef(linesResult.getName(), lines, linesResult.getInterval());
    }
}
