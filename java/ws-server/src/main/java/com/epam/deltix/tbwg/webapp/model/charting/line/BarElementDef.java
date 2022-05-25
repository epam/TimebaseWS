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
package com.epam.deltix.tbwg.webapp.model.charting.line;

import java.util.Objects;

public class BarElementDef extends LineElementDef {

    private String open;
    private String close;
    private String low;
    private String high;
    private String volume;

    public BarElementDef() {
    }

    public String getOpen() {
        return open;
    }

    public void setOpen(String open) {
        this.open = open;
    }

    public String getClose() {
        return close;
    }

    public void setClose(String close) {
        this.close = close;
    }

    public String getLow() {
        return low;
    }

    public void setLow(String low) {
        this.low = low;
    }

    public String getHigh() {
        return high;
    }

    public void setHigh(String high) {
        this.high = high;
    }

    public String getVolume() {
        return volume;
    }

    public void setVolume(String volume) {
        this.volume = volume;
    }

    @Override
    public BarElementDef copyFrom(LineElement template) {
        super.copyFrom(template);
        if (template instanceof BarElementDef) {
            BarElementDef t = (BarElementDef) template;
            open = t.open;
            close = t.close;
            low = t.low;
            high = t.high;
            volume = t.volume;
        }

        return this;
    }

    @Override
    public BarElementDef copy() {
        BarElementDef t = new BarElementDef();
        t.copyFrom(this);
        return t;
    }

    @Override
    public StringBuilder writeTo(StringBuilder str) {
        str.append("{\"time\":").append(time);
        str.append(",\"open\":\"").append(open).append("\"");
        str.append(",\"close\":\"").append(close).append("\"");
        str.append(",\"low\":\"").append(low).append("\"");
        str.append(",\"high\":\"").append(high).append("\"");
        str.append(",\"volume\":\"").append(volume).append("\"}");

        return str;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        if (!super.equals(o)) return false;
        BarElementDef that = (BarElementDef) o;
        return Objects.equals(open, that.open) &&
            Objects.equals(close, that.close) &&
            Objects.equals(low, that.low) &&
            Objects.equals(high, that.high) &&
            Objects.equals(volume, that.volume);
    }

    @Override
    public int hashCode() {
        return Objects.hash(super.hashCode(), open, close, low, high, volume);
    }
}
