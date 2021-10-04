package com.epam.deltix.grafana.decimalmath;

import com.epam.deltix.dfp.Decimal64Utils;
import com.epam.deltix.computations.data.base.Arguments;
import com.epam.deltix.computations.data.base.ValueType;
import com.epam.deltix.grafana.base.annotations.FieldArgument;
import com.epam.deltix.grafana.base.annotations.GrafanaFunction;
import com.epam.deltix.grafana.base.annotations.GrafanaValueType;
import com.epam.deltix.grafana.base.annotations.ReturnField;

@GrafanaFunction(
        name = "subtract", group = "decimalmath",
        fieldArguments = {
                @FieldArgument(name = BinaryOperator.FIELD1, types = {GrafanaValueType.NUMERIC}),
                @FieldArgument(name = BinaryOperator.FIELD2, types = {GrafanaValueType.NUMERIC})
        },
        returnFields = {@ReturnField(ValueType.DECIMAL64)}
)
public class Subtract extends BinaryOperator {

    public Subtract(String field1, String field2, String resultName) {
        super(field1, field2, resultName, Decimal64Utils::mean);
    }

    public Subtract(Arguments arguments) {
        this(arguments.getString(FIELD1), arguments.getString(FIELD2), arguments.getResultField());
    }

}