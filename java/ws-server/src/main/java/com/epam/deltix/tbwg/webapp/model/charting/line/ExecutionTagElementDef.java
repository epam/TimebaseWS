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

import com.epam.deltix.timebase.messages.universal.QuoteSide;

import java.util.Objects;

/**
 * A line point that defines an execution tag.
 * @label ExecutionTag
 */
public class ExecutionTagElementDef extends TagElementDef {
    private String price;
    private QuoteSide side;
    private String size;

    /**
     * Execution price.
     */
    public String getPrice() {
        return price;
    }

    public void setPrice(String price) {
        this.price = price;
    }

    /**
     * Execution side.
     */
    public QuoteSide getSide() {
        return side;
    }

    public void setSide(QuoteSide side) {
        this.side = side;
    }

    /**
     * Execution size.
     */
    public String getSize() {
        return size;
    }

    public void setSize(String size) {
        this.size = size;
    }

    @Override
    public ExecutionTagElementDef copyFrom(LineElement template) {
        super.copyFrom(template);
        if (template instanceof ExecutionTagElementDef) {
            ExecutionTagElementDef t = (ExecutionTagElementDef) template;
            price = t.price;
            side = t.side;
            size = t.size;
        }

        return this;
    }

    @Override
    public ExecutionTagElementDef copy() {
        ExecutionTagElementDef t = new ExecutionTagElementDef();
        t.copyFrom(this);
        return t;
    }
    
    @Override
    public StringBuilder writeTo(StringBuilder str) {
        str.append("{\"time\":").append(time);
        str.append(",\"value\":\"").append(price).append("\"");
        str.append(",\"side\":\"").append(side).append("\"");
        str.append(",\"tagType\":\"").append("EXECUTION").append("\"}");

        return str;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        if (!super.equals(o)) return false;
        ExecutionTagElementDef that = (ExecutionTagElementDef) o;
        return Objects.equals(price, that.price) &&
            side == that.side &&
            Objects.equals(size, that.size);
    }

    @Override
    public int hashCode() {
        return Objects.hash(super.hashCode(), price, side, size);
    }
}
