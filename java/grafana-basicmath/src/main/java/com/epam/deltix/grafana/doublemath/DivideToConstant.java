package com.epam.deltix.grafana.doublemath;

import com.epam.deltix.grafana.base.annotations.*;
import com.epam.deltix.computations.data.base.ArgumentType;
import com.epam.deltix.computations.data.base.Arguments;
import com.epam.deltix.computations.data.base.ValueType;

@GrafanaFunction(
        name = "divideToConstant", group = "doublemath",
        fieldArguments = {@FieldArgument(name = ConstantOperator.FIELD, types = {GrafanaValueType.NUMERIC})},
        constantArguments = {@ConstantArgument(name = ConstantOperator.OPERAND, type = ArgumentType.FLOAT64, defaultValue = "1")},
        returnFields = {@ReturnField(ValueType.DECIMAL64)}
)
public class DivideToConstant extends ConstantOperator {

    public DivideToConstant(String fieldName, String resultName, double operand) {
        super(fieldName, resultName, operand, (x, y) -> x / y);
    }

    public DivideToConstant(Arguments arguments) {
        this(arguments.getString(FIELD), arguments.getResultField(), arguments.getDouble(OPERAND));
    }

    @Override
    public boolean isValidOperand(double value) {
        return value != 0 && super.isValidOperand(value);
    }
}
