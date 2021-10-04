package com.epam.deltix.tbwg.model.schema.changes;

import com.epam.deltix.tbwg.model.schema.SchemaBuilder;
import com.epam.deltix.tbwg.model.schema.SchemaUtils;
import com.epam.deltix.tbwg.model.schema.TypeDef;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.epam.deltix.qsrv.hf.tickdb.schema.ClassDescriptorChange;
import com.epam.deltix.qsrv.hf.tickdb.schema.SchemaChange;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

public class ClassDescriptorChangeDef implements SchemaChangeDef {

    @JsonIgnore
    private final ClassDescriptorChange classDescriptorChange;

    public ClassDescriptorChangeDef(ClassDescriptorChange classDescriptorChange) {
        this.classDescriptorChange = classDescriptorChange;
    }

    @JsonProperty("source")
    public TypeDef getSource() {
        return SchemaBuilder.toTypeDef(classDescriptorChange.getSource(), false);
    }

    @JsonProperty("target")
    public TypeDef getTarget() {
        return SchemaBuilder.toTypeDef(classDescriptorChange.getTarget(), false);
    }

    @JsonProperty("fieldChanges")
    public List<FieldChangeWrapper> getFieldChanges() {
        return Arrays.stream(classDescriptorChange.getChanges())
                .filter(fieldChange -> fieldChange.getChangeImpact() != SchemaChange.Impact.None)
                .map(SchemaUtils::fieldChange)
                .collect(Collectors.toList());
    }

    @Override
    public SchemaChange.Impact getChangeImpact() {
        return classDescriptorChange.getChangeImpact();
    }
}
