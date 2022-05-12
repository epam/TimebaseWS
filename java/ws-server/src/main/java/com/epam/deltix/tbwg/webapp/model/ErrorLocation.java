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
package com.epam.deltix.tbwg.webapp.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.epam.deltix.util.parsers.Location;

/**
 * Created by Alex Karpovich on 10/06/2021.
 */
public class ErrorLocation {

    @JsonProperty()
    public int startLine;
    @JsonProperty()
    public int endLine;

    @JsonProperty()
    public long startPosition;
    @JsonProperty()
    public long endPosition;

    public ErrorLocation(long encodedLocation) {
        this.startLine = Location.getStartLine(encodedLocation);
        this.endLine = Location.getEndLine(encodedLocation);

        this.startPosition = Location.getStartPosition(encodedLocation);
        this.endPosition = Location.getEndPosition(encodedLocation);
    }
}
