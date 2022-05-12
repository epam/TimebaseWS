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
package com.epam.deltix.tbwg.webapp.services.charting.transformations.api.observers.impl;

import com.epam.deltix.tbwg.webapp.services.charting.transformations.api.observers.TimerObserver;
import io.reactivex.observers.DisposableObserver;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.HashSet;
import java.util.Set;
import java.util.function.Consumer;

public class TimerObserverImpl extends DisposableObserver<Long> implements TimerObserver {
    private static final Logger logger = LoggerFactory.getLogger(TimerObserverImpl.class);
    private Set<Consumer<Long>> consumers = new HashSet<>();

    @Override
    public void onNext(Long aLong) {
        consumers.forEach(x -> x.accept(aLong));
    }

    @Override
    public void onError(Throwable e) {
        logger.error(e.getMessage(), e);
    }

    @Override
    public void onComplete() {
    }

    public boolean add(Consumer<Long> runnable) {
        return consumers.add(runnable);
    }

    public boolean remove(Consumer<Long> runnable) {
        return consumers.remove(runnable);
    }
}
