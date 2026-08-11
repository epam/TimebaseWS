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
package com.epam.deltix.tbwg.webapp.services.charting;

import com.epam.deltix.gflog.api.Log;
import com.epam.deltix.gflog.api.LogFactory;
import com.epam.deltix.tbwg.webapp.model.charting.ChartingFrameDef;
import com.epam.deltix.tbwg.webapp.model.charting.ChartingLineDef;
import com.epam.deltix.tbwg.webapp.model.charting.line.LineElement;
import com.epam.deltix.tbwg.webapp.model.charting.line.LineElementDef;
import com.epam.deltix.tbwg.webapp.services.charting.provider.LinesProvider;
import com.epam.deltix.tbwg.webapp.services.charting.queries.BookSymbolQueryImpl;
import com.epam.deltix.tbwg.webapp.services.charting.queries.ChartingResult;
import com.epam.deltix.tbwg.webapp.services.charting.queries.LinesQueryImpl;
import com.epam.deltix.tbwg.webapp.services.charting.queries.LinesQueryResult;
import com.epam.deltix.tbwg.webapp.services.charting.queries.QqlQueryImpl;
import com.epam.deltix.tbwg.webapp.services.timebase.TimebaseRegistry;
import com.epam.deltix.tbwg.webapp.services.timebase.exc.UnknownStreamException;
import com.epam.deltix.tbwg.webapp.utils.TBWGUtils;
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
    private final TimebaseRegistry registry;

    private final LongToObjectHashMap<ChartingResult> runningTasks = new LongToObjectHashMap<>();
    private final LongToLongHashMap stoppedTasks = new LongToLongHashMap();

    @Autowired
    public ChartingServiceImpl(LinesProvider provider, TimebaseRegistry registry) {
        this.provider = provider;
        this.registry = registry;
    }

    @Scheduled(fixedDelay = 5 * 60 * 1000)
    public void clearTasks() {
        clearStaledStoppedTasks();
        clearClosedTasks();
    }

    @Override
    public ChartingFrameDef getData(ChartingSettings settings, Long correlationId) {
        ChartingResult result = buildChartingResult(settings);

        addRunningTask(result, correlationId);
        try {
            if (isTaskStopped(correlationId)) {
                return null;
            }

            return buildChartingFrames(result);
        } finally {
            closeRunningTask(correlationId);
        }
    }

    @Override
    public ChartingResult getDataStream(ChartingSettings settings, Long correlationId) {
        ChartingResult result = buildChartingResult(settings);

        addRunningTask(result, correlationId);
        if (isTaskStopped(correlationId)) {
            closeRunningTask(correlationId);
            return null;
        }

        return result;
    }

    private ChartingResult buildChartingResult(ChartingSettings settings) {
        LinesQueryImpl query = settings.getQql() == null ?
            new BookSymbolQueryImpl(
                settings.getStream(),
                settings.getSymbols(),
                settings.getType(),
                settings.getInterval(),
                settings.getPointInterval(),
                settings.getLevels(),
                false,
                settings.getDataSource()
            ) :
            new QqlQueryImpl(
                settings.getQql(),
                settings.getType(),
                settings.getInterval(),
                settings.getPointInterval(),
                false
            );
        query.setService(registry.resolve(settings.getTbId()));
        return provider.getLines(query);
    }

    @Override
    public String[] linearChartColumns(String streamKey, String tbId) throws UnknownStreamException {
        return TBWGUtils.getLinearChartColumns(registry.resolve(tbId).getStreamChecked(streamKey).getTypes());
    }

    @Override
    public void stopCharting(Long correlationId) {
        addStoppedTask(correlationId);
        closeRunningTask(correlationId);
    }

    private boolean isTaskStopped(Long id) {
        synchronized (stoppedTasks) {
            return id != null && stoppedTasks.containsKey(id);
        }
    }

    private void addStoppedTask(Long id) {
        if (id != null) {
            synchronized (stoppedTasks) {
                stoppedTasks.put(id, System.currentTimeMillis());
            }
        }
    }

    private void addRunningTask(ChartingResult result, Long id) {
        if (id != null) {
            synchronized (runningTasks) {
                runningTasks.put(id, result);
            }
        }
    }

    private void closeRunningTask(Long id) {
        if (id != null) {
            synchronized (runningTasks) {
                ChartingResult task = runningTasks.remove(id, null);
                if (task != null) {
                    task.close();
                }
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
                    lineResult.getName(i),
                    new ChartingLineDef(lineResult.getAggregation(), lineResult.getNewWindowSize(), elements.get(i))
                );
            }
        });

        chartResult.run();

        return new ChartingFrameDef(linesResult.getName(), lines, linesResult.getInterval());
    }

    private void clearStaledStoppedTasks() {
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

    private void clearClosedTasks() {
        synchronized (runningTasks) {
            long[] keys = runningTasks.keysToArray(null);
            for (int i = 0; i < keys.length; ++i) {
                ChartingResult task = runningTasks.get(keys[i], null);
                if (task != null && task.isClosed()) {
                    runningTasks.remove(keys[i]);
                }
            }
        }
    }

}