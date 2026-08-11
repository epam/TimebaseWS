/*
 * Copyright 2024 EPAM Systems, Inc
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

import com.epam.deltix.qsrv.hf.tickdb.client.Version;
import com.epam.deltix.tbwg.webapp.services.timebase.TimebaseService;

public class TimebaseInstanceDef {

    public final String id;
    public final String url;
    public final boolean readonly;
    public final boolean connected;
    public final String serverVersion;
    public final String clientVersion;
    public final String errorMessage;

    public TimebaseInstanceDef(TimebaseService svc) {
        this.id = svc.getId();
        this.url = svc.getUrl();
        this.readonly = svc.isReadonly();
        this.connected = svc.isConnected();
        this.serverVersion = svc.getServerVersion();
        this.clientVersion = Version.getVersion();
        this.errorMessage = svc.getLastError();
    }
}
