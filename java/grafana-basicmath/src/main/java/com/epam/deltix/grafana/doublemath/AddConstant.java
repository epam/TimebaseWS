package com.epam.deltix.grafana.doublemath;

import com.epam.deltix.grafana.base.annotations.*;
import com.epam.deltix.computations.data.base.ArgumentType;
import com.epam.deltix.computations.data.base.Arguments;
import com.epam.deltix.computations.data.base.ValueType;

@GrafanaFunction(
        name = "add", group = "doublemath",
        fieldArguments = {@FieldArgument(name = ConstantOperator.FIELD, types = {GrafanaValueType.NUMERIC})},
        constantArguments = {@ConstantArgument(name = ConstantOperator.OPERAND, type = ArgumentType.FLOAT64, defaultValue = "1")},
        returnFields = {@ReturnField(ValueType.DECIMAL64)}
)
public class AddConstant extends ConstantOperator {

    public AddConstant(String fieldName, String resultName, double operand) {
        super(fieldName, resultName, operand, Double::sum);
    }

    public AddConstant(Arguments arguments) {
        this(arguments.getString(FIELD), arguments.getResultField(), arguments.getDouble(OPERAND));
    }

}
