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
import com.epam.deltix.timebase.messages.universal.QuoteSide;


@SchemaElement(
    name = "deltix.tbwg.messages.OrderBookLinePoint",
    title = "Level Line Point"
)
public class OrderBookLinePoint extends LinePoint {

    public static final String CLASS_NAME = OrderBookLinePoint.class.getName();

    protected int level = TypeConstants.INT32_NULL;

    protected QuoteSide side;

    @Decimal
    protected long volume = TypeConstants.DECIMAL_NULL;

    @SchemaElement(
        title = "Algo Id"
    )
    @SchemaType(
        isNullable = false
    )
    public int getLevel() {
        return level;
    }

    public void setLevel(int level) {
        this.level = level;
    }

    @SchemaType(
        isNullable = false
    )
    @SchemaElement(
        title = "Side"
    )
    public QuoteSide getSide() {
        return side;
    }

    public void setSide(QuoteSide side) {
        this.side = side;
    }

    @Decimal
    @SchemaElement(
        title = "Volume"
    )
    @SchemaType(
        encoding = "DECIMAL64",
        dataType = SchemaDataType.FLOAT
    )
    public long getVolume() {
        return volume;
    }

    public void setVolume(long volume) {
        this.volume = volume;
    }

    @Override
    protected OrderBookLinePoint createInstance() {
        return new OrderBookLinePoint();
    }

    @Override
    public OrderBookLinePoint clone() {
        OrderBookLinePoint t = createInstance();
        t.copyFrom(this);
        return t;
    }

    @Override
    public InstrumentMessage copyFrom(RecordInfo source) {
        super.copyFrom(source);
        if (source instanceof OrderBookLinePoint) {
            final OrderBookLinePoint obj = (OrderBookLinePoint) source;
            level = obj.level;
            side = obj.side;
            volume = obj.volume;
        }
        return this;
    }
}
