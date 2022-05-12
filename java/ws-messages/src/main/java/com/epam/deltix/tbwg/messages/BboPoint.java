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
package com.epam.deltix.tbwg.messages;

import com.epam.deltix.timebase.messages.*;
import com.epam.deltix.dfp.Decimal;

@SchemaElement(
    name = "deltix.tbwg.messages.BboPoint",
    title = "BBO Point"
)
public class BboPoint extends InstrumentMessage {

    public static final String CLASS_NAME = BboPoint.class.getName();

    @Decimal
    protected long bidPrice = TypeConstants.DECIMAL_NULL;

    @Decimal
    protected long askPrice = TypeConstants.DECIMAL_NULL;

    @Decimal
    @SchemaElement(
        title = "Value"
    )
    @SchemaType(
        encoding = "DECIMAL64",
        dataType = SchemaDataType.FLOAT
    )
    public long getBidPrice() {
        return bidPrice;
    }

    public void setBidPrice(long bidPrice) {
        this.bidPrice = bidPrice;
    }

    @Decimal
    @SchemaElement(
        title = "Value"
    )
    @SchemaType(
        encoding = "DECIMAL64",
        dataType = SchemaDataType.FLOAT
    )
    public long getAskPrice() {
        return askPrice;
    }

    public void setAskPrice(long askPrice) {
        this.askPrice = askPrice;
    }

    @Override
    protected BboPoint createInstance() {
        return new BboPoint();
    }

    @Override
    public BboPoint clone() {
        BboPoint t = createInstance();
        t.copyFrom(this);
        return t;
    }

    @Override
    public InstrumentMessage copyFrom(RecordInfo source) {
        super.copyFrom(source);
        if (source instanceof BboPoint) {
            final BboPoint obj = (BboPoint) source;
            bidPrice = obj.bidPrice;
            askPrice = obj.askPrice;
        }
        return this;
    }
}
