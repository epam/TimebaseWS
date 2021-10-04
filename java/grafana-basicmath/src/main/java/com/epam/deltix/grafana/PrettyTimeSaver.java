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

import com.epam.deltix.computations.data.base.GenericValueInfo;

/**
 * Implementation of {@link TimeSaver}, that cuts whole interval on pretty intervals
 * according to time step and time range.
 */
public class PrettyTimeSaver implements TimeSaver {

    private static final long MILLISECOND = 1000;
    private static final long SECOND = 1000;
    private static final long MINUTE = SECOND * 60;
    private static final long HOUR = MINUTE * 60;
    private static final long DAY = HOUR * 24;

    private long step = GenericValueInfo.TIMESTAMP_NULL;
    private long start = GenericValueInfo.TIMESTAMP_NULL;
    private long end = GenericValueInfo.TIMESTAMP_NULL;
    private long last = GenericValueInfo.TIMESTAMP_NULL;
    private long ready = GenericValueInfo.TIMESTAMP_NULL;

    private PrettyTimeSaver(long start, long end, long step) {
        this.start = start;
        this.end = end;
        this.step = step;
    }

    public static PrettyTimeSaver create(long globalStart, long globalEnd, long step) {
        assert step > 0 && globalEnd - globalStart >= step;
        if (globalEnd - globalStart <= step) {
            return new PrettyTimeSaver(globalStart, globalEnd, step);
        }
        long nearest = nearest(globalStart, globalEnd, step);
        if (nearest == globalStart) {
            return new PrettyTimeSaver(globalStart - step, globalStart, step);
        } else if (nearest > globalEnd) {
            return new PrettyTimeSaver(globalStart, globalStart + step, step);
        } else {
            return new PrettyTimeSaver(globalStart, nearest, step);
        }
    }

    @Override
    public boolean put(long timestamp) {
        last = timestamp;
        if (timestamp > end) {
            ready = end;
            long d = (timestamp - end - 1) / step;
            start = end + step * d;
            end = end + step * (d + 1);
            return true;
        }
        return false;
    }

    @Override
    public long getStart() {
        return start;
    }

    @Override
    public long getEnd() {
        return end;
    }

    @Override
    public long getStep() {
        return step;
    }

    @Override
    public long getLast() {
        return last;
    }

    @Override
    public long getReadyTimestamp() {
        return ready;
    }

    private static boolean isSeconds(long step) {
        return step % SECOND == 0;
    }

    private static boolean isMinutes(long step) {
        return step % MINUTE == 0;
    }

    private static boolean isHours(long step) {
        return step % HOUR == 0;
    }

    private static long nearestStartOfHour(long start, long end, long interval) {
        return nearest(start, end, interval, HOUR, DAY);
    }

    private static long nearestStartOfMinute(long start, long end, long interval) {
        return nearest(start, end, interval, MINUTE, HOUR);
    }

    private static long nearestStartOfSecond(long start, long end, long interval) {
        return nearest(start, end, interval, SECOND, MINUTE);
    }

    private static long nearest(long timestamp, long interval) {
        long d = timestamp % interval;
        return d == 0 ? timestamp: timestamp - d + interval;
    }

    private static long nearest(long start, long end, long interval, long baseStep, long largerStep) {
        if (largerStep % interval == 0) {
            long nearest = nearest(start, interval);
            if (nearest <= end) {
                return nearest;
            }
        }
        return nearest(start, baseStep);
    }

    private static long nearest(long start, long end, long interval) {
        if (isHours(interval)) {
            return nearest(start, end, interval, HOUR, DAY);
        } else if (isMinutes(interval)) {
            return nearest(start, end, interval, MINUTE, HOUR);
        } else if (isSeconds(interval)) {
            return nearest(start, end, interval, SECOND, MINUTE);
        } else {
            return nearest(start, end, interval, MILLISECOND, SECOND);
        }
    }
}
