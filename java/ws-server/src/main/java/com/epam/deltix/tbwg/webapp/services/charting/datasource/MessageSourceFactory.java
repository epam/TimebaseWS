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
package com.epam.deltix.tbwg.webapp.services.charting.datasource;

import com.epam.deltix.tbwg.webapp.services.charting.TimeInterval;
import com.epam.deltix.tbwg.webapp.services.timebase.TimebaseService;

import java.util.Set;

public interface MessageSourceFactory {

    ReactiveMessageSource   buildSource(TimebaseService service, String streamName, String[] symbols, Set<String> types,
                                        TimeInterval interval, boolean live, boolean unbound);

    ReactiveMessageSource   buildSource(TimebaseService service, String qql, TimeInterval interval, boolean live, boolean unbound);

    ReactiveMessageSource   buildSource(TimebaseService service, String streamName, String[] symbols, String qql, TimeInterval interval, boolean live, boolean unbound);

}