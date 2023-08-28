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
package com.epam.deltix.tbwg.webapp.services.timebase.csvimport;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

public class ByteMultiSourceProgressCounter {

    private final Map<String, Long> sourcesProgress = new ConcurrentHashMap<>();
    private final AtomicLong totalSize = new AtomicLong();

    private final double rate;

    public ByteMultiSourceProgressCounter(double rate) {
        if (rate > 1 || rate < 0) rate = 1;
        this.rate = rate;
    }

    public double updateAndGet(String key, long value) {
        update(key, value);
        return getProgress();
    }

    private void update(String key, long value) {
        if (value < 0) {
            value = 0;
        }
        if (sourcesProgress.containsKey(key)) {
            sourcesProgress.put(key, value);
        } else {
            throw new IllegalArgumentException("Unknown source");
        }
    }

    private double getProgress() {
        long processedSize = sourcesProgress.values()
                .stream()
                .mapToLong(Long::longValue)
                .sum();
        return rate * processedSize / totalSize.get();
    }

    public void addProgressSource(String fileName, long fullSize) {
        if (fullSize <= 0) {
            throw new IllegalArgumentException("Invalid source size");
        }
        sourcesProgress.put(fileName, 0L);
        totalSize.getAndAdd(fullSize);
    }
}
