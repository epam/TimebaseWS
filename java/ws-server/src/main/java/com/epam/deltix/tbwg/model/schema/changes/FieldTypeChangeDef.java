package com.epam.deltix.tbwg.model.schema.changes;

import com.epam.deltix.qsrv.hf.tickdb.schema.FieldTypeChange;

public class FieldTypeChangeDef extends FieldChangeWrapperWithDefault<FieldTypeChange> {

    public FieldTypeChangeDef(FieldTypeChange fieldChange) {
        super(fieldChange);
    }

    @Override
    public boolean isDefaultValueRequired() {
        return fieldChange.isDefaultValueRequired();
    }

    @Override
    public String getDefaultValue() {
        return fieldChange.getDefaultValue();
    }


}
