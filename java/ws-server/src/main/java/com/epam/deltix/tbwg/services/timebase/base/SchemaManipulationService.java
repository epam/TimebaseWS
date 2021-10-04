package com.epam.deltix.tbwg.services.timebase.base;

import com.epam.deltix.tbwg.model.input.QueryRequest;
import com.epam.deltix.tbwg.model.schema.*;
import com.epam.deltix.tbwg.model.schema.changes.StreamMetaDataChangeDef;
import com.epam.deltix.tbwg.services.timebase.exc.InvalidSchemaChangeException;
import com.epam.deltix.tbwg.services.timebase.exc.UnknownStreamException;
import com.epam.deltix.tbwg.services.timebase.exc.WriteOperationsException;

import javax.annotation.Nonnull;

public interface SchemaManipulationService {

    /**
     * List all data types
     * @return all types array
     */
    DataTypeDef[] allTypes();

    /**
     * Describe query
     * @param queryRequest query request
     * @return schema, that describes request
     */
    SchemaDef describe(QueryRequest queryRequest);

    /**
     * Stream DDL description.
     * @param key stream key
     * @return object that contains DDL description.
     * @throws UnknownStreamException if stream does not exist
     */
    DescribeResponse describeStream(String key) throws UnknownStreamException;

    /**
     * Get stream schema
     * @param key stream key
     * @return stream schema
     * @throws UnknownStreamException if stream does not exist
     */
    SchemaDef schema(String key, boolean tree) throws UnknownStreamException;

    /**
     * Create stream with provided key, schema and distribution factor.
     * @param key stream key
     * @param schemaDef stream schema
     * @param distributionFactor stream distribution factor
     * @return new stream schema
     * @throws WriteOperationsException if user isn't allowed to create streams
     */
    SchemaDef createStream(@Nonnull String key, @Nonnull SchemaDef schemaDef, int distributionFactor)
            throws WriteOperationsException;

    /**
     * List changes between current stream schema and provided by user.
     * @param key stream key
     * @param schemaChangesRequest new schema and schema mapping
     * @return changes
     * @throws UnknownStreamException if stream does not exist
     */
    StreamMetaDataChangeDef schemaChanges(@Nonnull String key, @Nonnull SchemaChangesRequest schemaChangesRequest)
            throws UnknownStreamException;

    /**
     * Execute schema change.
     * @param key stream key
     * @param changeSchemaRequest new stream schema, schema mapping and default values
     * @return new stream schema
     * @throws UnknownStreamException if stream does not exist
     * @throws WriteOperationsException if timebase is readonly
     * @throws InvalidSchemaChangeException if some of default values are missing
     */
    SchemaDef changeSchema(@Nonnull String key, @Nonnull ChangeSchemaRequest changeSchemaRequest)
            throws UnknownStreamException, WriteOperationsException, InvalidSchemaChangeException;

}
