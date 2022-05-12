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

import com.epam.deltix.tbwg.webapp.services.charting.provider.BarsAggregationCalculatorImpl;
import com.epam.deltix.tbwg.webapp.services.charting.queries.ChartingResult;
import com.epam.deltix.tbwg.webapp.model.charting.ChartType;
import com.epam.deltix.tbwg.webapp.model.charting.ChartingFrameDef;
import com.epam.deltix.tbwg.webapp.model.input.QueryRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

import java.time.Instant;
import java.util.Arrays;
import java.util.List;

import static com.epam.deltix.tbwg.webapp.utils.BordersTimeBarChartsUtils.*;

@RestController
@RequestMapping("/api/v0/charting")
public class ChartingController {

    private final ChartingService chartingService;

    @Autowired
    public ChartingController(ChartingService chartingService) {
        this.chartingService = chartingService;
    }

    // todo: add endpoint that returns supported data types for stream

    @RequestMapping(value = "/settings/barPeriodicities", method = RequestMethod.GET)
    public List<BarPeriodicity> barPeriodicities() {
        // todo: make it configurable
        return Arrays.asList(
            new BarPeriodicity("1 second", 1000L),
            new BarPeriodicity("1 minute", 60 * 1000L),
            new BarPeriodicity("5 minutes", 5 * 60 * 1000L),
            new BarPeriodicity("15 minutes", 15 * 60 * 1000L),
            new BarPeriodicity("30 minutes", 30 * 60 * 1000L),
            new BarPeriodicity("1 hour", 60 * 60 * 1000L),
            new BarPeriodicity("4 hours", 4 * 60 * 60 * 1000L),
            new BarPeriodicity("1 day", 24 * 60 * 60 * 1000L),
            new BarPeriodicity("1 week", 7 * 24 * 60 * 60 * 1000L),
            new BarPeriodicity("1 month", 30 * 24 * 60 * 60 * 1000L),
            new BarPeriodicity("1 quarter", 90 * 24 * 60 * 60 * 1000L),
            new BarPeriodicity("1 year", 365 * 24 * 60 * 60 * 1000L)
        );
    }

    /**
     * Return charting data
     *
     * @param streamKey     stream key
     * @param symbols       list of symbols to query data
     * @param type          Chart Type
     * @param startTime     Query start time
     * @param endTime       Query end time
     * @param maxPoints     max points per chart
     * @param levels        number of display levels for L2 charts
     *
     * @return List of ChartingFrames
     */
    @RequestMapping(value = "/{streamKey}", method = RequestMethod.GET)
    public List<ChartingFrameDef> getData(@PathVariable String streamKey,
                                    @RequestParam List<String> symbols,
                                    @RequestParam(defaultValue = "PRICES_L2") ChartType type,
                                    @RequestParam Instant startTime,
                                    @RequestParam Instant endTime,
                                    @RequestParam(required = false, defaultValue = "100") int maxPoints,
                                    @RequestParam(required = false, defaultValue = "20") int levels)
    {
        if (maxPoints <= 1) {
            throw new RuntimeException("Illegal maxPoints value: " + maxPoints);
        }

        if (type == ChartType.BARS) {
            long pointInterval = new BarsAggregationCalculatorImpl().getAggregation(new TimeInterval(startTime, endTime));
            startTime = roundStartTime(startTime, pointInterval);
            endTime = roundEndTime(endTime, pointInterval);
        }

        return Arrays.asList(
            chartingService.getData(streamKey, symbols.get(0), type, new TimeInterval(startTime, endTime), maxPoints, levels)
        );
    }

    @RequestMapping(value = "/dx/{streamKey}", method = RequestMethod.GET)
    public ResponseEntity<StreamingResponseBody> getData(@PathVariable String streamKey,
                                                         @RequestParam String symbols,
                                                         @RequestParam(defaultValue = "PRICES_L2") ChartType type,
                                                         @RequestParam Instant startTime,
                                                         @RequestParam Instant endTime,
                                                         @RequestParam(required = false, defaultValue = "1000") long pointInterval,
                                                         @RequestParam(required = false, defaultValue = "20") int levels,
                                                         @RequestParam(required = false) Long correlationId)
    {
        if (pointInterval <= 0) {
            throw new RuntimeException("Illegal pointInterval value: " + pointInterval);
        }

        if (type == ChartType.BARS) {
            startTime = roundStartTime(startTime, pointInterval);
            endTime = roundEndTime(endTime, pointInterval);
        }

        ChartingResult chartingResult = chartingService.getDataStream(
            new ChartingSettings(
                streamKey, null, symbols, type,
                new TimeInterval(startTime, endTime),
                pointInterval, levels
            ), correlationId
        );

        if (chartingResult != null) {
            return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON_UTF8)
                .body(new ChartStreamingResponseBody(chartingResult));
        } else {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @RequestMapping(value = "/dx-query", method = RequestMethod.POST)
    public List<ChartingFrameDef> getData(@RequestBody QueryRequest query,
                                          @RequestParam(defaultValue = "PRICES_L2") ChartType type,
                                          @RequestParam Instant startTime,
                                          @RequestParam Instant endTime,
                                          @RequestParam(required = false, defaultValue = "1000") long pointInterval,
                                          @RequestParam(required = false) Long correlationId)
    {
        if (pointInterval <= 0) {
            throw new RuntimeException("Illegal pointInterval value: " + pointInterval);
        }

        return Arrays.asList(
            chartingService.getData(
                new ChartingSettings(
                    null, query.query, null, type,
                    new TimeInterval(startTime, endTime),
                    pointInterval, -1
                ), correlationId)
        );
    }

    @RequestMapping(value = "/dx/stopCharting", method = RequestMethod.GET)
    public void stopCharting(@RequestParam(required = true) Long[] correlationId) {
        if (correlationId != null) {
            for (int i = 0; i < correlationId.length; ++i) {
                chartingService.stopCharting(correlationId[i]);
            }
        }
    }
}
