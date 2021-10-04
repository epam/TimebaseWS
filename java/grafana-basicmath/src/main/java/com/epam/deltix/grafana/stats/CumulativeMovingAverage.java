package com.epam.deltix.grafana.stats;

import com.epam.deltix.dfp.Decimal;
import com.epam.deltix.dfp.Decimal64Utils;
import com.epam.deltix.util.collections.generated.ObjectArrayList;
import com.epam.deltix.computations.base.exc.RecordValidationException;
import com.epam.deltix.computations.data.MutableGenericRecordImpl;
import com.epam.deltix.computations.data.base.Arguments;
import com.epam.deltix.computations.data.base.GenericRecord;
import com.epam.deltix.computations.data.base.MutableGenericRecord;
import com.epam.deltix.computations.data.base.ValueType;
import com.epam.deltix.computations.data.numeric.MutableDecimalValue;
import com.epam.deltix.grafana.base.Aggregation;
import com.epam.deltix.grafana.base.annotations.FieldArgument;
import com.epam.deltix.grafana.base.annotations.GrafanaFunction;
import com.epam.deltix.grafana.base.annotations.GrafanaValueType;
import com.epam.deltix.grafana.base.annotations.ReturnField;
import com.epam.deltix.grafana.data.NumericField;
import com.epam.deltix.grafana.model.fields.Field;

import java.util.Collection;
import java.util.List;

@GrafanaFunction(
        name = "cma", group = "statistics",
        fieldArguments = {@FieldArgument(name = CumulativeMovingAverage.FIELD, types = {GrafanaValueType.NUMERIC})},
        returnFields = {@ReturnField(ValueType.DECIMAL64)},
        doc = "Cumulative moving average."
)
public class CumulativeMovingAverage implements Aggregation {

    public static final String FIELD = "field";

    private final String fieldName;
    private final List<Field> resultFields = new ObjectArrayList<>();
    private final MutableGenericRecord resultRecord = new MutableGenericRecordImpl();
    private final MutableDecimalValue decimalValue = new MutableDecimalValue();

    private long count = 0;
    private @Decimal long sum = Decimal64Utils.ZERO;
    private @Decimal long average = Decimal64Utils.NULL;

    public CumulativeMovingAverage(String fieldName, String resultName) {
        this.fieldName = fieldName;
        Field resultField = new NumericField(resultName);
        resultFields.add(resultField);
        resultRecord.set(resultField.name(), decimalValue);
    }

    public CumulativeMovingAverage(Arguments arguments) {
        this(arguments.getString(FIELD), arguments.getResultField());
    }

    @Override
    public Collection<Field> fields() {
        return resultFields;
    }

    @Override
    public boolean add(GenericRecord record) throws RecordValidationException {
        if (record.containsNonNull(fieldName)) {
            @Decimal long value = record.getValue(fieldName).decimalValue();
            ++count;
            sum = Decimal64Utils.add(sum, value);
            average = Decimal64Utils.divideByInteger(sum, count);
            decimalValue.setDecimal(average);
            resultRecord.setTimestamp(record.timestamp());
            return true;
        }
        return false;
    }

    @Override
    public GenericRecord record(long timestamp) {
        return resultRecord;
    }

    @Override
    public boolean isValid(GenericRecord record) {
        return true;
    }
}
