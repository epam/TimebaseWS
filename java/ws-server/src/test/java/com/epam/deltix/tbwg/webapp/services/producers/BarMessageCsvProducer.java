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

import com.epam.deltix.tbwg.messages.BarMessage;
import com.epam.deltix.tbwg.webapp.services.ChartingBaseTest;
import com.epam.deltix.timebase.messages.InstrumentMessage;
import io.reactivex.Observable;
import io.reactivex.subjects.PublishSubject;
import org.junit.jupiter.api.Assertions;

import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.*;
import java.util.stream.Stream;

public class BarMessageCsvProducer implements MessageProducer {

    private final Runnable run;
    private final Observable<InstrumentMessage> observable;

    public BarMessageCsvProducer(String filename) {
        PublishSubject<InstrumentMessage> subject = PublishSubject.create();
        observable = subject;
        run = () -> {
            InputStream is = getClass().getClassLoader().getResourceAsStream(ChartingBaseTest.RESOURCE_FOLDER_PREFIX + filename);
            Assertions.assertNotNull(is, "Can't open file resources/" + ChartingBaseTest.RESOURCE_FOLDER_PREFIX + filename + " with messages");
            // todo try CSVXReader, but fastly it's don't work
            Scanner scanner = new Scanner(new InputStreamReader(is, StandardCharsets.UTF_8));
            String[] columnDescriptions = scanner.nextLine().split(",");
            Map<String, Integer> nameToColumnNumber = new HashMap<>();
            for (int i = 0; i < columnDescriptions.length; i++) {
                nameToColumnNumber.put(columnDescriptions[i], i);
            }

            Assertions.assertEquals(0, Stream.of("symbol", "timestamp", "BarMessage.open", "BarMessage.close", "BarMessage.high", "BarMessage.low", "BarMessage.volume")
                            .filter(column -> !nameToColumnNumber.containsKey(column))
                            .count(),
                    "Can't find one of BarMessage field in csv file");

            BarMessage message = new BarMessage();
            while (scanner.hasNextLine()) {
                String line = scanner.nextLine();
                String[] columns = line.split(",");
                message.setSymbol(columns[nameToColumnNumber.get("symbol")]);
                message.setTimeStampMs(Instant.parse(columns[nameToColumnNumber.get("timestamp")]).toEpochMilli());
                message.setOpen(Double.parseDouble(columns[nameToColumnNumber.get("BarMessage.open")]));
                message.setClose(Double.parseDouble(columns[nameToColumnNumber.get("BarMessage.close")]));
                message.setHigh(Double.parseDouble(columns[nameToColumnNumber.get("BarMessage.high")]));
                message.setLow(Double.parseDouble(columns[nameToColumnNumber.get("BarMessage.low")]));
                message.setVolume(Double.parseDouble(columns[nameToColumnNumber.get("BarMessage.volume")]));
                subject.onNext(message);
            }
            scanner.close();
            subject.onComplete();
        };
    }

    @Override
    public Runnable run() {
        return run;
    }

    @Override
    public Observable<InstrumentMessage> getObservable() {
        return observable;
    }

}
