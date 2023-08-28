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

import java.util.Objects;

/**
 * A definition of a line point.
 * @label LinePoint
 */
public class LinePointDef extends LineElementDef {
    private String value;

    public LinePointDef() {
    }

    /**
     * Y axis value for a line point.
     */
    public String getValue() {
        return value;
    }

    public void setValue(String value) {
        this.value = value;
    }

    @Override
    public LinePointDef copyFrom(LineElement template) {
        super.copyFrom(template);
        if (template instanceof LinePointDef) {
            LinePointDef t = (LinePointDef) template;
            value = t.value;
        }

        return this;
    }

    @Override
    public LinePointDef copy() {
        LinePointDef t = new LinePointDef();
        t.copyFrom(this);
        return t;
    }

    @Override
    public StringBuilder writeTo(StringBuilder str) {
        str.append("{\"time\":").append(time);
        str.append(",\"value\":\"").append(value).append("\"}");
        return str;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        if (!super.equals(o)) return false;
        LinePointDef that = (LinePointDef) o;
        return Objects.equals(value, that.value);
    }

    @Override
    public int hashCode() {
        return Objects.hash(super.hashCode(), value);
    }
}
