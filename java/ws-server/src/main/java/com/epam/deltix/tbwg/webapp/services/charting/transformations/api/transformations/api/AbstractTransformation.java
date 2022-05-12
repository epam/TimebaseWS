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
package com.epam.deltix.tbwg.webapp.services.charting.transformations.api.transformations.api;

import com.epam.deltix.tbwg.webapp.services.charting.transformations.api.observers.TimerObserver;
import com.epam.deltix.tbwg.webapp.services.charting.transformations.api.observers.impl.OperatorObserver;
import com.epam.deltix.tbwg.webapp.services.charting.transformations.api.utils.TransformationUtils;
import io.reactivex.Observer;
import io.reactivex.disposables.Disposable;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Optional;

public abstract class AbstractTransformation<Downstream, Upstream> implements Transformation<Downstream, Upstream> {
    private static final Logger logger = LoggerFactory.getLogger(TransformationUtils.class);

    private Observer<? super Downstream> downstream;
    private Disposable disposable;

    private final Optional<TimerObserver> timerObserver = Optional.of(new TimerObserver() {
        @Override
        public void onSubscribe(Disposable d) {
        }

        @Override
        public void onNext(final Long time) {
            AbstractTransformation.this.onTimer(time);
        }

        @Override
        public void onError(Throwable e) {
            logger.warn(e.getMessage(), e);
        }

        @Override
        public void onComplete() {
        }
    });

    @Override
    public long applyOffset(long offset) {
        return offset;
    }

    @Override
    public long applyTimestamp(long timestamp) {
        return timestamp;
    }

    @Override
    final public Observer<? super Upstream> apply(Observer<? super Downstream> observer) throws Exception {
         final OperatorObserver<Downstream, Upstream> operatorObserver = new OperatorObserver<Downstream, Upstream>(observer) {
            @Override
            protected void onStart() {
                AbstractTransformation.this.downstream = downstream;
                AbstractTransformation.this.onStart();
            }

            @Override
            public void onNext(Upstream message) {
                AbstractTransformation.this.onNext(message);
            }

            @Override
            public void onComplete() {
                AbstractTransformation.this.onComplete();
            }

            @Override
            public void onError(Throwable e) {
                AbstractTransformation.this.onError(e);
            }
         };
         disposable = operatorObserver;
         return operatorObserver;
    }

    final protected void sendMessage(final Downstream message) {
        downstream.onNext(message);
    }

    final protected void sendError(final Throwable throwable) {
        disposable.dispose();
        downstream.onError(throwable);
    }

    final protected void complete() {
        disposable.dispose();
        downstream.onComplete();
    }

    final protected boolean isDisposed() {
        return disposable.isDisposed();
    }

    protected void onStart() {
    }

    abstract protected void onNext(final Upstream message);

    protected void onComplete() {
        downstream.onComplete();
    }

    protected void onError(final Throwable throwable) {
        downstream.onError(throwable);
    }

    protected void onTimer(long timestamp) {
    }

    @Override
    final public Optional<TimerObserver> getTimerObserver() {
        return timerObserver;
    }
}

