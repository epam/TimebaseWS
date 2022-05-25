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

public class BBOElementDef extends LineElementDef {

    private String bidPrice;
    private String askPrice;

    public BBOElementDef() {
    }

    public String getBidPrice() {
        return bidPrice;
    }

    public void setBidPrice(String bidPrice) {
        this.bidPrice = bidPrice;
    }

    public String getAskPrice() {
        return askPrice;
    }

    public void setAskPrice(String askPrice) {
        this.askPrice = askPrice;
    }

    @Override
    public BBOElementDef copyFrom(LineElement template) {
        super.copyFrom(template);
        if (template instanceof BBOElementDef) {
            BBOElementDef t = (BBOElementDef) template;
            bidPrice = t.bidPrice;
            askPrice = t.askPrice;
        }

        return this;
    }

    @Override
    public BBOElementDef copy() {
        BBOElementDef t = new BBOElementDef();
        t.copyFrom(this);
        return t;
    }

    @Override
    public StringBuilder writeTo(StringBuilder str) {
        str.append("{\"time\":").append(time);
        str.append(",\"bidPrice\":\"").append(bidPrice).append("\"");
        str.append(",\"askPrice\":\"").append(askPrice).append("\"}");

        return str;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        if (!super.equals(o)) return false;
        BBOElementDef that = (BBOElementDef) o;
        return Objects.equals(bidPrice, that.bidPrice) &&
            Objects.equals(askPrice, that.askPrice);
    }

    @Override
    public int hashCode() {
        return Objects.hash(super.hashCode(), bidPrice, askPrice);
    }
}
