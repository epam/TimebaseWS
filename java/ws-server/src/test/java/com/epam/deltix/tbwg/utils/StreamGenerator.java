package com.epam.deltix.tbwg.utils;

import com.epam.deltix.qsrv.hf.tickdb.pub.*;

import java.util.Random;

/**
 * @author Daniil Yarmalkevich
 * Date: 8/19/2019
 */
public class StreamGenerator {

    private static final Random RANDOM = new Random(System.currentTimeMillis());

    public static void main(String[] args) {
        try (DXTickDB db = TickDBFactory.createFromUrl("dxtick://localhost:8011")) {
            db.open(false);
            loadBars(10000, "garafana", db);
        }
    }

    public static void loadBars(int total, String key, DXTickDB db) {

//        DXTickStream stream = db.getStream(key);
//        if (stream == null) {
//            StreamOptions options = new StreamOptions (StreamScope.DURABLE, key, null, 0);
//            options.setFixedType(StreamConfigurationHelper.mkUniversalBarMessageDescriptor());
//            stream = db.createStream(options.name, options);
//        } else {
//            stream.clear();
//        }
//
//        long interval = 1000;
//        long timestamp = System.currentTimeMillis() - total * interval;
//
//        double price = 9000.;
//
//        try (TickLoader loader = stream.createLoader()) {
//            for (int i = 0; i < total; i++) {
//                loader.send(createBar(price, timestamp += interval, getSymbol()));
//            }
//        }
    }

    private static String getSymbol(String ... symbols) {
        if (symbols.length == 0) {
            return "TEST";
        }
        return symbols[RANDOM.nextInt(symbols.length)];
    }

    public static void loadBarsLive(long interval, int total, String key, DXTickDB db, String ... symbols) {
//        DXTickStream stream = db.getStream(key);
//        if (stream == null) {
//            StreamOptions options = new StreamOptions (StreamScope.DURABLE, key, null, 0);
//            options.setFixedType(StreamConfigurationHelper.mkUniversalBarMessageDescriptor());
//            stream = db.createStream(options.name, options);
//        }
//
//        double price = 9000.;
//
//        try (TickLoader loader = stream.createLoader()) {
//            for (int i = 0; i < total; i++) {
//                long time = System.currentTimeMillis();
//                loader.send(createBar(price, time, getSymbol(symbols)));
//                try {
//                    Thread.sleep(interval);
//                } catch (InterruptedException ignored) {
//                }
//            }
//        }
    }

//    public static BarMessage createBar(double price, long timestamp, String symbol) {
//        BarMessage barMessage = new BarMessage();
//        barMessage.setSymbol(symbol);
//        barMessage.setInstrumentType(InstrumentType.EQUITY);
//        barMessage.setTimeStampMs(timestamp);
//
//        barMessage.setExchangeId(1);
//
//        double d1 = RANDOM.nextDouble() * 100;
//        double d2 = d1 / 2;
//        barMessage.setHigh(price + d1);
//        barMessage.setLow(price - d1);
//        if (RANDOM.nextBoolean()) {
//            barMessage.setOpen(price + d2);
//            barMessage.setClose(price - d2);
//        } else {
//            barMessage.setOpen(price - d2);
//            barMessage.setClose(price + d2);
//        }
//        barMessage.setVolume(RANDOM.nextDouble() * 1000);
//        return barMessage;
//    }

}
