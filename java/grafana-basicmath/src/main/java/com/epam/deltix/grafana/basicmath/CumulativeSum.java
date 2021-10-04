package com.epam.deltix.grafana.basicmath;

import com.epam.deltix.computations.data.base.Arguments;
import com.epam.deltix.computations.data.base.ValueType;
import com.epam.deltix.grafana.base.annotations.FieldArgument;
import com.epam.deltix.grafana.base.annotations.GrafanaAggregation;
import com.epam.deltix.grafana.base.annotations.GrafanaValueType;
import com.epam.deltix.grafana.base.annotations.ReturnField;

@GrafanaAggregation(
        group = "basicmath", name = "cumsum",
        fieldArguments = {@FieldArgument(name = BaseSum.FIELD, types = {GrafanaValueType.NUMERIC})},
        returnFields = {@ReturnField(ValueType.DOUBLE)},
        doc = "Sum of nonnull values on some time interval"
)
public class CumulativeSum extends BaseSum {

    public CumulativeSum(String fieldName, long interval, String resultName, long start, long end) {
        super(fieldName, interval, resultName, start, end, false);
    }

    public CumulativeSum(Arguments arguments) {
        super(arguments, false);
    }

}
