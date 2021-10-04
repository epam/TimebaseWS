package com.epam.deltix.tbwg.model.schema.changes;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.epam.deltix.qsrv.hf.tickdb.schema.MetaDataChange;
import com.epam.deltix.qsrv.hf.tickdb.schema.SchemaChange;
import com.epam.deltix.qsrv.hf.tickdb.schema.StreamMetaDataChange;
import com.epam.deltix.tbwg.model.schema.SchemaMappingDef;
import com.epam.deltix.tbwg.model.schema.SchemaUtils;

import java.util.List;
import java.util.stream.Collectors;

public class StreamMetaDataChangeDef implements SchemaChangeDef {

    @JsonIgnore
    private final StreamMetaDataChange streamMetaDataChange;

    public StreamMetaDataChangeDef(StreamMetaDataChange streamMetaDataChange) {
        this.streamMetaDataChange = streamMetaDataChange;
    }

    @Override
    public SchemaChange.Impact getChangeImpact() {
        return streamMetaDataChange.getChangeImpact();
    }

    @JsonProperty("sourceType")
    public MetaDataChange.ContentType getSourceType() {
        return streamMetaDataChange.sourceType;
    }

    @JsonProperty("targetType")
    public MetaDataChange.ContentType getTargetType() {
        return streamMetaDataChange.targetType;
    }

    @JsonProperty("schemaMapping")
    public SchemaMappingDef getSchemaMapping() {
        return SchemaUtils.fromSchemaMapping(streamMetaDataChange.mapping, streamMetaDataChange.getSource(), streamMetaDataChange.getMetaData());
    }

    @JsonProperty("changes")
    public List<ClassDescriptorChangeDef> getChanges() {
        return streamMetaDataChange.changes.stream().map(ClassDescriptorChangeDef::new).collect(Collectors.toList());
    }

}
