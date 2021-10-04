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

@SchemaElement(
    name = "deltix.tbwg.messages.LinePoint",
    title = "Line Point"
)
public class LinePoint extends InstrumentMessage {

    public static final String CLASS_NAME = LinePoint.class.getName();

    @Decimal
    protected long value = TypeConstants.DECIMAL_NULL;

    @Decimal
    @SchemaElement(
        title = "Value"
    )
    @SchemaType(
        encoding = "DECIMAL64",
        dataType = SchemaDataType.FLOAT
    )
    public long getValue() {
        return value;
    }

    public void setValue(long value) {
        this.value = value;
    }

    @Override
    protected LinePoint createInstance() {
        return new LinePoint();
    }

    @Override
    public LinePoint clone() {
        LinePoint t = createInstance();
        t.copyFrom(this);
        return t;
    }

    @Override
    public InstrumentMessage copyFrom(RecordInfo source) {
        super.copyFrom(source);
        if (source instanceof LinePoint) {
            final LinePoint obj = (LinePoint) source;
            value = obj.value;
        }
        return this;
    }
}
