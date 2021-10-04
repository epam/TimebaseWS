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
package com.epam.deltix.grafana.basicmath;

import com.epam.deltix.computations.data.base.Arguments;
import com.epam.deltix.computations.data.base.ValueType;
import com.epam.deltix.grafana.base.annotations.FieldArgument;
import com.epam.deltix.grafana.base.annotations.GrafanaAggregation;
import com.epam.deltix.grafana.base.annotations.GrafanaValueType;
import com.epam.deltix.grafana.base.annotations.ReturnField;

@GrafanaAggregation(
        group = "basicmath", name = "sum",
        fieldArguments = {@FieldArgument(name = BaseSum.FIELD, types = {GrafanaValueType.NUMERIC})},
        returnFields = {@ReturnField(ValueType.DOUBLE)},
        doc = "Sum of nonnull values on some time interval"
)
public class Sum extends BaseSum {

    public Sum(String fieldName, long interval, String resultName, long start, long end) {
        super(fieldName, interval, resultName, start, end, true);
    }

    public Sum(Arguments arguments) {
        super(arguments, true);
    }

}
