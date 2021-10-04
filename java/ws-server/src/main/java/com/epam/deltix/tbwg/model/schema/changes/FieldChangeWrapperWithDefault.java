package com.epam.deltix.tbwg.model.schema.changes;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.epam.deltix.qsrv.hf.tickdb.schema.AbstractFieldChange;

public abstract class FieldChangeWrapperWithDefault<T extends AbstractFieldChange> extends FieldChangeWrapper<T> {

    public FieldChangeWrapperWithDefault(T fieldChange) {
        super(fieldChange);
    }

    @JsonProperty("defaultValueRequired")
    public abstract boolean isDefaultValueRequired();

    @JsonProperty("defaultValue")
    public abstract String getDefaultValue();

}
