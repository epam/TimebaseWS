package com.epam.deltix.tbwg.services.timebase;

import com.epam.deltix.gflog.api.Log;
import com.epam.deltix.gflog.api.LogFactory;
import com.epam.deltix.qsrv.hf.pub.codec.RecordLayout;
import com.epam.deltix.qsrv.hf.pub.md.*;
import com.epam.deltix.qsrv.hf.tickdb.pub.*;
import com.epam.deltix.qsrv.hf.tickdb.pub.task.SchemaChangeTask;
import com.epam.deltix.qsrv.hf.tickdb.schema.MetaDataChange;
import com.epam.deltix.qsrv.hf.tickdb.schema.SchemaAnalyzer;
import com.epam.deltix.qsrv.hf.tickdb.schema.StreamMetaDataChange;
import com.epam.deltix.tbwg.model.schema.*;
import com.epam.deltix.tbwg.services.timebase.base.SchemaManipulationService;
import com.epam.deltix.tbwg.model.input.QueryRequest;
import com.epam.deltix.tbwg.model.schema.changes.StreamMetaDataChangeDef;
import com.epam.deltix.tbwg.services.timebase.exc.InvalidSchemaChangeException;
import com.epam.deltix.tbwg.services.timebase.exc.TimebaseExceptions;
import com.epam.deltix.tbwg.services.timebase.exc.UnknownStreamException;
import com.epam.deltix.tbwg.services.timebase.exc.WriteOperationsException;
import com.epam.deltix.tbwg.utils.ColumnsManager;
import org.jetbrains.annotations.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static com.epam.deltix.tbwg.model.schema.SchemaBuilder.toSimple;
import static com.epam.deltix.tbwg.model.schema.SchemaBuilder.toTypeDef;
import static com.epam.deltix.tbwg.model.schema.SchemaUtils.toSchemaMapping;

@Component
public class SchemaManipulationServiceImpl implements SchemaManipulationService {

    private static final Pattern PATTERN = Pattern.compile("[Ss][Ee][Ll][Ee][Cc][Tt]\\W+\\*\\W+[Ff][Rr][Oo][Mm]\\W+\"?(?<stream>\\w+)\"?.*");

    private static final Log LOG = LogFactory.getLog(SchemaManipulationService.class);

    private final TimebaseServiceImpl service;
    private final ThreadLocal<Matcher> matcher = ThreadLocal.withInitial(() -> PATTERN.matcher(""));

    @Autowired
    public SchemaManipulationServiceImpl(TimebaseServiceImpl service) {
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
    public SchemaDef describe(QueryRequest select) {
        SelectionOptions options = select.getSelectionOptions();

        LOG.info().append("DESCRIBE QUERY (").append(select.query).append(")").commit();

        ClassSet metaData = service.describeQuery(select.query, options);

        ClassDescriptor[] top = metaData.getContentClasses();
        ClassDescriptor[] classes = metaData.getClasses();

        SchemaDef schema = new SchemaDef();

        schema.types = new TypeDef[top.length];
        for (int i = 0; i < schema.types.length; i++) {

            RecordClassDescriptor rcd = (RecordClassDescriptor) top[i];
            List<FieldDef> fields = new ArrayList<FieldDef>();

            RecordLayout layout = new RecordLayout(rcd);
            toSimple(layout.getNonStaticFields(), fields);
            toSimple(layout.getStaticFields(), fields);

            schema.types[i] = new TypeDef(rcd.getName(), rcd.getTitle(), fields.toArray(new FieldDef[fields.size()]));
            schema.types[i].setAbstract(rcd.isAbstract());
            ColumnsManager.applyDefaults(schema.types[i]);
        }

        schema.all = new TypeDef[classes.length];
        for (int i = 0; i < classes.length; i++) {

            List<FieldDef> fields = new ArrayList<FieldDef>();

            ClassDescriptor descriptor = classes[i];

            if (descriptor instanceof RecordClassDescriptor) {
                RecordLayout layout = new RecordLayout((RecordClassDescriptor) descriptor);
                toSimple(layout.getNonStaticFields(), fields);
                toSimple(layout.getStaticFields(), fields);
            } else if (descriptor instanceof EnumClassDescriptor) {
                EnumValue[] values = ((EnumClassDescriptor) descriptor).getValues();

                for (EnumValue v : values)
                    fields.add(FieldDef.createNonStatic(v.symbol, v.symbol, new DataTypeDef("ENUM", null, false)));
            }

            schema.all[i] = new TypeDef(descriptor.getName(), descriptor.getTitle(), fields.toArray(new FieldDef[fields.size()]));
            schema.all[i].setEnum(descriptor instanceof EnumClassDescriptor);
            schema.all[i].setAbstract(descriptor instanceof RecordClassDescriptor && ((RecordClassDescriptor) descriptor).isAbstract());

            ColumnsManager.applyDefaults(schema.all[i]);
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

    private DXTickStream getStream(String key) throws UnknownStreamException {
        DXTickStream stream = service.getStream(key);

        if (stream == null)
            throw new UnknownStreamException(key);

        return stream;
    }
}
