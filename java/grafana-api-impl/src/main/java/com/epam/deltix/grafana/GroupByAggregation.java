package com.epam.deltix.grafana;

import com.epam.deltix.grafana.model.fields.Field;
import com.epam.deltix.computations.base.exc.RecordValidationException;
import com.epam.deltix.computations.data.base.GenericRecord;
import com.epam.deltix.computations.data.base.MutableGenericRecord;
import com.epam.deltix.grafana.base.Aggregation;

import java.util.Collection;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Aggregations, that performs grouping by {@link GenericRecord#recordKey()}.
 */
public class GroupByAggregation implements Aggregation {

    private final Map<String, Aggregation> delegates = new HashMap<>();
    private final Function<GenericRecord, Aggregation> aggregationCreator;
    private Aggregation current = null;
    private String currentKey = null;

    public GroupByAggregation(Function<GenericRecord, Aggregation> aggregationCreator) {
        this.aggregationCreator = aggregationCreator;
    }

    @Override
    public boolean add(GenericRecord record) throws RecordValidationException {
        current = delegates.get(record.recordKey());
        currentKey = record.recordKey();
        if (current == null) {
            current = aggregationCreator.apply(record);
            delegates.put(record.recordKey(), current);
        }
        return current.add(record);
    }

    @Override
    public Collection<Field> fields() {
        return delegates.values().stream().flatMap(aggregation -> aggregation.fields().stream()).collect(Collectors.toList());
    }

    @Override
    public GenericRecord record(long timestamp) {
        if (current == null)
            return null;

        GenericRecord record = current.record(timestamp);
        if (record != null) {
            ((MutableGenericRecord) record).setRecordKey(currentKey);
        }
        return record;
    }

    @Override
    public boolean isValid(GenericRecord record) {
        return true;
    }

    public Map<String, GenericRecord> calculateLastRecords() {
        Map<String, GenericRecord> result = new HashMap<>();
        delegates.forEach((key, aggregation) -> result.put(key, aggregation.calculateLast()));
        return result;
    }

    public static GroupByAggregation composition(Aggregation aggregation, GroupByAggregation groupBy) {
        return new GroupByAggregation(key -> aggregation.andThen(groupBy.aggregationCreator.apply(key)));
    }
}
