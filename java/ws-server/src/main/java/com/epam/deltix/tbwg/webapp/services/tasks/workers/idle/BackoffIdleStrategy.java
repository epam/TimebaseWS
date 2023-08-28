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
package com.epam.deltix.tbwg.webapp.services.tasks.workers.idle;

import java.util.concurrent.locks.LockSupport;

@SuppressWarnings("unused")
abstract class BackoffIdleStrategyPrePad {
    @SuppressWarnings("unused")
    long p01, p02, p03, p04, p05, p06, p07, p08, p09, p10, p11, p12, p13, p14, p15;
}

abstract class BackoffIdleStrategyData extends BackoffIdleStrategyPrePad {

    protected static final int NOT_IDLE = 0;
    protected static final int SPINNING = 1;
    protected static final int YIELDING = 2;
    protected static final int PARKING = 3;

    protected final long maxSpins;
    protected final long maxYields;
    protected final long minParkPeriodNs;
    protected final long maxParkPeriodNs;

    protected int state = NOT_IDLE;
    protected long value;

    BackoffIdleStrategyData(
        final long maxSpins, final long maxYields, final long minParkPeriodNs, final long maxParkPeriodNs) {
        this.maxSpins = maxSpins;
        this.maxYields = maxYields;
        this.minParkPeriodNs = minParkPeriodNs;
        this.maxParkPeriodNs = maxParkPeriodNs;
    }
}

@SuppressWarnings("unused")
public final class BackoffIdleStrategy extends BackoffIdleStrategyData implements IdleStrategy {
    @SuppressWarnings("unused")
    long p01, p02, p03, p04, p05, p06, p07, p08, p09, p10, p11, p12, p13, p14, p15;

    public BackoffIdleStrategy() {
        this(1, 1, 50000, 1000000);
    }

    public BackoffIdleStrategy(long maxSpins, long maxYields, long minParkPeriodNs, long maxParkPeriodNs) {
        super(maxSpins, maxYields, minParkPeriodNs, maxParkPeriodNs);

        if ((minParkPeriodNs < 1) | (maxParkPeriodNs < minParkPeriodNs)) {
            throw new IllegalArgumentException("Min park period " + minParkPeriodNs + " < 1 or max park period " + maxParkPeriodNs + " < min");
        }
    }

    @Override
    public void idle(final int workCount) {
        if (workCount > 0) {
            reset();
        } else {
            idle();
        }
    }

    @Override
    public void idle() {
        switch (state) {
            case NOT_IDLE:
                value = 0;
                state = SPINNING;

            case SPINNING:
                if (++value <= maxSpins) {
                    break;
                }

                value = 0;
                state = YIELDING;

            case YIELDING:
                if (++value <= maxYields) {
                    Thread.yield();
                    break;
                }

                value = minParkPeriodNs;
                state = PARKING;

            case PARKING:
                LockSupport.parkNanos(value);
                value = Math.min(value << 1, maxParkPeriodNs);
        }
    }

    @Override
    public void reset() {
        state = NOT_IDLE;
    }

}
