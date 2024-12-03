package com.epam.deltix.tbwg.webapp.utils;

import com.epam.deltix.qsrv.hf.pub.md.json.*;
import org.junit.Test;

import java.util.*;
import java.util.stream.Collectors;

import static com.epam.deltix.qsrv.hf.pub.md.FloatDataType.ENCODING_DECIMAL64;
import static com.epam.deltix.qsrv.hf.pub.md.IntegerDataType.ENCODING_INT64;
import static org.junit.Assert.*;

public class TypeDefMergeTest {

    public static final DataTypeDef NULLABLE_FLOAT_DATA_TYPE = new DataTypeDef("FLOAT", ENCODING_DECIMAL64, true);
    public static final DataTypeDef NON_NULLABLE_FLOAT_DATA_TYPE = new DataTypeDef("FLOAT", ENCODING_DECIMAL64, false);
    public static final DataTypeDef NON_NULLABLE_BOOLEAN_DATA_TYPE = new DataTypeDef("BOOLEAN", null, false);
    public static final DataTypeDef NULLABLE_INTEGER_DATA_TYPE = new DataTypeDef("INTEGER", ENCODING_INT64, true);
    public static final DataTypeDef NULLABLE_VARCHAR_DATA_TYPE = new DataTypeDef("VARCHAR", "UTF8", true);
    public static final DataTypeDef NON_NULLABLE_VARCHAR_DATA_TYPE = new DataTypeDef("VARCHAR", "UTF8", false);

    private final SchemaDefMerger schemaMerger = new SchemaDefMerger();


    @Test
    public void mergeAndAddFieldsTest() {
        FieldDef f1 = mkField("f1", NULLABLE_FLOAT_DATA_TYPE);
        FieldDef f2 = mkField("f2", NULLABLE_VARCHAR_DATA_TYPE);
        TypeDef t1 = new TypeDef("t1", "t1", new FieldDef[]{f1});
        TypeDef t2 = new TypeDef("t1", "t1", new FieldDef[]{f2});
        TypeDef merge = schemaMerger.mergeTypes(t1, t2);
        assertEquals(2, merge.getFields().length);
        List<FieldDef> mergedFields = Arrays.stream(merge.getFields()).collect(Collectors.toList());
        assertTrue(mergedFields.contains(f1));
        assertTrue(mergedFields.contains(f2));

    }

    @Test
    public void mergeNullableAndNotNullableFieldTest() {
        FieldDef f1 = mkField("f1", NULLABLE_VARCHAR_DATA_TYPE);
        FieldDef f2 = mkField("f1", NON_NULLABLE_VARCHAR_DATA_TYPE);
        TypeDef t1 = new TypeDef("t1", "t1", new FieldDef[]{f1});
        TypeDef t2 = new TypeDef("t1", "t1", new FieldDef[]{f2});
        TypeDef merge = schemaMerger.mergeTypes(t1, t2);
        assertEquals(1, merge.getFields().length);
        assertEquals(f1, merge.getFields()[0]);
        assertNotEquals(f2, merge.getFields()[0]);
    }

    @Test
    public void mergeIntegerAndFloatDataTypesTest() {
        FieldDef f1 = mkField("f1", NON_NULLABLE_FLOAT_DATA_TYPE);
        FieldDef f2 = mkField("f1", NULLABLE_INTEGER_DATA_TYPE);
        FieldDef merge = schemaMerger.mergeField(f1, f2);
        assertEquals(mkField("f1", NULLABLE_FLOAT_DATA_TYPE), merge);
    }

    @Test
    public void mergeDiffDataTypesTest() {
        FieldDef f1 = mkField("f1", NON_NULLABLE_FLOAT_DATA_TYPE);
        FieldDef f2 = mkField("f1", NON_NULLABLE_BOOLEAN_DATA_TYPE);
        FieldDef merge = schemaMerger.mergeField(f1, f2);
        assertEquals(mkField("f1", NON_NULLABLE_VARCHAR_DATA_TYPE), merge);
    }


    @Test
    public void mergeClassDataTypesTest() {
        DataTypeDef dt1 = mkClassDataType("t1", "t2");
        DataTypeDef dt2 = mkClassDataType("t2", "t3");
        DataTypeDef merge = schemaMerger.mergeDataTypes(dt1, dt2);
        assertEquals(3, merge.getTypes().size());
        assertTrue(merge.getTypes().contains("t1"));
        assertTrue(merge.getTypes().contains("t2"));
        assertTrue(merge.getTypes().contains("t3"));
    }

    @Test
    public void mergeArrayDataTypesTest() {
        DataTypeDef dt1 = mkArrDataType(NULLABLE_INTEGER_DATA_TYPE);
        DataTypeDef dt2 = mkArrDataType(NON_NULLABLE_FLOAT_DATA_TYPE);
        DataTypeDef merge = schemaMerger.mergeDataTypes(dt1, dt2);
        assertEquals(mkArrDataType(NULLABLE_FLOAT_DATA_TYPE), merge);
    }

    @Test
    public void mergeArrayDiffDataTypesTest() {
        DataTypeDef dt1 = mkArrDataType(mkClassDataType("t1"));
        DataTypeDef dt2 = mkArrDataType(mkArrDataType(mkClassDataType("t1")));
        DataTypeDef merge = schemaMerger.mergeDataTypes(dt1, dt2);
        assertEquals(mkArrDataType(NON_NULLABLE_VARCHAR_DATA_TYPE), merge);
    }


    private DataTypeDef mkClassDataType(String... types) {
        DataTypeDef dt = new DataTypeDef("OBJECT", null, false);
        dt.setTypes(List.of(types));
        return dt;
    }

    private DataTypeDef mkArrDataType(DataTypeDef elementType) {
        DataTypeDef dt = new DataTypeDef("ARRAY", null, false);
        dt.setElementType(elementType);
        return dt;
    }

    public static FieldDef mkField(String name, DataTypeDef type) {
        FieldDef field = new FieldDef();
        field.setName(name);
        field.setType(type);
        field.setTitle(name);
        field.setDescription(name);
        return field;
    }
}