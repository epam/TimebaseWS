package com.epam.deltix.tbwg.model.schema;

public class SchemaChangesRequest {

    private SchemaDef schema;

    private SchemaMappingDef schemaMapping;

    public SchemaDef getSchema() {
        return schema;
    }

    public void setSchema(SchemaDef schema) {
        this.schema = schema;
    }

    public SchemaMappingDef getSchemaMapping() {
        return schemaMapping;
    }

    public void setSchemaMapping(SchemaMappingDef schemaMapping) {
        this.schemaMapping = schemaMapping;
    }
}
