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
package com.epam.deltix.grafana;

import org.junit.Test;

import java.time.Instant;
import java.util.concurrent.TimeUnit;

import static org.junit.Assert.assertEquals;

public class PrettyTimeSaverTest {

    @Test
    public void testPretty() {
        Instant start = Instant.parse("2020-09-23T10:15:00.000Z");
        Instant end = Instant.parse("2020-09-23T11:15:00.000Z");
        long step = TimeUnit.MINUTES.toMillis(5);
        long next = start.toEpochMilli();
        PrettyTimeSaver timeSaver = PrettyTimeSaver.create(start.toEpochMilli(), end.toEpochMilli(), step);
        assertEquals(start.toEpochMilli() - step, timeSaver.getStart());
        assertEquals(start.toEpochMilli(), timeSaver.getEnd());
        assertEquals(step, timeSaver.getStep());
        timeSaver.put(next);
        assertEquals(start.toEpochMilli() - step, timeSaver.getStart());
        assertEquals(start.toEpochMilli(), timeSaver.getEnd());
        assertEquals(next, timeSaver.getLast());
        next = Instant.parse("2020-09-23T10:15:15.000Z").toEpochMilli();
        timeSaver.put(next);
        assertEquals(start.toEpochMilli(), timeSaver.getStart());
        assertEquals(start.toEpochMilli() + step, timeSaver.getEnd());
        assertEquals(next, timeSaver.getLast());
        next = Instant.parse("2020-09-23T10:20:00.000Z").toEpochMilli();
        timeSaver.put(next);
        assertEquals(start.toEpochMilli(), timeSaver.getStart());
        assertEquals(start.toEpochMilli() + step, timeSaver.getEnd());
        assertEquals(next, timeSaver.getLast());
        next = Instant.parse("2020-09-23T10:20:00.001Z").toEpochMilli();
        timeSaver.put(next);
        assertEquals(start.toEpochMilli() + step, timeSaver.getStart());
        assertEquals(start.toEpochMilli() + 2 * step, timeSaver.getEnd());
        assertEquals(next, timeSaver.getLast());
        next = Instant.parse("2020-09-23T10:25:00.00Z").toEpochMilli();
        timeSaver.put(next);
        assertEquals(start.toEpochMilli() + step, timeSaver.getStart());
        assertEquals(start.toEpochMilli() + 2 * step, timeSaver.getEnd());
        assertEquals(next, timeSaver.getLast());
        next = Instant.parse("2020-09-23T10:30:00.00Z").toEpochMilli();
        timeSaver.put(next);
        assertEquals(start.toEpochMilli() + 2 * step, timeSaver.getStart());
        assertEquals(start.toEpochMilli() + 3 * step, timeSaver.getEnd());
        assertEquals(next, timeSaver.getLast());
    }

    @Test
    public void testNotPrettyStart5Mins() {
        Instant start = Instant.parse("2020-09-23T10:11:36.345Z");
        Instant prettyStart = Instant.parse("2020-09-23T10:15:00.000Z");
        Instant end = Instant.parse("2020-09-23T11:15:00.000Z");
        long step = TimeUnit.MINUTES.toMillis(5);
        PrettyTimeSaver timeSaver = PrettyTimeSaver.create(start.toEpochMilli(), end.toEpochMilli(), step);
        assertEquals(start.toEpochMilli(), timeSaver.getStart());
        assertEquals(prettyStart.toEpochMilli(), timeSaver.getEnd());
        assertEquals(step, timeSaver.getStep());
    }

    @Test
    public void testNotPrettyStart1Hr() {
        Instant start = Instant.parse("2020-09-23T10:11:36.345Z");
        Instant prettyStart = Instant.parse("2020-09-23T11:00:00.000Z");
        Instant end = Instant.parse("2020-09-23T23:15:56.000Z");
        long step = TimeUnit.HOURS.toMillis(1);
        PrettyTimeSaver timeSaver = PrettyTimeSaver.create(start.toEpochMilli(), end.toEpochMilli(), step);
        assertEquals(start.toEpochMilli(), timeSaver.getStart());
        assertEquals(prettyStart.toEpochMilli(), timeSaver.getEnd());
        assertEquals(step, timeSaver.getStep());
    }

    @Test
    public void testNotPrettyStart3Hrs() {
        Instant start = Instant.parse("2020-09-23T10:11:36.345Z");
        Instant prettyStart = Instant.parse("2020-09-23T12:00:00.000Z");
        Instant end = Instant.parse("2020-09-25T23:15:56.000Z");
        long step = TimeUnit.HOURS.toMillis(3);
        PrettyTimeSaver timeSaver = PrettyTimeSaver.create(start.toEpochMilli(), end.toEpochMilli(), step);
        assertEquals(start.toEpochMilli(), timeSaver.getStart());
        assertEquals(prettyStart.toEpochMilli(), timeSaver.getEnd());
        assertEquals(step, timeSaver.getStep());
    }

}
