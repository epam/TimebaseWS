/*
 * Copyright 2021 EPAM Systems, Inc
 *
 * See the NOTICE file distributed with this work for additional information
 * regarding copyright ownership. Licensed under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */
package com.epam.deltix.grafana;

import com.epam.deltix.containers.ObjHashSet;
import com.epam.deltix.computations.base.exc.RecordValidationException;
import com.epam.deltix.computations.data.MutableGenericRecordImpl;
import com.epam.deltix.computations.data.MutableGenericValueFactory;
import com.epam.deltix.computations.data.base.GenericRecord;
import com.epam.deltix.computations.data.base.MutableGenericRecord;
import com.epam.deltix.grafana.base.Aggregation;
import com.epam.deltix.grafana.model.fields.Field;

import java.util.Collection;
import java.util.stream.Collectors;

/**
 * Aggregation, that joins collection of aggregation and produces one solid table.
 */
public class JoiningAggregation implements Aggregation {

    private final Collection<Aggregation> aggregations;
    private final ObjHashSet<Aggregation> ready = new ObjHashSet<>();

    private final MutableGenericRecord record = new MutableGenericRecordImpl();
    private final MutableGenericValueFactory factory = new MutableGenericValueFactory();

    public JoiningAggregation(Collection<Aggregation> aggregations) {
        this.aggregations = aggregations;
    }

    @Override
    public Collection<Field> fields() {
        return aggregations.stream().flatMap(aggregation -> aggregation.fields().stream()).collect(Collectors.toList());
    }

    @Override
    public boolean add(GenericRecord record) throws RecordValidationException {
        ready.clear();
        for (Aggregation aggregation : aggregations) {
            if (aggregation.add(record)) {
                ready.put(aggregation);
            }
        }
        return !ready.isEmpty();
    }

    @Override
    public GenericRecord record(long timestamp) {
        record.reuse();
        factory.reuse();
        boolean first = true;
        for (Aggregation aggregation : aggregations) {
            if (ready.containsKey(aggregation)) {
                GenericRecord r = aggregation.record(timestamp);
                if (first) {
                    first = false;
                    record.setTimestamp(r.timestamp());
                }
                factory.copyContent(r, record);
            }
        }
        return record;
    }

    @Override
    public boolean isValid(GenericRecord record) {
        for (Aggregation aggregation : aggregations) {
            if (!aggregation.isValid(record)) {
                return false;
            }
        }
        return true;
    }

    @Override
    public GenericRecord calculateLast() {
        record.reuse();
        factory.reuse();
        boolean first = true;
        for (Aggregation aggregation : aggregations) {
            GenericRecord r = aggregation.calculateLast();
            if (r != null) {
                if (first) {
                    first = false;
                    record.setTimestamp(r.timestamp());
                }
                factory.copyContent(r, record);
            }
        }
        return record;
    }
}
