package com.epam.deltix.grafana.stats;

import com.epam.deltix.computations.data.base.Arguments;
import com.epam.deltix.computations.data.base.ValueType;
import com.epam.deltix.grafana.base.annotations.FieldArgument;
import com.epam.deltix.grafana.base.annotations.GrafanaAggregation;
import com.epam.deltix.grafana.base.annotations.GrafanaValueType;
import com.epam.deltix.grafana.base.annotations.ReturnField;

@GrafanaAggregation(
        name = "median", group = "statistics",
        fieldArguments = {@FieldArgument(name = Quantile.FIELD, types = {GrafanaValueType.NUMERIC})},
        returnFields = {@ReturnField(ValueType.DOUBLE)},
        doc = "Quantile aggregation on some time interval."
)
public class Median extends Quantile {

    public Median(String fieldName, long start, long end, long interval, String resultName) {
        super(fieldName, 0.5, start, end, interval, resultName);
    }

    public Median(Arguments arguments) {
        this(arguments.getString(FIELD), arguments.getStart(), arguments.getEnd(), arguments.getInterval(), arguments.getResultField());
    }

}
