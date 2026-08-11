/*
 * Copyright 2024 EPAM Systems, Inc
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

import com.epam.deltix.qsrv.hf.pub.md.json.DataTypeDef;
import com.epam.deltix.qsrv.hf.pub.md.json.SchemaDef;
import com.epam.deltix.tbwg.webapp.model.input.QueryRequest;
import com.epam.deltix.tbwg.webapp.model.schema.*;
import com.epam.deltix.tbwg.webapp.model.schema.changes.StreamMetaDataChangeDef;
import com.epam.deltix.tbwg.webapp.services.timebase.exc.InvalidSchemaChangeException;
import com.epam.deltix.tbwg.webapp.services.timebase.exc.UnknownStreamException;
import com.epam.deltix.tbwg.webapp.services.timebase.exc.WriteOperationsException;

import com.epam.deltix.tbwg.webapp.services.timebase.TimebaseService;

import javax.annotation.Nonnull;

public interface SchemaManipulationService {

    DataTypeDef[] allTypes();

    SchemaDef describe(QueryRequest queryRequest, boolean tree);
    SchemaDef describe(TimebaseService svc, QueryRequest queryRequest, boolean tree);

    DescribeResponse describeStream(String key) throws UnknownStreamException;
    DescribeResponse describeStream(TimebaseService svc, String key) throws UnknownStreamException;

    SchemaDef schema(String key, boolean tree) throws UnknownStreamException;
    SchemaDef schema(TimebaseService svc, String key, boolean tree) throws UnknownStreamException;

    SchemaDef createStream(@Nonnull String key, @Nonnull SchemaDef schemaDef) throws WriteOperationsException;
    SchemaDef createStream(TimebaseService svc, @Nonnull String key, @Nonnull SchemaDef schemaDef) throws WriteOperationsException;

    StreamMetaDataChangeDef schemaChanges(@Nonnull String key, @Nonnull SchemaChangesRequest schemaChangesRequest)
            throws UnknownStreamException;
    StreamMetaDataChangeDef schemaChanges(TimebaseService svc, @Nonnull String key, @Nonnull SchemaChangesRequest schemaChangesRequest)
            throws UnknownStreamException;

    SchemaDef changeSchema(@Nonnull String key, @Nonnull ChangeSchemaRequest changeSchemaRequest)
            throws UnknownStreamException, WriteOperationsException, InvalidSchemaChangeException;
    SchemaDef changeSchema(TimebaseService svc, @Nonnull String key, @Nonnull ChangeSchemaRequest changeSchemaRequest)
            throws UnknownStreamException, WriteOperationsException, InvalidSchemaChangeException;

    SchemaDef getSchema(String key);
}