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
package com.epam.deltix.grafana.stats;

import com.epam.deltix.computations.data.base.Arguments;
import com.epam.deltix.computations.data.base.ValueType;
import com.epam.deltix.grafana.base.annotations.FieldArgument;
import com.epam.deltix.grafana.base.annotations.GrafanaAggregation;
import com.epam.deltix.grafana.base.annotations.GrafanaValueType;
import com.epam.deltix.grafana.base.annotations.ReturnField;

@GrafanaAggregation(
        name = "median", group = "statistics",
        fieldArguments = {@FieldArgument(name = Quantile.FIELD, types = {GrafanaValueType.NUMERIC})},
        returnFields = {@ReturnField(ValueType.DOUBLE)},
        doc = "Quantile aggregation on some time interval."
)
public class Median extends Quantile {

    public Median(String fieldName, long start, long end, long interval, String resultName) {
        super(fieldName, 0.5, start, end, interval, resultName);
    }

    public Median(Arguments arguments) {
        this(arguments.getString(FIELD), arguments.getStart(), arguments.getEnd(), arguments.getInterval(), arguments.getResultField());
    }

}
