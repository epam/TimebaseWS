package com.epam.deltix.tbwg.model.schema.changes;

import com.epam.deltix.qsrv.hf.tickdb.schema.CreateFieldChange;
import com.epam.deltix.qsrv.hf.tickdb.schema.SchemaChange;

public class CreateFieldChangeDef extends FieldChangeWrapperWithDefault<CreateFieldChange> {

    public CreateFieldChangeDef(CreateFieldChange fieldChange) {
        super(fieldChange);
    }

    @Override
    public boolean isDefaultValueRequired() {
        return fieldChange.getChangeImpact() == SchemaChange.Impact.DataConvert && fieldChange.getInitialValue() == null;
    }

    @Override
    public String getDefaultValue() {
        return fieldChange.getInitialValue();
    }

    @Override
    public String getStatus() {
        return String.format("Created field %s of type %s", fieldChange.getTarget(), fieldChange.getTarget().getType().getBaseName());
    }
}
