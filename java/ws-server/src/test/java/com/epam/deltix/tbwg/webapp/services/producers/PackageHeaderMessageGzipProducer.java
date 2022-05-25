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
package com.epam.deltix.tbwg.webapp.services.producers;

import com.epam.deltix.tbwg.webapp.services.ChartingBaseTest;
import com.epam.deltix.tbwg.webapp.utils.DefaultTypeLoader;
import com.epam.deltix.timebase.messages.InstrumentMessage;
import com.epam.deltix.qsrv.hf.pub.MappingTypeLoader;
import com.epam.deltix.qsrv.hf.stream.MessageReader2;
import com.epam.deltix.timebase.messages.universal.PackageHeader;
import io.reactivex.Observable;
import io.reactivex.subjects.PublishSubject;
import lombok.SneakyThrows;

import java.io.File;
import java.util.Objects;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class PackageHeaderMessageGzipProducer implements MessageProducer {

    private final String filename;
    private final String packageHeaderClass;
    private final ExecutorService executorService = Executors.newSingleThreadExecutor();

    private final Runnable run;
    private final Observable<InstrumentMessage> observable;

    @SneakyThrows
    public PackageHeaderMessageGzipProducer(String filename, String packageHeaderClass) {
        this.filename = filename;
        this.packageHeaderClass = packageHeaderClass;

        File file = new File(Objects.requireNonNull(getClass().getClassLoader().getResource(ChartingBaseTest.RESOURCE_FOLDER_PREFIX + filename)).toURI());
        MappingTypeLoader typeLoader = new DefaultTypeLoader();
        typeLoader.bind(packageHeaderClass, PackageHeader.class);
        MessageReader2 reader = MessageReader2.create(file, typeLoader);

        PublishSubject<InstrumentMessage> subject = PublishSubject.create();
        observable = subject;
        run = () -> {
            while(reader.next()) {
                subject.onNext(reader.getMessage());
            }
            reader.close();
            subject.onComplete();
        };
    }

    public Runnable run() {
        return run;
    }

    @SneakyThrows
    @Override
    public Observable<InstrumentMessage> getObservable() {
        return observable;
    }
}
