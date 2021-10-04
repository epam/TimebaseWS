package com.epam.deltix.grafana.doublemath;

import com.epam.deltix.computations.data.base.Arguments;
import com.epam.deltix.computations.data.base.ValueType;
import com.epam.deltix.grafana.base.annotations.FieldArgument;
import com.epam.deltix.grafana.base.annotations.GrafanaFunction;
import com.epam.deltix.grafana.base.annotations.GrafanaValueType;
import com.epam.deltix.grafana.base.annotations.ReturnField;

@GrafanaFunction(
        name = "divide", group = "doublemath",
        fieldArguments = {
                @FieldArgument(name = BinaryOperator.FIELD1, types = {GrafanaValueType.NUMERIC}),
                @FieldArgument(name = BinaryOperator.FIELD2, types = {GrafanaValueType.NUMERIC})
        },
        returnFields = {@ReturnField(ValueType.DOUBLE)}
)
public class Divide extends BinaryOperator {

    public Divide(String field1, String field2, String resultName) {
        super(field1, field2, resultName, (x, y) -> x * y);
    }

    public Divide(Arguments arguments) {
        this(arguments.getString(FIELD1), arguments.getString(FIELD2), arguments.getResultField());
    }

}
