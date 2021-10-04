package com.epam.deltix.grafana.stats;

import com.epam.deltix.computations.base.exc.RecordValidationException;
import com.epam.deltix.computations.data.MutableGenericRecordImpl;
import com.epam.deltix.computations.data.base.GenericRecord;
import com.epam.deltix.computations.data.numeric.MutableDoubleValue;
import com.epam.deltix.grafana.base.Aggregation;
import com.epam.deltix.grafana.basicmath.Sum;
import com.epam.deltix.grafana.model.fields.Field;
import org.junit.Test;

import java.util.Arrays;
import java.util.List;

public class TimeSMATest {

    @Test
    public void test() throws RecordValidationException {
        long start = System.currentTimeMillis();
        long end = start + 1000 * 20;
        Aggregation sum = new Sum("sma_result", 1000, "result", start, end);
        Aggregation smaCount = new CountSMA("sample", 3, "sma_result");
        Aggregation aggregation = smaCount.andThen(sum);
        List<GenericRecord> records = Arrays.asList(
                MutableGenericRecordImpl.builder()
                        .setTimestamp(start)
                        .set("sample", MutableDoubleValue.of(12.46532)).build(),
                MutableGenericRecordImpl.builder()
                        .setTimestamp(start + 100)
                        .set("sample", MutableDoubleValue.of(43.524)).build(),
                MutableGenericRecordImpl.builder()
                        .setTimestamp(start + 300)
                        .set("sample", MutableDoubleValue.of(12.346)).build(),
                MutableGenericRecordImpl.builder()
                        .setTimestamp(start + 1000)
                        .set("sample", MutableDoubleValue.of(12.28)).build(),
                MutableGenericRecordImpl.builder()
                        .setTimestamp(start + 1300)
                        .set("sample", MutableDoubleValue.of(13.3255)).build(),
                MutableGenericRecordImpl.builder()
                        .setTimestamp(start + 1500)
                        .set("sample", MutableDoubleValue.of(45.32652)).build(),
                MutableGenericRecordImpl.builder()
                        .setTimestamp(start + 2100)
                        .set("sample", MutableDoubleValue.of(12.346)).build()
        );
        for (GenericRecord record : records) {
            if (aggregation.add(record)) {
                for (Field field : aggregation.fields()) {
                    GenericRecord result = aggregation.record();
                    System.out.printf("%d: %f\n", result.timestamp(), result.getValue(field.name()).doubleValue());
                }
            }
        }
        GenericRecord record = aggregation.calculateLast();
        if (record != null) {
            for (Field field : aggregation.fields()) {
                System.out.printf("%d: %f\n", record.timestamp(), record.getValue(field.name()).doubleValue());
            }
        }
    }

}
