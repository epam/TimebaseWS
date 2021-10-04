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
package com.epam.deltix.tbwg.model.schema.changes;

import com.epam.deltix.qsrv.hf.pub.md.StaticDataField;
import com.epam.deltix.qsrv.hf.tickdb.schema.FieldModifierChange;

public class FieldModifierChangeDef extends FieldChangeWrapperWithDefault<FieldModifierChange> {

    public FieldModifierChangeDef(FieldModifierChange fieldChange) {
        super(fieldChange);
    }

    @Override
    public boolean isDefaultValueRequired() {
        return fieldChange.hasErrors();
    }

    @Override
    public String getDefaultValue() {
        return fieldChange.getInitialValue();
    }

    @Override
    public String getStatus() {
        return (fieldChange.getSource() instanceof StaticDataField) ?
                String.format("Field '%s' changed from 'static' to 'non-static'.", fieldChange.getTarget().toString()):
                String.format("Field '%s' changed from 'non-static' to 'static'.", fieldChange.getTarget().toString());
    }
}
