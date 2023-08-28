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

package com.epam.deltix.tbwg.webapp.services.timebase;

import com.epam.deltix.gflog.api.Log;
import com.epam.deltix.gflog.api.LogFactory;
import com.epam.deltix.qsrv.hf.pub.md.*;
import com.epam.deltix.qsrv.hf.tickdb.pub.*;
import com.epam.deltix.qsrv.hf.tickdb.pub.task.SchemaChangeTask;
import com.epam.deltix.qsrv.hf.tickdb.schema.MetaDataChange;
import com.epam.deltix.qsrv.hf.tickdb.schema.SchemaAnalyzer;
import com.epam.deltix.qsrv.hf.tickdb.schema.StreamMetaDataChange;
import com.epam.deltix.tbwg.webapp.model.input.QueryRequest;
import com.epam.deltix.tbwg.webapp.model.schema.*;
import com.epam.deltix.tbwg.webapp.model.schema.changes.StreamMetaDataChangeDef;
import com.epam.deltix.tbwg.webapp.services.timebase.base.SchemaManipulationService;
import com.epam.deltix.tbwg.webapp.services.timebase.exc.InvalidSchemaChangeException;
import com.epam.deltix.tbwg.webapp.services.timebase.exc.TimebaseExceptions;
import com.epam.deltix.tbwg.webapp.services.timebase.exc.UnknownStreamException;
import com.epam.deltix.tbwg.webapp.services.timebase.exc.WriteOperationsException;
import com.epam.deltix.tbwg.webapp.utils.ColumnsManager;
import org.jetbrains.annotations.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static com.epam.deltix.tbwg.webapp.model.schema.SchemaBuilder.toTypeDef;
import static com.epam.deltix.tbwg.webapp.model.schema.SchemaUtils.toSchemaMapping;

@Component
public class SchemaManipulationServiceImpl implements SchemaManipulationService {

    private static final Pattern PATTERN = Pattern.compile("[Ss][Ee][Ll][Ee][Cc][Tt]\\W+\\*\\W+[Ff][Rr][Oo][Mm]\\W+\"?(?<stream>\\w+)\"?.*");

    private static final Log LOG = LogFactory.getLog(SchemaManipulationService.class);

    private final TimebaseService service;
    private final ThreadLocal<Matcher> matcher = ThreadLocal.withInitial(() -> PATTERN.matcher(""));

    @Autowired
    public SchemaManipulationServiceImpl(TimebaseService service) {
        this.service = service;
    }

    @Override
    public DataTypeDef[] allTypes() {
        DataType[] allTypes = SchemaBuilder.ALL_TYPES;

        DataTypeDef[] types = new DataTypeDef[allTypes.length];

        for (int i = 0; i < allTypes.length; i++) {
            DataType type = allTypes[i];
            types[i] = new DataTypeDef(type.getBaseName(), type.getEncoding(), true);
        }
        return types;
    }

    @Override
    public SchemaDef describe(QueryRequest select, boolean tree) {
        SelectionOptions options = select.getSelectionOptions();

        LOG.info().append("DESCRIBE QUERY (").append(select.query).append(")").commit();

        DXTickDB connection = service.getConnection();

        ClassSet metaData = connection.describeQuery(select.query, options);

        ClassDescriptor[] top = metaData.getContentClasses();
        ClassDescriptor[] classes = metaData.getClasses();

        SchemaDef schema = new SchemaDef();
        schema.types = new TypeDef[top.length];

        for (int i = 0; i < schema.types.length; i++) {
            TypeDef def = schema.types[i] = toTypeDef(top[i], !tree);
            ColumnsManager.applyDefaults(def);
        }

        schema.all = new TypeDef[classes.length];
        for (int i = 0; i < classes.length; i++) {
            TypeDef def = schema.all[i] = toTypeDef(classes[i], !tree);
            ColumnsManager.applyDefaults(def);
        }

        return schema;
    }

    @Override
    public DescribeResponse describeStream(String key) throws UnknownStreamException {
        return DescribeResponse.create(getStream(key));
    }

    @Override
    public SchemaDef schema(String key, boolean tree) throws UnknownStreamException {
        DXTickStream stream = getStream(key);

        RecordClassSet metaData = stream.getStreamOptions().getMetaData();

        RecordClassDescriptor[] top = metaData.getContentClasses();
        ClassDescriptor[] classes = metaData.getClasses();

        SchemaDef schema = new SchemaDef();

        schema.types = new TypeDef[top.length];
        for (int i = 0; i < schema.types.length; i++) {
            schema.types[i] = toTypeDef(top[i], !tree);
            ColumnsManager.applyDefaults(schema.types[i]);
        }

        schema.all = new TypeDef[classes.length];
        for (int i = 0; i < classes.length; i++) {
            schema.all[i] = toTypeDef(classes[i], !tree);
            ColumnsManager.applyDefaults(schema.all[i]);
        }

        return schema;
    }

    @Override
    public SchemaDef createStream(@NotNull String key, @NotNull SchemaDef schemaDef, int distributionFactor) throws WriteOperationsException {
        if (service.isReadonly()) {
            throw TimebaseExceptions.createStreamForbidden();
        }

        RecordClassSet set = SchemaBuilder.toClassSet(schemaDef);
        StreamOptions options = new StreamOptions(StreamScope.DURABLE, key, null, distributionFactor);
        options.setMetaData(true, set);

        LOG.info().append("CREATE STREAM (").append(key).append(")").commit();

        DXTickStream stream = service.getConnection().createStream(key, options);
        return SchemaBuilder.toSchemaDef(stream.getStreamOptions().getMetaData(), false);
    }

    @Override
    public StreamMetaDataChangeDef schemaChanges(@NotNull String key, @NotNull SchemaChangesRequest schemaChangesRequest)
            throws UnknownStreamException {
        DXTickStream stream = getStream(key);
        RecordClassSet source = stream.getStreamOptions().getMetaData();
        RecordClassSet target = SchemaBuilder.toClassSet(schemaChangesRequest.getSchema());
        SchemaAnalyzer schemaAnalyzer = new SchemaAnalyzer(toSchemaMapping(schemaChangesRequest.getSchemaMapping(),
                source, target));
        StreamMetaDataChange streamMetaDataChange = schemaAnalyzer.getChanges(
                source, stream.isFixedType() ? MetaDataChange.ContentType.Fixed : MetaDataChange.ContentType.Polymorphic,
                target, target.getContentClasses().length == 1 ? MetaDataChange.ContentType.Fixed : MetaDataChange.ContentType.Polymorphic
        );

        return new StreamMetaDataChangeDef(streamMetaDataChange);
    }

    @Override
    public SchemaDef changeSchema(@NotNull String key, @NotNull ChangeSchemaRequest changeSchemaRequest)
            throws UnknownStreamException, WriteOperationsException, InvalidSchemaChangeException {
        if (service.isReadonly()) {
            throw TimebaseExceptions.schemaChangeForbidden();
        }

        DXTickStream stream = getStream(key);
        RecordClassSet source = stream.getStreamOptions().getMetaData();
        RecordClassSet target = SchemaBuilder.toClassSet(changeSchemaRequest.getSchema());
        SchemaAnalyzer schemaAnalyzer = new SchemaAnalyzer(toSchemaMapping(changeSchemaRequest.getSchemaMapping(),
                source, target));
        StreamMetaDataChange streamMetaDataChange = schemaAnalyzer.getChanges(
                source, stream.isFixedType() ? MetaDataChange.ContentType.Fixed : MetaDataChange.ContentType.Polymorphic,
                target, target.getContentClasses().length == 1 ? MetaDataChange.ContentType.Fixed : MetaDataChange.ContentType.Polymorphic
        );
        SchemaUtils.setDefaults(streamMetaDataChange, changeSchemaRequest.getDefaultValues());
        SchemaUtils.setDrop(streamMetaDataChange, changeSchemaRequest.getDropValues());

        String errorField = SchemaUtils.hasErrors(streamMetaDataChange);
        if (errorField != null) {
            throw new InvalidSchemaChangeException(errorField);
        }

        SchemaChangeTask task = new SchemaChangeTask(streamMetaDataChange);
        task.setBackground(changeSchemaRequest.isBackground());
        stream.execute(task);

        return SchemaBuilder.toSchemaDef(stream.getStreamOptions().getMetaData(), false);
    }

    @Override
    public SchemaDef getSchema(String key) {
        StandardMessageTypes standardMessageTypes;
        try {
            standardMessageTypes = StandardMessageTypes.valueOf(key);
        } catch (IllegalArgumentException e) {
            String message = "Can't generate schema for " + key;
            LOG.error().append(message).commit();
            throw new IllegalArgumentException(message);
        }
        String[] classNames = standardMessageTypes.getClassNames();
        try {
            return SchemaBuilder.getSchemaDef(classNames);
        } catch (ClassNotFoundException | Introspector.IntrospectionException e) {
            LOG.error().append("Failed to generate schema for ").append(key).append("\nReason: ").append(e).commit();
            throw new RuntimeException("Can't generate schema for " + key);
        }
    }

    private DXTickStream getStream(String key) throws UnknownStreamException {
        DXTickStream stream = service.getStream(key);

        if (stream == null)
            throw new UnknownStreamException(key);

        return stream;
    }
}
