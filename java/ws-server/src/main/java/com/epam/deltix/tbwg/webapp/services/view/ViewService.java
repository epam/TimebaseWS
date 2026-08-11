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
package com.epam.deltix.tbwg.webapp.services.view;

import com.epam.deltix.tbwg.webapp.services.timebase.exc.InvalidQueryException;
import com.epam.deltix.tbwg.webapp.services.view.md.ViewMd;

import java.time.Instant;
import java.util.List;

public interface ViewService {

    String STREAM_VIEW_INFO = "views#";

    String VIEW_STREAM_SUFFIX = "#view#";

    static String getStreamName(String id) {
        return id + VIEW_STREAM_SUFFIX;
    }

    boolean isViewStream(String key);

    void create(ViewMd viewMd, String tbId) throws InvalidQueryException;

    void delete(String id, String tbId);

    void restart(String id, String tbId, Instant from);

    void stop(String id, String tbId);

    ViewMd get(String id, String tbId);

    List<ViewMd> list(String tbId);

    void subscribe(ViewListener listener);

    void unsubscribe(ViewListener listener);

}