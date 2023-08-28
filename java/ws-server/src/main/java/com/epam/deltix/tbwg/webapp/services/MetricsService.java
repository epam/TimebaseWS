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
package com.epam.deltix.tbwg.webapp.services;

import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Tag;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

@Service
public class MetricsService {

    private final MeterRegistry meterRegistry;
    private final Map<String, Map<String, AtomicLong>> endpointGauges = new ConcurrentHashMap<>();
    private final Map<String, AtomicLong> gauges = new ConcurrentHashMap<>();

    public static class EndpointCounter {
        private final AtomicLong totalValue;
        private final AtomicLong value;

        private EndpointCounter(AtomicLong totalValue) {
            this(totalValue, new AtomicLong());
        }

        private EndpointCounter(AtomicLong totalValue, AtomicLong value) {
            this.totalValue = totalValue;
            this.value = value;
        }

        public void increment() {
            totalValue.incrementAndGet();
            value.incrementAndGet();
        }

        public void decrement() {
            totalValue.decrementAndGet();
            value.decrementAndGet();
        }
    }

    public MetricsService(MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;
    }

    public EndpointCounter endpointCounter(String name, String endpoint) {
        return endpoint != null ?
            new EndpointCounter(longEndpointGauge(name), longEndpointGauge(name, endpoint)) :
            new EndpointCounter(longEndpointGauge(name));
    }

    public AtomicLong longEndpointGauge(String name) {
        return longEndpointGauge(name, "/**");
    }

    public AtomicLong longEndpointGauge(String name, String endpoint) {
        return endpointGauges.computeIfAbsent(name, k -> new ConcurrentHashMap<>())
            .computeIfAbsent(endpoint, k -> meterRegistry.gauge(name, List.of(Tag.of("uri", endpoint)), new AtomicLong()));
    }

    public AtomicLong longGauge(String name) {
        return gauges.computeIfAbsent(name, k -> meterRegistry.gauge(name, new AtomicLong()));
    }

}
