package com.epam.deltix.grafana.decimalmath;

import com.epam.deltix.dfp.Decimal64Utils;
import com.epam.deltix.computations.data.base.Arguments;
import com.epam.deltix.computations.data.base.ValueType;
import com.epam.deltix.grafana.base.annotations.FieldArgument;
import com.epam.deltix.grafana.base.annotations.GrafanaFunction;
import com.epam.deltix.grafana.base.annotations.GrafanaValueType;
import com.epam.deltix.grafana.base.annotations.ReturnField;

@GrafanaFunction(
        name = "square", group = "decimalmath",
        fieldArguments = {@FieldArgument(name = BinaryOperator.FIELD1, types = {GrafanaValueType.NUMERIC})},
        returnFields = {@ReturnField(ValueType.DECIMAL64)}
)
public class Square extends BinaryOperator {

    public Square(String field1, String resultName) {
        super(field1, field1, resultName, Decimal64Utils::multiply);
    }

    public Square(Arguments arguments) {
        this(arguments.getString(BinaryOperator.FIELD1), arguments.getResultField());
    }

}
