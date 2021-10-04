package com.epam.deltix.computations.base.exc;

import com.epam.deltix.computations.data.base.GenericRecord;
import com.epam.deltix.computations.base.TimebaseFunction;

public class RecordValidationException extends Exception {

    private final GenericRecord record;
    private final TimebaseFunction timebaseFunction;

    public RecordValidationException(GenericRecord record, TimebaseFunction timebaseFunction) {
        this.record = record;
        this.timebaseFunction = timebaseFunction;
    }

    @Override
    public String getMessage() {
        return "Record " + record + " is not valid for function " + timebaseFunction;
    }
}
