package com.epam.deltix.tbwg.model.schema.changes;

import com.epam.deltix.qsrv.hf.pub.md.StaticDataField;
import com.epam.deltix.qsrv.hf.tickdb.schema.FieldModifierChange;

public class FieldModifierChangeDef extends FieldChangeWrapperWithDefault<FieldModifierChange> {

    public FieldModifierChangeDef(FieldModifierChange fieldChange) {
        super(fieldChange);
    }

    @Override
    public boolean isDefaultValueRequired() {
        return fieldChange.hasErrors();
    }

    @Override
    public String getDefaultValue() {
        return fieldChange.getInitialValue();
    }

    @Override
    public String getStatus() {
        return (fieldChange.getSource() instanceof StaticDataField) ?
                String.format("Field '%s' changed from 'static' to 'non-static'.", fieldChange.getTarget().toString()):
                String.format("Field '%s' changed from 'non-static' to 'static'.", fieldChange.getTarget().toString());
    }
}
