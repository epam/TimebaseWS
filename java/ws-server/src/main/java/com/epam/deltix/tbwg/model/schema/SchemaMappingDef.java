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
package com.epam.deltix.tbwg.model.schema;

import com.webcohesion.enunciate.metadata.DocumentationExample;

import javax.validation.constraints.NotNull;
import java.util.List;
import java.util.Map;

public class SchemaMappingDef {

    private Map<String, String> descriptors;

    private List<FieldMapping> fields;

    private List<FieldMapping> enumValues;

    /**
     * Descriptors name-to-name map.
     */
    @DocumentationExample(value = "Class1 Class1New", value2 = "Class2 Class2New")
    public Map<String, String> getDescriptors() {
        return descriptors;
    }

    public void setDescriptors(Map<String, String> descriptors) {
        this.descriptors = descriptors;
    }

    /**
     * List of field mappings
     */
    public List<FieldMapping> getFields() {
        return fields;
    }

    public void setFields(List<FieldMapping> fields) {
        this.fields = fields;
    }

    /**
     * List of enum-values mappings
     */
    public List<FieldMapping> getEnumValues() {
        return enumValues;
    }

    public void setEnumValues(List<FieldMapping> enumValues) {
        this.enumValues = enumValues;
    }

    public static class FieldMapping {

        @NotNull
        private String sourceName;

        @NotNull
        private String sourceTypeName;

        @NotNull
        private String targetName;

        @NotNull
        private String targetTypeName;

        /**
         * Target field or enum value name
         */
        @NotNull
        @DocumentationExample(value = "field", value2 = "anotherField")
        public String getSourceName() {
            return sourceName;
        }

        public void setSourceName(String sourceName) {
            this.sourceName = sourceName;
        }

        /**
         * Source type name
         */
        @NotNull
        @DocumentationExample(value = "Class", value2 = "AnotherClass")
        public String getSourceTypeName() {
            return sourceTypeName;
        }

        public void setSourceTypeName(String sourceTypeName) {
            this.sourceTypeName = sourceTypeName;
        }

        /**
         * Target field or enum value name
         */
        @NotNull
        @DocumentationExample(value = "newField", value2 = "anotherFieldNew")
        public String getTargetName() {
            return targetName;
        }

        public void setTargetName(String targetName) {
            this.targetName = targetName;
        }

        /**
         * Target type name
         */
        @NotNull
        @DocumentationExample(value = "Class", value2 = "NewAnotherClass")
        public String getTargetTypeName() {
            return targetTypeName;
        }

        public void setTargetTypeName(String targetTypeName) {
            this.targetTypeName = targetTypeName;
        }
    }

}
