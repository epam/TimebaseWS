package com.epam.deltix.grafana.decimalmath;

import com.epam.deltix.dfp.Decimal;
import com.epam.deltix.dfp.Decimal64Utils;
import com.epam.deltix.grafana.base.annotations.*;
import com.epam.deltix.computations.data.base.ArgumentType;
import com.epam.deltix.computations.data.base.Arguments;
import com.epam.deltix.computations.data.base.ValueType;

@GrafanaFunction(
        name = "divideToConstant", group = "decimalmath",
        fieldArguments = {@FieldArgument(name = ConstantOperator.FIELD, types = {GrafanaValueType.NUMERIC})},
        constantArguments = {@ConstantArgument(name = ConstantOperator.OPERAND, type = ArgumentType.DECIMAL64, defaultValue = "1")},
        returnFields = {@ReturnField(ValueType.DECIMAL64)}
)
public class DivideToConstant extends ConstantOperator {

    public DivideToConstant(String fieldName, String resultName, @Decimal long operand) {
        super(fieldName, resultName, operand, Decimal64Utils::divide);
    }

    public DivideToConstant(Arguments arguments) {
        this(arguments.getString(FIELD), arguments.getResultField(), arguments.getDecimal(OPERAND));
    }

}
