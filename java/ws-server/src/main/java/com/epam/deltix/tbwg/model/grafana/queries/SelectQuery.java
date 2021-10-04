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
package com.epam.deltix.tbwg.model.grafana.queries;

import com.epam.deltix.tbwg.model.grafana.filters.FieldFilter;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.epam.deltix.tbwg.model.grafana.TBField;
import lombok.Getter;
import lombok.Setter;

import java.util.List;
import java.util.Map;

/**
 * Select query, that allows selecting separate fields, filtering by plain fields (not arrays, objects and binaries)
 * and aggregations by time interval.
 */
@Getter
@Setter
public class SelectQuery extends TBQuery {

    /**
     * Symbols list. If empty - query is performed over all symbols.
     */
    @JsonProperty
    protected List<String> symbols;

    /**
     * Types list. If empty - query is performed over all types.
     */
    @JsonProperty
    protected List<String> types;

    /**
     * Types to lists of fields map.
     */
    @JsonProperty
    protected Map<String, List<TBField>> fields;

    @JsonProperty
    protected List<FunctionDef> functions;

    /**
     * Time interval for aggregation. If null - calculated dynamically.
     */
    @JsonProperty
    protected AggregationInterval interval;

    /**
     * Types to list of field filters.
     */
    @JsonProperty
    protected Map<String, List<FieldFilter>> filters;

    /**
     * List of fields, that group by is performed over.
     */
    @JsonProperty
    private List<TimebaseField> groupBy;

    /**
     * GroupBy view option.
     */
    @JsonProperty
    private String groupByView;

    @JsonProperty
    private View view;

    /**
     * Marks if raw query should be processed
     */
    @JsonProperty
    private boolean raw;

    /**
     * Raw QQL query.
     */
    @JsonProperty
    private String rawQuery;

    @JsonProperty
    private boolean variableQuery;

    @Getter
    @Setter
    public static class AggregationInterval {

        @JsonProperty
        private IntervalType intervalType;

        @JsonProperty
        private Long value;
    }

    public enum IntervalType {
        MAX_DATA_POINTS, FULL_INTERVAL, MILLISECONDS
    }

    @Getter
    @Setter
    public static class FunctionDef {

        @JsonProperty
        private String id;

        @JsonProperty
        private String name;

        @JsonProperty
        private List<FieldArg> fieldArgs;

        @JsonProperty
        private Map<String, String> constantArgs;

        @JsonProperty
        private String resultField;

        @JsonProperty
        private Map<String, String> resultFields;

        @JsonProperty
        private List<TimebaseField> groupBy;
    }

    @Getter
    @Setter
    public static class FieldArg {

        @JsonProperty
        private FunctionDef function;

        @JsonProperty
        private TimebaseField field;

    }

    @Getter
    @Setter
    public static class TimebaseField {

        @JsonProperty
        private String type;

        @JsonProperty
        private String name;

    }

    public enum View {
        DATAFRAME, TIMESERIES
    }
}
