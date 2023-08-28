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
package com.epam.deltix.tbwg.webapp.model.schema.changes;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.epam.deltix.qsrv.hf.tickdb.schema.AbstractFieldChange;
import com.epam.deltix.qsrv.hf.tickdb.schema.SchemaChange;
import com.epam.deltix.tbwg.webapp.model.schema.FieldDef;
import com.epam.deltix.tbwg.webapp.model.schema.SchemaUtils;

public class FieldChangeWrapper<T extends AbstractFieldChange> implements SchemaChangeDef {

    @JsonIgnore
    protected final T fieldChange;

    public FieldChangeWrapper(T fieldChange) {
        this.fieldChange = fieldChange;
    }

    @JsonProperty("source")
    public FieldDef getSource() {
        return SchemaUtils.fieldDef(fieldChange.getSource());
    }

    @JsonProperty("target")
    public FieldDef getTarget() {
        return SchemaUtils.fieldDef(fieldChange.getTarget());
    }

    @JsonProperty("hasErrors")
    public boolean hasErrors() {
        return fieldChange.hasErrors();
    }

    @JsonProperty("typeName")
    public String getType() {
        return fieldChange.getClass().getSimpleName();
    }

    @JsonProperty("status")
    public String getStatus() {
        return fieldChange.toString();
    }

    @Override
    public SchemaChange.Impact getChangeImpact() {
        return fieldChange.getChangeImpact();
    }
}
