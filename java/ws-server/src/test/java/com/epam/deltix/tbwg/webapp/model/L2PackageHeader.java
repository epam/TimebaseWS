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

import com.epam.deltix.timebase.messages.InstrumentMessage;
import com.epam.deltix.timebase.messages.*;
import com.epam.deltix.timebase.messages.universal.*;
import com.epam.deltix.util.collections.generated.ObjectArrayList;

@SchemaElement(
    name = "deltix.timebase.api.messages.universal.PackageHeader",
    title = "Package Header"
)
public class L2PackageHeader extends InstrumentMessage {

    protected ObjectArrayList<BaseEntryInfo> entries = null;
    protected PackageType packageType = null;

    @SchemaElement(
        title = "Entries"
    )
    @SchemaArrayType(
        isNullable = false,
        isElementNullable = false,
        elementTypes =  {
            TradeEntry.class, L2EntryNew.class, L2EntryUpdate.class
        }
    )
    public ObjectArrayList<BaseEntryInfo> getEntries() {
        return entries;
    }

    public void setEntries(ObjectArrayList<BaseEntryInfo> value) {
        this.entries = value;
    }

    @SchemaType(
        isNullable = false
    )
    @SchemaElement(
        title = "Package Type"
    )
    public PackageType getPackageType() {
        return packageType;
    }

    public void setPackageType(PackageType value) {
        this.packageType = value;
    }

}
