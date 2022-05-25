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

import com.epam.deltix.dfp.Decimal;
import com.epam.deltix.timebase.messages.*;
import com.epam.deltix.timebase.messages.universal.QuoteSide;

@SchemaElement(
    name = "deltix.tbwg.messages.ExecutionTag",
    title = "Execution Tag"
)
public class ExecutionTag extends Tag {

    public static final String CLASS_NAME = ExecutionTag.class.getName();

    @Decimal
    protected long price = TypeConstants.DECIMAL_NULL;;

    @Decimal
    protected long size = TypeConstants.DECIMAL_NULL;;

    protected QuoteSide side;

    @SchemaElement(
        title = "Execution Price"
    )
    @SchemaType(
        isNullable = false
    )
    public long getPrice() {
        return price;
    }

    public void setPrice(long price) {
        this.price = price;
    }

    @SchemaElement(
        title = "Execution Size"
    )
    @SchemaType(
        isNullable = false
    )
    public long getSize() {
        return size;
    }

    public void setSize(long size) {
        this.size = size;
    }

    @SchemaElement(
        title = "Side"
    )
    @SchemaType(
        isNullable = false
    )
    public QuoteSide getSide() {
        return side;
    }

    public void setSide(QuoteSide side) {
        this.side = side;
    }


    @Override
    protected ExecutionTag createInstance() {
        return new ExecutionTag();
    }

    @Override
    public ExecutionTag clone() {
        ExecutionTag t = createInstance();
        t.copyFrom(this);
        return t;
    }

    @Override
    public InstrumentMessage copyFrom(RecordInfo source) {
        super.copyFrom(source);
        if (source instanceof ExecutionTag) {
            final ExecutionTag obj = (ExecutionTag) source;
            price = obj.price;
            size = obj.size;
            side = obj.side;
        }
        return this;
    }
}
