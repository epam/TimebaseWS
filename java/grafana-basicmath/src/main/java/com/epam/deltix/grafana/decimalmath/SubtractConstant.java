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

import com.epam.deltix.grafana.base.annotations.*;
import com.epam.deltix.dfp.Decimal;
import com.epam.deltix.dfp.Decimal64Utils;
import com.epam.deltix.computations.data.base.ArgumentType;
import com.epam.deltix.computations.data.base.Arguments;
import com.epam.deltix.computations.data.base.ValueType;


@GrafanaFunction(
        name = "subtract", group = "decimalmath",
        fieldArguments = {@FieldArgument(name = ConstantOperator.FIELD, types = {GrafanaValueType.NUMERIC})},
        constantArguments = {@ConstantArgument(name = ConstantOperator.OPERAND, type = ArgumentType.DECIMAL64, defaultValue = "1")},
        returnFields = {@ReturnField(ValueType.DECIMAL64)}
)
public class SubtractConstant extends ConstantOperator {

    public SubtractConstant(String fieldName, String resultName, @Decimal long operand) {
        super(fieldName, resultName, operand, Decimal64Utils::subtract);
    }

    public SubtractConstant(Arguments arguments) {
        this(arguments.getString(FIELD), arguments.getResultField(), arguments.getDecimal(OPERAND));
    }

}
