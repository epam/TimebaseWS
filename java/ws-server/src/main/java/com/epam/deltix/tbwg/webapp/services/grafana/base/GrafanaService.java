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
package com.epam.deltix.tbwg.webapp.services.grafana.base;

import com.epam.deltix.tbwg.webapp.services.grafana.exc.NoSuchStreamException;
import com.epam.deltix.gflog.api.Log;
import com.epam.deltix.gflog.api.LogFactory;
import com.epam.deltix.tbwg.webapp.model.grafana.DynamicList;
import com.epam.deltix.tbwg.webapp.model.grafana.StreamSchema;
import com.epam.deltix.tbwg.webapp.model.grafana.TimeSeriesEntry;
import com.epam.deltix.tbwg.webapp.model.grafana.queries.DataQueryRequest;
import com.epam.deltix.tbwg.webapp.model.grafana.queries.SelectQuery;
import com.epam.deltix.tbwg.webapp.model.grafana.time.TimeRange;
import com.epam.deltix.tbwg.webapp.services.grafana.exc.ValidationException;
import com.epam.deltix.tbwg.webapp.utils.grafana.GrafanaUtils;
import com.epam.deltix.util.collections.generated.ObjectArrayList;
import com.epam.deltix.computations.base.exc.RecordValidationException;
import com.epam.deltix.grafana.model.DataFrame;

import java.util.List;
import java.util.stream.Collectors;

public interface GrafanaService {

    Log LOG = LogFactory.getLog(GrafanaService.class);

    DataFrame dataFrame(String refId, String rawQuery, TimeRange timeRange, boolean isVariableQuery) throws ValidationException;

    DataFrame dataFrame(SelectQuery query, TimeRange timeRange, int maxDataPoints, Long intervalMs) throws ValidationException,
            RecordValidationException;

    default List<DataFrame> dataFrames(DataQueryRequest<SelectQuery> request) throws RecordValidationException,
            ValidationException {
        List<DataFrame> dataFrames = new ObjectArrayList<>();
        for (SelectQuery target : request.getTargets()) {
            dataFrames.add(target.isRaw() ? dataFrame(target.getRefId(), target.getRawQuery(), request.getRange(), target.isVariableQuery()) :
                    dataFrame(target, request.getRange(), request.getMaxDataPoints(), request.getIntervalMs()));
        }
        return dataFrames;
    }

    default List<TimeSeriesEntry> timeSeries(DataQueryRequest<SelectQuery> request) throws RecordValidationException,
            ValidationException {
        return dataFrames(request).stream().flatMap(df -> GrafanaUtils.convert(df).stream()).collect(Collectors.toList());
    }

    default List<Object> select(DataQueryRequest<SelectQuery> request) throws RecordValidationException,
            ValidationException {
        long start = System.currentTimeMillis();
        List<SelectQuery> targets = request.getTargets();
        request.setTargets(targets.stream().filter(q -> q.getView() == null || q.getView() == SelectQuery.View.DATAFRAME).collect(Collectors.toList()));
        List<Object> list = new ObjectArrayList<>();
        list.addAll(dataFrames(request));
        request.setTargets(targets.stream().filter(q -> q.getView() == SelectQuery.View.TIMESERIES).collect(Collectors.toList()));
        list.addAll(timeSeries(request));
        long end = System.currentTimeMillis();
        LOG.info().append("Request execution took ").append((end - start) / 1000., 3).append(" seconds.").commit();
        return list;
    }

    List<String> groupByViewOptions();

    DynamicList listStreams(String template, int offset, int limit);

    DynamicList listSymbols(String streamKey, String template, int offset, int limit) throws NoSuchStreamException;

    StreamSchema schema(String streamKey) throws NoSuchStreamException;

}
