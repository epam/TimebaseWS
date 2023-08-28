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
package com.epam.deltix.tbwg.webapp.services.view;

import com.epam.deltix.tbwg.webapp.services.view.md.ViewMd;

import java.time.Instant;
import java.util.List;

public interface ViewService {

    String STREAM_VIEW_INFO = "views#";

    String VIEW_STREAM_SUFFIX = "#view#";

    static String getStreamName(String id) {
        return id + VIEW_STREAM_SUFFIX;
    }

    static boolean isViewStream(String key) {
        return key != null && key.endsWith(VIEW_STREAM_SUFFIX);
    }

    void create(ViewMd viewMd);

    void delete(String id);

    void restart(String id, Instant from);

    void stop(String id);

    ViewMd get(String id);

    List<ViewMd> list();

    void subscribe(ViewListener listener);

    void unsubscribe(ViewListener listener);

}
