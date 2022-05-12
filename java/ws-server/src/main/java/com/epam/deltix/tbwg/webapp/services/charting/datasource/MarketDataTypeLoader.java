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
package com.epam.deltix.tbwg.webapp.services.charting.datasource;

import com.epam.deltix.qsrv.hf.pub.MappingTypeLoader;
import com.epam.deltix.qsrv.hf.pub.TypeLoaderImpl;
import com.epam.deltix.tbwg.messages.SecurityStatusMessage;

public class MarketDataTypeLoader {
    public static final String SECURITY_STATUS_CLASS = "deltix.timebase.api.messages.status.SecurityStatusMessage";

    public static final MappingTypeLoader TYPE_LOADER = new MappingTypeLoader(TypeLoaderImpl.SILENT_INSTANCE);

    static {
        TYPE_LOADER.bind(SECURITY_STATUS_CLASS, SecurityStatusMessage.class);
    }

}
