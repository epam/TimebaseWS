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
package com.epam.deltix.tbwg.webapp.model.charting.line;

import com.fasterxml.jackson.annotation.JsonIgnore;

import java.util.Objects;

/**
 * A definition of a base line point.
 * @label BaseLinePoint
 */
public abstract class LineElementDef implements LineElement {
    private int id;
    protected long time;

    public LineElementDef() {
    }

    @JsonIgnore
    public int lineId() {
        return id;
    }

    public void lineId(int id) {
        this.id = id;
    }

    /**
     * The timestamp. X axis value for a line point.
     */
    public long getTime() {
        return time;
    }

    public void setTime(long time) {
        this.time = time;
    }

    @Override
    public LineElementDef copyFrom(LineElement template) {
        if (template instanceof LineElementDef) {
            LineElementDef t = (LineElementDef) template;
            id = t.id;
            time = t.time;
        }

        return this;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof LineElementDef)) return false;
        LineElementDef that = (LineElementDef) o;
        return Objects.equals(getTime(), that.getTime());
    }

    @Override
    public int hashCode() {

        return Objects.hash(getTime());
    }
}
