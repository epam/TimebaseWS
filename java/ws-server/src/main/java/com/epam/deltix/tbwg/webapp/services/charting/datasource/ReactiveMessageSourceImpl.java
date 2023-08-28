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

package com.epam.deltix.tbwg.webapp.services.charting.datasource;

import com.epam.deltix.timebase.messages.InstrumentMessage;
import io.reactivex.Observable;

import java.util.concurrent.atomic.AtomicBoolean;

public class ReactiveMessageSourceImpl implements ReactiveMessageSource {

    private final AtomicBoolean isRun = new AtomicBoolean();

    private final Runnable run;
    private final Observable<InstrumentMessage> observable;

    public ReactiveMessageSourceImpl(Runnable run, Observable<InstrumentMessage> observable) {
        this.run = run;
        this.observable = observable;
    }

    @Override
    public void run() {
        if (!isRun.compareAndSet(false, true)) {
            throw new IllegalStateException("Query already run");
        }

        run.run();
    }

    @Override
    public Observable<InstrumentMessage> getMessageSource() {
        return observable;
    }

    @Override
    public void close() {
    }
}
