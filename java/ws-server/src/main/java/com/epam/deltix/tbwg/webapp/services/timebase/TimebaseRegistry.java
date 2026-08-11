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
package com.epam.deltix.tbwg.webapp.services.timebase;

import java.util.List;

/**
 * Registry of all configured TimeBase instances.
 * Provides access to individual instances by id and to the default (first) instance.
 */
public interface TimebaseRegistry {

    /**
     * Returns all configured TimeBase service instances in configuration order.
     */
    List<TimebaseService> getAll();

    /**
     * Returns the TimeBase service by its configured id.
     *
     * @throws IllegalArgumentException if no instance with the given id exists
     */
    TimebaseService getById(String id);

    /**
     * Returns the first (default) TimeBase service instance.
     */
    TimebaseService getDefault();

    /**
     * Resolves a TimeBase instance by id. Returns the default instance when {@code id} is null or empty.
     *
     * @throws IllegalArgumentException if {@code id} is non-empty but unknown
     */
    default TimebaseService resolve(String id) {
        return id != null && !id.isEmpty() ? getById(id) : getDefault();
    }

    /**
     * Returns {@code service} if non-null, otherwise the default instance.
     */
    default TimebaseService resolve(TimebaseService service) {
        return service != null ? service : getDefault();
    }
}
