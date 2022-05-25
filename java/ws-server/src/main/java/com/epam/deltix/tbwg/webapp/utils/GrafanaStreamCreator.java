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
package com.epam.deltix.tbwg.webapp.utils;

import com.epam.deltix.containers.AlphanumericUtils;
import com.epam.deltix.containers.generated.DoubleDoublePair;
import com.epam.deltix.dfp.Decimal;
import com.epam.deltix.gflog.api.Log;
import com.epam.deltix.gflog.api.LogFactory;
import com.epam.deltix.grafana.test.GrafanaTestEnum;
import com.epam.deltix.grafana.test.GrafanaTestMessage;
import com.epam.deltix.qsrv.hf.pub.md.Introspector;
import com.epam.deltix.qsrv.hf.pub.md.RecordClassDescriptor;
import com.epam.deltix.qsrv.hf.tickdb.pub.*;
import com.epam.deltix.util.annotations.Alphanumeric;
import com.epam.deltix.util.cmdline.DefaultApplication;

import java.util.HashMap;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.TimeUnit;

import static com.epam.deltix.dfp.Decimal64Utils.*;

public class GrafanaStreamCreator extends DefaultApplication {

    private static final Log LOG = LogFactory.getLog(GrafanaStreamCreator.class);

    private static final RecordClassDescriptor GRAFANA_TEST_RCD;

    static {
        try {
            GRAFANA_TEST_RCD = Introspector.createEmptyMessageIntrospector().introspectRecordClass(GrafanaTestMessage.class);
        } catch (Introspector.IntrospectionException e) {
            throw new RuntimeException(e);
        }
    }

    private final long duration;
    private final long step;
    private final String stream;

    private final Random random = new Random(System.currentTimeMillis());

    private final Map<GrafanaTestEnum, DoubleDoublePair> ranges = new HashMap<>();
    private final DoubleDoublePair delta = new DoubleDoublePair(0, 50);
    private final long[] currencies = new long[] {
            AlphanumericUtils.toAlphanumericUInt64("USD"),
            AlphanumericUtils.toAlphanumericUInt64("BTC"),
            AlphanumericUtils.toAlphanumericUInt64("ETH")
    };
    private final String[] symbols = new String[] {
            "SYMBOL1", "SYMBOL2", "SYMBOL3", "SYMBOL4"
    };
    private final String[] vendors = new String[] {
            "BINANCE", "HITBTC", "DERIBIT"
    };

    public GrafanaStreamCreator(String[] args) {
        super(args);
        this.duration = getLongArgValue("-d", TimeUnit.DAYS.toMillis(14));
        this.step = getLongArgValue("-i", TimeUnit.MILLISECONDS.toMillis(500));
        this.stream = getArgValue("-s", "GrafanaTestStream");
        ranges.put(GrafanaTestEnum.FIRST, new DoubleDoublePair(100, 200));
        ranges.put(GrafanaTestEnum.SECOND, new DoubleDoublePair(300, 400));
        ranges.put(GrafanaTestEnum.THIRD, new DoubleDoublePair(500, 600));
        ranges.put(GrafanaTestEnum.FOURTH, new DoubleDoublePair(700, 800));
    }

    public DXTickStream createGrafanaTestStream(DXTickDB db, String key) {
        DXTickStream stream = db.getStream(key);
        if (stream != null) {
            LOG.info().append("Deleting existing stream ").append(key).commit();
            stream.delete();
        }
        StreamOptions options = new StreamOptions(StreamScope.DURABLE, key, "", StreamOptions.MAX_DISTRIBUTION);
        options.setFixedType(GRAFANA_TEST_RCD);
        stream = db.createStream(key, options);
        LOG.info().append("Stream '").append(stream.getKey()).append("' successfully created.").commit();
        return stream;
    }

    public void loadMessages(DXTickStream stream) {
        long end = System.currentTimeMillis();
        long start = end - duration;
        GrafanaTestMessage grafanaTestMessage = new GrafanaTestMessage();
        long count = 0;
        try (TickLoader loader = stream.createLoader()) {
            for (long timestamp = start; timestamp <= end; timestamp += step) {
                fill(grafanaTestMessage, timestamp);
                loader.send(grafanaTestMessage);
                count++;
            }
        }
        LOG.info().append(count).append(" messages loaded to stream ").append(stream.getKey()).append(".").commit();
    }

    public void createAndLoad(DXTickDB db, String key) {
        DXTickStream stream = createGrafanaTestStream(db, key);
        loadMessages(stream);
    }

    private void fill(GrafanaTestMessage message, long timestamp) {
        message.setSymbol(symbol());
        message.setTimeStampMs(timestamp);

        message.setPriceType(priceType());
        fillPrices(message);
        message.setCurrency(currency());
        message.setVendor(vendor());
    }

    private String symbol() {
        return symbols[random.nextInt(symbols.length)];
    }

    private String vendor() {
        return vendors[random.nextInt(vendors.length)];
    }

    private GrafanaTestEnum priceType() {
        return GrafanaTestEnum.values()[random.nextInt(GrafanaTestEnum.values().length)];
    }

    @Alphanumeric
    private long currency() {
        return currencies[random.nextInt(currencies.length)];
    }

    @Decimal
    private long price(GrafanaTestEnum testEnum) {
        DoubleDoublePair range = ranges.get(testEnum);
        return fromDouble(range.getFirst() + (range.getSecond() - range.getFirst()) * random.nextDouble());
    }

    private void fillPrices(GrafanaTestMessage testMessage) {
        @Decimal long price = price(testMessage.getPriceType());
        @Decimal long highPrice = add(price, fromDouble(delta.getFirst() + (delta.getSecond() - delta.getFirst()) * random.nextDouble()));
        @Decimal long lowPrice = subtract(price, fromDouble(delta.getFirst() + (delta.getSecond() - delta.getFirst()) * random.nextDouble()));
        testMessage.setPrice(price);
        testMessage.setHighPrice(highPrice);
        testMessage.setLowPrice(lowPrice);
    }

    @Override
    protected void run() {
        try (DXTickDB db = TickDBFactory.openFromUrl("dxtick://localhost:8011", false)) {
            createAndLoad(db, stream);
        }
    }

    public static void main(String[] args) {
        new GrafanaStreamCreator(args).start();
    }
}
