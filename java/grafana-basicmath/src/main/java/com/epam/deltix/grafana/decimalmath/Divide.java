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
package com.epam.deltix.grafana.decimalmath;

import com.epam.deltix.dfp.Decimal64Utils;
import com.epam.deltix.computations.data.base.Arguments;
import com.epam.deltix.computations.data.base.GenericValueInfo;
import com.epam.deltix.computations.data.base.ValueType;
import com.epam.deltix.grafana.base.annotations.FieldArgument;
import com.epam.deltix.grafana.base.annotations.GrafanaFunction;
import com.epam.deltix.grafana.base.annotations.GrafanaValueType;
import com.epam.deltix.grafana.base.annotations.ReturnField;

@GrafanaFunction(
        name = "divide", group = "decimalmath",
        fieldArguments = {
                @FieldArgument(name = BinaryOperator.FIELD1, types = {GrafanaValueType.NUMERIC}),
                @FieldArgument(name = BinaryOperator.FIELD2, types = {GrafanaValueType.NUMERIC})
        },
        returnFields = {@ReturnField(ValueType.DECIMAL64)}
)
public class Divide extends BinaryOperator {

    public Divide(String field1, String field2, String resultName) {
        super(field1, field2, resultName, Decimal64Utils::mean);
    }

    public Divide(Arguments arguments) {
        this(arguments.getString(FIELD1), arguments.getString(FIELD2), arguments.getResultField());
    }

    @Override
    public boolean isValidSecond(GenericValueInfo value) {
        return super.isValidSecond(value) && value.decimalValue() != Decimal64Utils.ZERO;
    }
}
