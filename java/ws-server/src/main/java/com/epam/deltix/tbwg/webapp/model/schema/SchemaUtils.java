/*
 * Copyright 2021 EPAM Systems, Inc
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
package com.epam.deltix.tbwg.webapp.model.schema;

import com.epam.deltix.gflog.api.Log;
import com.epam.deltix.gflog.api.LogFactory;
import com.epam.deltix.qsrv.hf.pub.md.*;
import com.epam.deltix.qsrv.hf.tickdb.schema.*;
import com.epam.deltix.tbwg.webapp.model.schema.changes.CreateFieldChangeDef;
import com.epam.deltix.tbwg.webapp.model.schema.changes.FieldChangeWrapper;
import com.epam.deltix.tbwg.webapp.model.schema.changes.FieldModifierChangeDef;
import com.epam.deltix.tbwg.webapp.model.schema.changes.FieldTypeChangeDef;

import javax.annotation.Nullable;
import java.util.*;

import static com.epam.deltix.tbwg.webapp.model.schema.SchemaBuilder.getDataTypeDef;

public final class SchemaUtils {

    private static final Log LOG = LogFactory.getLog(SchemaUtils.class);

    private SchemaUtils() {
    }

    public static SchemaMappingDef fromSchemaMapping(SchemaMapping schemaMapping, RecordClassSet source, RecordClassSet target) {
        SchemaMappingDef schemaMappingDef = new SchemaMappingDef();
        schemaMappingDef.setDescriptors(descriptorsMapping(schemaMapping, source, target));
        schemaMappingDef.setFields(fieldsMapping(schemaMapping, source, target));
        schemaMappingDef.setEnumValues(enumValues(schemaMapping, source, target));
        return schemaMappingDef;
    }

    public static SchemaMapping toSchemaMapping(SchemaMappingDef schemaMappingDef, RecordClassSet source, RecordClassSet target) {
        SchemaMapping schemaMapping = new SchemaMapping();
        putDescriptorMapping(schemaMapping, source, target, schemaMappingDef.getDescriptors());
        putFieldMapping(schemaMapping, source, target, schemaMappingDef.getFields());
        putEnumValueMapping(schemaMapping, source, target, schemaMappingDef.getEnumValues());
        return schemaMapping;
    }

    public static void putDescriptorMapping(SchemaMapping schemaMapping, RecordClassSet source, RecordClassSet target,
                                            @Nullable Map<String, String> idsMap) {
        if (idsMap != null) {
            idsMap.forEach((sourceName, targetName) -> putDescriptorMapping(schemaMapping, source, target, sourceName, targetName));
        }
    }

    public static void putDescriptorMapping(SchemaMapping schemaMapping, RecordClassSet source, RecordClassSet target,
                                            String sourceName, String targetName) {
        ClassDescriptor sourceDesc = source.getClassDescriptor(sourceName);
        ClassDescriptor targetDesc = target.getClassDescriptor(targetName);
        if (sourceDesc == null || targetDesc == null) {
            return;
        }
        schemaMapping.descriptors.put(sourceDesc.getGuid(), targetDesc.getGuid());
    }

    public static void putFieldMapping(SchemaMapping schemaMapping, RecordClassSet source, RecordClassSet target,
                                       @Nullable List<SchemaMappingDef.FieldMapping> fields) {
        if (fields != null) {
            for (SchemaMappingDef.FieldMapping field : fields) {
                putFieldMapping(schemaMapping, source, target, field);
            }
        }
    }

    public static void putFieldMapping(SchemaMapping schemaMapping, RecordClassSet source, RecordClassSet target,
                                       SchemaMappingDef.FieldMapping field) {
        DataField sourceField = findField(source, field.getSourceTypeName(), field.getSourceName());
        DataField targetField = findField(target, field.getTargetTypeName(), field.getTargetName());
        if (sourceField == null || targetField == null) {
            return;
        }
        schemaMapping.fields.put(sourceField, targetField);
    }

    public static void putEnumValueMapping(SchemaMapping schemaMapping, RecordClassSet source, RecordClassSet target,
                                           List<SchemaMappingDef.FieldMapping> fields) {
        if (fields != null) {
            for (SchemaMappingDef.FieldMapping field : fields) {
                putEnumValueMapping(schemaMapping, source, target, field);
            }
        }
    }

    public static void putEnumValueMapping(SchemaMapping schemaMapping, RecordClassSet source, RecordClassSet target,
                                           SchemaMappingDef.FieldMapping field) {
        EnumClassDescriptor sourceECD = (EnumClassDescriptor) source.getClassDescriptor(field.getSourceTypeName());
        EnumClassDescriptor targetECD = (EnumClassDescriptor) target.getClassDescriptor(field.getTargetTypeName());
        if (sourceECD == null || targetECD == null) {
            return;
        }
        EnumValue sourceValue = getValue(sourceECD, field.getSourceName());
        EnumValue targetValue = getValue(targetECD, field.getTargetName());
        if (sourceValue == null || targetValue == null) {
            return;
        }
        schemaMapping.enumValues.put(sourceValue, targetValue);
    }

    public static EnumValue getValue(EnumClassDescriptor ecd, String name) {
        for (EnumValue value : ecd.getValues()) {
            if (value.symbol.equals(name)) {
                return value;
            }
        }
        return null;
    }

    public static FieldDef fieldDef(@Nullable DataField dataField) {
        if (dataField == null) {
            return null;
        } else if (dataField instanceof NonStaticDataField) {
            return fieldDef((NonStaticDataField) dataField);
        } else if (dataField instanceof StaticDataField) {
            return fieldDef((StaticDataField) dataField);
        }
        throw new UnsupportedOperationException();
    }

    public static FieldDef fieldDef(NonStaticDataField dataField) {
        return FieldDef.createNonStatic(dataField.getName(), dataField.getTitle(),
            dataField.getDescription(), getDataTypeDef(dataField.getType()),
            dataField.getRelativeTo(), dataField.isPk()
        );
    }

    public static FieldDef fieldDef(StaticDataField dataField) {
        return FieldDef.createStatic(dataField.getName(), dataField.getTitle(), dataField.getDescription(),
                getDataTypeDef(dataField.getType()),
                dataField.getStaticValue());
    }

    public static FieldChangeWrapper fieldChange(AbstractFieldChange fieldChange) {
        if (fieldChange instanceof CreateFieldChange) {
            return new CreateFieldChangeDef((CreateFieldChange) fieldChange);
        } else if (fieldChange instanceof FieldTypeChange) {
            return new FieldTypeChangeDef((FieldTypeChange) fieldChange);
        } else if (fieldChange instanceof FieldModifierChange) {
            return new FieldModifierChangeDef((FieldModifierChange) fieldChange);
        } else {
            return new FieldChangeWrapper(fieldChange);
        }
    }

    public static DataField findField(RecordClassSet classSet, String typeName, String fieldName) {
        RecordClassDescriptor rcd = (RecordClassDescriptor) classSet.getClassDescriptor(typeName);
        if (rcd == null)
            return null;
        return rcd.getField(fieldName);
    }

    public static Map<String, String> descriptorsMapping(SchemaMapping schemaMapping, RecordClassSet source, RecordClassSet target) {
        Map<String, String> result = new HashMap<>();
        schemaMapping.descriptors.forEach((sourceGUID, targetGUID) -> {
            result.put(source.findClass(sourceGUID).getName(), target.findClass(targetGUID).getName());
        });
        return result;
    }

    public static List<SchemaMappingDef.FieldMapping> fieldsMapping(SchemaMapping schemaMapping, RecordClassSet source,
                                                                    RecordClassSet target) {
        List<SchemaMappingDef.FieldMapping> result = new ArrayList<>();
        Map<DataField, String> sourceFields = fieldsToTypeNames(source);
        Map<DataField, String> targetFields = fieldsToTypeNames(target);
        schemaMapping.fields.forEach((sourceField, targetField) -> {
            result.add(fieldMapping(sourceField.getName(), sourceFields.get(sourceField),
                    targetField.getName(), targetFields.get(targetField)));
        });
        return result;
    }

    public static List<SchemaMappingDef.FieldMapping> enumValues(SchemaMapping schemaMapping, RecordClassSet source,
                                                                 RecordClassSet target) {
        List<SchemaMappingDef.FieldMapping> result = new ArrayList<>();
        Map<EnumValue, String> sourceValues = enumValuesToTypeNames(source);
        Map<EnumValue, String> targetValues = enumValuesToTypeNames(target);
        schemaMapping.enumValues.forEach((sourceValue, targetValue) -> {
            result.add(fieldMapping(sourceValue.symbol, sourceValues.get(sourceValue),
                    targetValue.symbol, targetValues.get(targetValue)));
        });
        return result;
    }

    public static SchemaMappingDef.FieldMapping fieldMapping(String sourceName, String sourceType,
                                                             String targetName, String targetType) {
        SchemaMappingDef.FieldMapping fieldMapping = new SchemaMappingDef.FieldMapping();
        fieldMapping.setSourceName(sourceName);
        fieldMapping.setSourceTypeName(sourceType);
        fieldMapping.setTargetName(targetName);
        fieldMapping.setSourceTypeName(targetType);
        return fieldMapping;
    }

    public static Map<DataField, String> fieldsToTypeNames(RecordClassSet recordClassSet) {
        Map<DataField, String> map = new HashMap<>();
        for (RecordClassDescriptor topType : recordClassSet.getTopTypes()) {
            addRCDFields(map, topType);
        }
        return map;
    }

    public static Map<EnumValue, String> enumValuesToTypeNames(RecordClassSet recordClassSet) {
        Map<EnumValue, String> map = new HashMap<>();
        for (RecordClassDescriptor topType : recordClassSet.getTopTypes()) {
            addECDFields(map, topType);
        }
        return map;
    }

    public static void setDefaults(StreamMetaDataChange change, Map<String, Map<String, String>> defaults) {
        if (defaults == null)
            return;

        for (ClassDescriptorChange classDescriptorChange : change.changes) {
            if (classDescriptorChange.getTarget() != null) { // when removing class target is null
                Map<String, String> fieldsMap = defaults.get(classDescriptorChange.getTarget().getName());
                if (fieldsMap != null) {
                    for (AbstractFieldChange fieldChange : classDescriptorChange.getChanges()) {
                        if (hasDefaults(fieldChange)) {
                            String defaultValue = fieldsMap.get(fieldChange.getTarget().getName());
                            if (defaultValue != null) {
                                setDefault(fieldChange, defaultValue);
                            }
                        }
                    }
                }
            }
        }
    }

    public static void setDrop(StreamMetaDataChange change, Map<String, Set<String>> drop) {
        if (drop == null)
            return;

        for (ClassDescriptorChange classDescriptorChange : change.changes) {
            if (classDescriptorChange.getTarget() != null) { // when removing class target is null
                Set<String> fieldsSet = drop.get(classDescriptorChange.getTarget().getName());
                if (fieldsSet != null) {
                    for (AbstractFieldChange fieldChange : classDescriptorChange.getChanges()) {
                        if (hasDefaults(fieldChange)) {
                            setIgnore(fieldChange);
                        }
                    }
                }
            }
        }
    }

    public static String hasErrors(StreamMetaDataChange change) {
        for (ClassDescriptorChange classDescriptorChange : change.changes) {
            for (AbstractFieldChange fieldChange : classDescriptorChange.getChanges()) {
                if (fieldChange instanceof CreateFieldChange && ((CreateFieldChange) fieldChange).getInitialValue() == null) {
                    CreateFieldChange createFieldChange = (CreateFieldChange) fieldChange;
                    if (createFieldChange.getTarget() instanceof StaticDataField) {
                        createFieldChange.setInitialValue(((StaticDataField) fieldChange.getTarget()).getStaticValue());
                    } else {
                        ((CreateFieldChange) fieldChange).setInitialValue(null);
                    }
                } else if (fieldChange instanceof FieldModifierChange && ((FieldModifierChange) fieldChange).getInitialValue() == null) {
                    FieldModifierChange fieldModifierChange = (FieldModifierChange) fieldChange;
                    if (fieldModifierChange.getTarget() instanceof StaticDataField) {
                        fieldModifierChange.setInitialValue(((StaticDataField) fieldModifierChange.getTarget()).getStaticValue());
                    } else {
                        ((FieldModifierChange) fieldChange).setInitialValue(null);
                    }
                }
                if (fieldChange.hasErrors()) {
                    return classDescriptorChange.getTarget().getName() + ":" + fieldChange.getTarget().getName();
                }
            }
        }
        return null;
    }

    private static void setDefault(AbstractFieldChange change, String value) {
        if (change instanceof CreateFieldChange) {
            ((CreateFieldChange) change).setInitialValue(value);
        } else if (change instanceof FieldTypeChange) {
            ((FieldTypeChange) change).setDefaultValue(value);
        } else if (change instanceof FieldModifierChange) {
            ((FieldModifierChange) change).setInitialValue(value);
        }
    }

    private static void setIgnore(AbstractFieldChange change) {
        if (change instanceof FieldTypeChange) {
            ((FieldTypeChange) change).setIgnoreErrors();
        }
    }

    private static boolean hasDefaults(AbstractFieldChange change) {
        return change instanceof CreateFieldChange ||
                change instanceof FieldModifierChange ||
                change instanceof FieldTypeChange;
    }

    private static void addRCDFields(Map<DataField, String> map, RecordClassDescriptor rcd) {
        for (DataField field : rcd.getFields()) {
            map.put(field, rcd.getName());
        }
        rcd.visitDependencies(descriptor -> {
            if (descriptor instanceof RecordClassDescriptor) {
                addRCDFields(map, (RecordClassDescriptor) descriptor);
            }
            return true;
        });
    }

    private static void addECDFields(Map<EnumValue, String> map, RecordClassDescriptor rcd) {
        rcd.visitDependencies(descriptor -> {
            if (descriptor instanceof RecordClassDescriptor) {
                addECDFields(map, (RecordClassDescriptor) descriptor);
            } else if (descriptor instanceof EnumClassDescriptor) {
                for (EnumValue value : ((EnumClassDescriptor) descriptor).getValues()) {
                    map.put(value, descriptor.getName());
                }
            }
            return true;
        });
    }
}
