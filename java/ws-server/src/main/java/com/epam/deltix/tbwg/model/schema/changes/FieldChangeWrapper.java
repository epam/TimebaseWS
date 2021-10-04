package com.epam.deltix.tbwg.model.schema.changes;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.epam.deltix.qsrv.hf.tickdb.schema.AbstractFieldChange;
import com.epam.deltix.qsrv.hf.tickdb.schema.SchemaChange;
import com.epam.deltix.tbwg.model.schema.FieldDef;
import com.epam.deltix.tbwg.model.schema.SchemaUtils;

public class FieldChangeWrapper<T extends AbstractFieldChange> implements SchemaChangeDef {

    @JsonIgnore
    protected final T fieldChange;

    public FieldChangeWrapper(T fieldChange) {
        this.fieldChange = fieldChange;
    }

    @JsonProperty("source")
    public FieldDef getSource() {
        return SchemaUtils.fieldDef(fieldChange.getSource());
    }

    @JsonProperty("target")
    public FieldDef getTarget() {
        return SchemaUtils.fieldDef(fieldChange.getTarget());
    }

    @JsonProperty("hasErrors")
    public boolean hasErrors() {
        return fieldChange.hasErrors();
    }

    @JsonProperty("typeName")
    public String getType() {
        return fieldChange.getClass().getSimpleName();
    }

    @JsonProperty("status")
    public String getStatus() {
        return fieldChange.toString();
    }

    @Override
    public SchemaChange.Impact getChangeImpact() {
        return fieldChange.getChangeImpact();
    }
}
