/*
 * Copyright 2023 EPAM Systems, Inc
 *
 * See the NOTICE file distributed with this work for additional information
 * regarding copyright ownership. Licensed under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */
package com.epam.deltix.tbwg.webapp.services.timebase.base;

import com.epam.deltix.tbwg.webapp.model.input.QueryRequest;
import com.epam.deltix.tbwg.webapp.model.schema.*;
import com.epam.deltix.tbwg.webapp.model.schema.changes.StreamMetaDataChangeDef;
import com.epam.deltix.tbwg.webapp.services.timebase.exc.InvalidSchemaChangeException;
import com.epam.deltix.tbwg.webapp.services.timebase.exc.UnknownStreamException;
import com.epam.deltix.tbwg.webapp.services.timebase.exc.WriteOperationsException;

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
    SchemaDef describe(QueryRequest queryRequest, boolean tree);

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

    /**
     * Returns schema for the specified message type.
     *
     * @param key                message type key
     * @return schema for message type
     */
    SchemaDef getSchema(String key);
}
