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
package com.epam.deltix.tbwg.webapp.model.input;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.webcohesion.enunciate.metadata.DocumentationExample;

public class ExportStreamsRequest extends ExportRequest {

    /**
     * List of stream keys to be subscribed. At least one stream key should be defined.
     */
    @DocumentationExample(value = "bars")
    @JsonProperty
    public String[]             streams;

    /**
     * Query to select data, if undefined, 'streams' parameter will be used
     */
    @DocumentationExample(value = "select * from bars")
    @JsonProperty
    public String             query;
}
