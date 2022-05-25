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

import java.util.Map;
import java.util.Set;

public class ChangeSchemaRequest extends SchemaChangesRequest {

    private Map<String, Map<String, String>> defaultValues;

    private Map<String, Set<String>> dropValues;

    private boolean background;

    public Map<String, Set<String>> getDropValues() {
        return dropValues;
    }

    public void setDropValues(Map<String, Set<String>> dropValues) {
        this.dropValues = dropValues;
    }

    public Map<String, Map<String, String>> getDefaultValues() {
        return defaultValues;
    }

    public void setDefaultValues(Map<String, Map<String, String>> defaultValues) {
        this.defaultValues = defaultValues;
    }

    public boolean isBackground() {
        return background;
    }

    public void setBackground(boolean background) {
        this.background = background;
    }
}
