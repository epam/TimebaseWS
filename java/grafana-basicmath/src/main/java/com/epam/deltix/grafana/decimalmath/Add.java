package com.epam.deltix.grafana.decimalmath;

import com.epam.deltix.dfp.Decimal64Utils;
import com.epam.deltix.computations.data.base.Arguments;
import com.epam.deltix.computations.data.base.ValueType;
import com.epam.deltix.grafana.base.annotations.FieldArgument;
import com.epam.deltix.grafana.base.annotations.GrafanaFunction;
import com.epam.deltix.grafana.base.annotations.GrafanaValueType;
import com.epam.deltix.grafana.base.annotations.ReturnField;

@GrafanaFunction(
        name = "add", group = "decimalmath",
        fieldArguments = {
                @FieldArgument(name = BinaryOperator.FIELD1, types = {GrafanaValueType.NUMERIC}),
                @FieldArgument(name = BinaryOperator.FIELD2, types = {GrafanaValueType.NUMERIC})
        },
        returnFields = {@ReturnField(ValueType.DECIMAL64)}
)
public class Add extends BinaryOperator {

    public Add(String field1, String field2, String resultName) {
        super(field1, field2, resultName, Decimal64Utils::add);
    }

    public Add(Arguments arguments) {
        this(arguments.getString(BinaryOperator.FIELD1), arguments.getString(BinaryOperator.FIELD2), arguments.getResultField());
    }

}
