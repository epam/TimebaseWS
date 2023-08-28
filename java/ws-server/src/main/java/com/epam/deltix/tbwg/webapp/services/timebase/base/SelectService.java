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
package com.epam.deltix.tbwg.webapp.services.timebase.base;

import com.epam.deltix.tbwg.webapp.model.input.SelectRequest;
import com.epam.deltix.tbwg.webapp.services.timebase.exc.NoStreamsException;
import com.epam.deltix.tbwg.webapp.utils.MessageSource2ResponseStream;

public interface SelectService {

    MessageSource2ResponseStream select(long startTime, long endTime, long offset, int rows, boolean reverse,
                                        String[] types, String[] symbols, String[] keys, String space, int maxRecords)
            throws NoStreamsException;

    MessageSource2ResponseStream select(SelectRequest selectRequest, int maxRecords) throws NoStreamsException;

}
