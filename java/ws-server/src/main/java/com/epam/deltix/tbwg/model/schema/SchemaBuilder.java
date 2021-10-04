package com.epam.deltix.tbwg.model.schema;

import com.epam.deltix.qsrv.hf.pub.codec.DataFieldInfo;
import com.epam.deltix.qsrv.hf.pub.codec.RecordLayout;
import com.epam.deltix.qsrv.hf.pub.codec.StaticFieldInfo;
import com.epam.deltix.qsrv.hf.pub.md.*;
import org.agrona.collections.Object2ObjectHashMap;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

import static com.epam.deltix.qsrv.hf.pub.md.DataType.*;

/**
 * Created by Alex Karpovich on 26/11/2020.
 */
public class SchemaBuilder {

    protected SchemaDef schema;
    protected RecordClassSet set;

    protected final Object2ObjectHashMap<String, RecordClassDescriptor> cache = new Object2ObjectHashMap<>();

    public final static DataType[] ALL_TYPES = new DataType[]{
            new BooleanDataType(true),
            new CharDataType(true),
            new VarcharDataType(VarcharDataType.ENCODING_INLINE_VARSIZE, true, true),
            new VarcharDataType(VarcharDataType.ENCODING_ALPHANUMERIC + "(10)", true, true),
            BinaryDataType.getDefaultInstance(),
            new TimeOfDayDataType(true),
            new DateTimeDataType(true),

            new FloatDataType(FloatDataType.ENCODING_FIXED_FLOAT, true),
            new FloatDataType(FloatDataType.ENCODING_FIXED_DOUBLE, true),
            new FloatDataType(FloatDataType.ENCODING_SCALE_AUTO, true),
            new FloatDataType(FloatDataType.ENCODING_DECIMAL64, true),

            new IntegerDataType(IntegerDataType.ENCODING_INT8, true),
            new IntegerDataType(IntegerDataType.ENCODING_INT16, true),
            new IntegerDataType(IntegerDataType.ENCODING_INT32, true),
            new IntegerDataType(IntegerDataType.ENCODING_INT48, true),
            new IntegerDataType(IntegerDataType.ENCODING_INT64, true),

//            new EnumDataType(true, new EnumClassDescriptor("ENUM", "ENUM", "")),
            new ClassDataType(true),
            new ArrayDataType(true, null),
    };

    public SchemaBuilder(SchemaDef schema) {
        this.schema = schema;
        this.set = new RecordClassSet();
    }

    public static RecordClassSet toClassSet(SchemaDef schema) {
        SchemaBuilder builder = new SchemaBuilder(schema);
        builder.build();
        return builder.set;
    }

    public void build() {
        for (int i = 0; i < schema.types.length; i++) {
            set.addContentClasses((RecordClassDescriptor) toDescriptor(schema.types[i]));
        }
    }

    public ClassDescriptor toDescriptor(TypeDef type) {
        // it's critical for recursive reference put descriptor first in record class set

        ClassDescriptor cached = cache.get(type.getName());
        if (cached != null) {
            return cached;
        }

        if (type.isEnum()) {
            EnumClassDescriptor rcd = new EnumClassDescriptor(type.getName(), type.getTitle(), Arrays.stream(type.getFields()).map(FieldDef::getName).toArray(String[]::new));
            cache.put(rcd.getName(), rcd);
            return rcd;
        } else {
            DataField[] fields = new DataField[type.getFields().length];
            RecordClassDescriptor parent = (type.getParent() != null) ? (RecordClassDescriptor) getDescriptor(type.getParent()) : null;

            // cache class descriptor first, then to allow recursive reference
            RecordClassDescriptor rcd = new RecordClassDescriptor(type.getName(), type.getTitle(), type.isAbstract(), parent, fields);
            cache.put(rcd.getName(), rcd);

            // populate fields
            for (int i = 0; i < type.getFields().length; i++)
                fields[i] = toField(type.getFields()[i]);

            return rcd;
        }
    }

    public DataField toField(FieldDef field) {
        DataType type = getType(field.getType());

        return field.isStatic() ?
                new StaticDataField(field.getName(), field.getTitle(), type, field.getValue()) :
                new NonStaticDataField(field.getName(), field.getTitle(), type, null);
    }

    public DataType getType(DataTypeDef typeDef) {

        List<DataType> types = Arrays.stream(ALL_TYPES).filter(t -> t.getBaseName().equals(typeDef.getName())).collect(Collectors.toList());
        if (types.size() == 0) {
            // non-primitive type
            ClassDescriptor rcd = getDescriptor(typeDef.getName());
            if (rcd instanceof EnumClassDescriptor)
                return new EnumDataType(typeDef.isNullable(), (EnumClassDescriptor) rcd);
            else if (rcd instanceof RecordClassDescriptor)
                return new ClassDataType(typeDef.isNullable(), (RecordClassDescriptor) rcd);

            throw new IllegalArgumentException("Unknown type name" + typeDef.getName());
        }

        DataType matched = types.get(0);

        DataType type = null;
        switch (matched.getCode()) {
            case T_BINARY_TYPE:
                type = BinaryDataType.getDefaultInstance();
                break;
            case T_BOOLEAN_TYPE:
                type = new BooleanDataType(typeDef.isNullable());
                break;
            case T_CHAR_TYPE:
                type = new CharDataType(typeDef.isNullable());
                break;
            case T_DATE_TIME_TYPE:
                type = new DateTimeDataType(typeDef.isNullable());
                break;
            case T_FLOAT_TYPE:
                type = new FloatDataType(typeDef.getEncoding(), typeDef.isNullable());
                break;
            case T_INTEGER_TYPE:
                type = new IntegerDataType(typeDef.getEncoding(), typeDef.isNullable());
                break;
            case T_STRING_TYPE:
                type = new VarcharDataType(typeDef.getEncoding(), typeDef.isNullable(), true);
                break;
            case T_TIME_OF_DAY_TYPE:
                type = new TimeOfDayDataType(typeDef.isNullable());
                break;

            case T_OBJECT_TYPE: {
                List<RecordClassDescriptor> subtypes = new ArrayList<RecordClassDescriptor>();

                if (typeDef.getTypes() == null)
                    throw new IllegalStateException("Expected not-nullable types: " + typeDef);

                for (String typeDefType : typeDef.getTypes()) {
                    ClassDescriptor descriptor = getDescriptor(typeDefType);
                    if (descriptor instanceof RecordClassDescriptor)
                        subtypes.add((RecordClassDescriptor) descriptor);
                    else
                        throw new IllegalStateException("Expected RecordClassDescriptor, but found: " + descriptor);
                }

                type = new ClassDataType(typeDef.isNullable(), subtypes.toArray(new RecordClassDescriptor[subtypes.size()]));
                break;
            }
            case T_ARRAY_TYPE: {
                if (typeDef.getElementType() == null)
                    throw new IllegalStateException("Expected not-nullable elementType: " + typeDef);

                type = new ArrayDataType(typeDef.isNullable(), getType(typeDef.getElementType()));
                break;
            }
            case T_ENUM_TYPE: {
                type = new EnumDataType(typeDef.isNullable(), (EnumClassDescriptor) getDescriptor(typeDef.getName()));
                break;
            }

            default:
                throw new IllegalArgumentException("Illegal type: " + matched);
        }

        return type;
    }

    public ClassDescriptor getDescriptor(String name) {
        ClassDescriptor cd = cache.get(name);
        if (cd == null) {
            TypeDef typeDef = schema.find(name);
            if (typeDef != null)
                return toDescriptor(typeDef);
        }

        return cd;
    }

    public static void toSimple(DataFieldInfo[] list, List<FieldDef> fields) {
        if (list != null) {
            for (DataFieldInfo info : list) {
                if (info instanceof StaticFieldInfo)
                    fields.add(FieldDef.createStatic(info.getName(), info.getTitle(), getDataTypeDef(info.getType()), ((StaticFieldInfo) info).getString()));
                else
                    fields.add(FieldDef.createNonStatic(info.getName(), info.getTitle(), getDataTypeDef(info.getType())));
            }
        }
    }

    public static void toSimple(DataField[] list, List<FieldDef> fields) {
        if (list != null) {
            for (DataField info : list) {
                if (info instanceof StaticDataField)
                    fields.add(FieldDef.createStatic(info.getName(), info.getTitle(), getDataTypeDef(info.getType()), ((StaticDataField) info).getStaticValue()));
                else
                    fields.add(FieldDef.createNonStatic(info.getName(), info.getTitle(), getDataTypeDef(info.getType())));
            }
        }
    }

    public static DataTypeDef getDataTypeDef(DataType type) {
        if (type instanceof ClassDataType) {
            ClassDataType cd = (ClassDataType) type;

            DataTypeDef def = new DataTypeDef(type.getBaseName(), null, type.isNullable());
            def.setTypes(Arrays.stream(cd.getDescriptors()).map(NamedDescriptor::getName).collect(Collectors.toList()));
            return def;
        } else if (type instanceof ArrayDataType) {
            DataType dataType = ((ArrayDataType) type).getElementDataType();

            DataTypeDef def = new DataTypeDef(type.getBaseName(), null, type.isNullable());
            def.setElementType(getDataTypeDef(dataType));
            return def;
        }

        return new DataTypeDef(type.getBaseName(), type.getEncoding(), type.isNullable());
    }

    private static DataTypeDef[] toDataTypeDef(RecordClassDescriptor[] rcds, boolean isNullable) {
        DataTypeDef[] types = new DataTypeDef[rcds.length];

        for (int i = 0; i < rcds.length; i++)
            types[i] = new DataTypeDef(rcds[i].getName(), null, isNullable);

        return types;
    }

    public static SchemaDef toSchemaDef(RecordClassSet set, boolean flat) {

        RecordClassDescriptor[] top = set.getContentClasses();
        ClassDescriptor[] classes = set.getClasses();

        SchemaDef schema = new SchemaDef();
        schema.types = new TypeDef[top.length];

        for (int i = 0; i < schema.types.length; i++)
            schema.types[i] = toTypeDef(top[i], flat);

        schema.all = new TypeDef[classes.length];
        for (int i = 0; i < classes.length; i++)
            schema.all[i] = toTypeDef(classes[i], flat);

        return schema;
    }

    public static TypeDef toTypeDef(ClassDescriptor descriptor, boolean flat) {

        if (descriptor == null) {
            return null;
        }

        List<FieldDef> fields = new ArrayList<FieldDef>();
        String parent = null;

        if (descriptor instanceof RecordClassDescriptor) {
            RecordClassDescriptor rcd = (RecordClassDescriptor) descriptor;

            if (flat) {
                RecordLayout layout = new RecordLayout(rcd);
                toSimple(layout.getNonStaticFields(), fields);
                toSimple(layout.getStaticFields(), fields);
            } else {
                toSimple(rcd.getFields(), fields);
                parent = rcd.getParent() != null ? rcd.getParent().getName() : null;
            }

        } else if (descriptor instanceof EnumClassDescriptor) {
            EnumValue[] values = ((EnumClassDescriptor) descriptor).getValues();

            for (EnumValue v : values)
                fields.add(FieldDef.createNonStatic(v.symbol, v.symbol, new DataTypeDef("ENUM", null, false)));
        }

        TypeDef type = new TypeDef(descriptor.getName(), descriptor.getTitle(), fields.toArray(new FieldDef[fields.size()]));
        type.setParent(parent);
        type.setEnum(descriptor instanceof EnumClassDescriptor);
        type.setAbstract(descriptor instanceof RecordClassDescriptor && ((RecordClassDescriptor) descriptor).isAbstract());

        return type;
    }
}
