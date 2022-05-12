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
package com.epam.deltix.tbwg.webapp.services;

import com.epam.deltix.tbwg.webapp.controllers.TimebaseController;
import com.epam.deltix.tbwg.webapp.services.timebase.TimebaseService;
import com.epam.deltix.dfp.Decimal64Utils;
import com.epam.deltix.gflog.api.Log;
import com.epam.deltix.gflog.api.LogFactory;
import com.epam.deltix.timebase.messages.InstrumentMessage;
import com.epam.deltix.qsrv.hf.pub.RawMessage;
import com.epam.deltix.qsrv.hf.tickdb.pub.DXTickStream;
import com.epam.deltix.qsrv.hf.tickdb.pub.RawMessageHelper;
import com.epam.deltix.qsrv.hf.tickdb.pub.SelectionOptions;
import com.epam.deltix.qsrv.hf.tickdb.pub.TickCursor;
import com.epam.deltix.tbwg.webapp.model.smd.InstrumentDef;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@Service
public class InstrumentsServiceImpl implements InstrumentsService {

    private static final Log LOGGER = LogFactory.getLog(TimebaseController.class);

    @Value("${instrumentsService.securitiesStream:securities}")
    private String securitiesStreamName;

    @Value("${instrumentsService.deltixSymbolField:deltixSymbol}")
    private String deltixSymbolField;

    @Value("${instrumentsService.smiUrl:https://smi.deltixhub.com}")
    private String smiUrl;

    private final TimebaseService timebase;
    private final RestTemplate restTemplate = new RestTemplate();
    private final ExecutorService refreshInstrumentsExecutor = Executors.newSingleThreadExecutor();
    private final RawMessageHelper rawMessageHelper = new RawMessageHelper();
    private final Map<String, InstrumentDef> instrumentsDefCache = new ConcurrentHashMap<>();

    private volatile Map<String, String> instrumentsMapping = new HashMap<>();

    public static class SymbolResponse {
        public String symbol;
        public String vendorName;
        public String baseCurrencyAlphanumeric;
        public String currencyAlphanumeric;
        public String orderPricePrecision;
        public String orderSizePrecision;
    }

    public InstrumentsServiceImpl(TimebaseService timebase) {
        this.timebase = timebase;
    }

    @Scheduled(fixedDelayString = "${instrumentsService.reload-securities-ms:30000}")
    public void reload() {
        refreshInstrumentsExecutor.submit(this::fetchInstrumentsMappingTask);
    }

    @Scheduled(fixedDelayString = "${instrumentsService.invalidate-smd-cache-ms:1800000}")
    public void invalidateCache() {
        instrumentsDefCache.clear();
    }

    private void fetchInstrumentsMappingTask() {
        DXTickStream stream = timebase.getConnection().getStream(securitiesStreamName);
        if (stream != null) {
            Map<String, String> newInstrumentsMapping = new HashMap<>();
            try (TickCursor cursor = stream.select(Long.MIN_VALUE, new SelectionOptions(true, false))) {
                while (cursor.next()) {
                    InstrumentMessage instrumentMessage = cursor.getMessage();
                    if (instrumentMessage instanceof RawMessage) {
                        RawMessage message = (RawMessage) instrumentMessage;
                        Object value = rawMessageHelper.getValue(message, deltixSymbolField, null);
                        if (value instanceof CharSequence) {
                            newInstrumentsMapping.put(message.getSymbol().toString(), value.toString());
                        }
                    }
                }
            } catch (Throwable t) {
                LOGGER.error().append("Failed to read " + securitiesStreamName + " stream").append(t).commit();
            } finally {
                instrumentsMapping = newInstrumentsMapping;
            }
        }
    }

    @Override
    public InstrumentDef getInstrument(String name, Set<String> hiddenExchanges) {
        InstrumentDef instrumentDef = instrumentsDefCache.get(name);
        if (instrumentDef != null) {
            return instrumentDef;
        }

        try {
            String deltixName = instrumentsMapping.get(name);
            if (deltixName == null) {
                deltixName = name;
            }

            ResponseEntity<SymbolResponse[]> response = restTemplate.getForEntity(
                smiUrl + "/api/v1/symbols?vendorStatus=LISTED&symbol=" + deltixName,
                SymbolResponse[].class
            );
            SymbolResponse[] instruments = response.getBody();

            instrumentDef = new InstrumentDef();
            instrumentDef.setName(name);
            if (instruments != null) {
                for (int i = 0; i < instruments.length; ++i) {
                    fillInstrumentDef(
                        hiddenExchanges, instrumentDef, instruments[i].vendorName,
                        instruments[i].baseCurrencyAlphanumeric, instruments[i].currencyAlphanumeric,
                        instruments[i].orderPricePrecision != null ? Decimal64Utils.parse(instruments[i].orderPricePrecision) : Decimal64Utils.NULL,
                        instruments[i].orderSizePrecision != null ? Decimal64Utils.parse(instruments[i].orderSizePrecision) : Decimal64Utils.NULL
                    );
                }
            }

            instrumentsDefCache.put(name, instrumentDef);

            return instrumentDef;
        } catch (Throwable t) {
            LOGGER.error().append("Failed to query instrument").append(t).commit();
            return new InstrumentDef();
        }
    }

    private void fillInstrumentDef(Set<String> hiddenExchanges, InstrumentDef instrumentDef, CharSequence vendorName,
                                   CharSequence baseCurrency, CharSequence termCurrency,
                                   long orderPricePrecision, long orderSizePrecision)
    {
        if (vendorName != null && hiddenExchanges.contains(vendorName.toString())) {
            return;
        }

        if (instrumentDef.getBaseCurrency() == null && baseCurrency != null) {
            instrumentDef.setBaseCurrency(baseCurrency.toString());
        }
        if (instrumentDef.getTermCurrency() == null && termCurrency != null) {
            instrumentDef.setTermCurrency(termCurrency.toString());
        }

        if (!Decimal64Utils.isNaN(orderPricePrecision) && !Decimal64Utils.isNull(orderPricePrecision)) {
            long pricePrecision = orderPricePrecision;
            if (instrumentDef.getPricePrecision() != null) {
                pricePrecision = getMinPrecision(
                    Decimal64Utils.parse(instrumentDef.getPricePrecision()), orderPricePrecision
                );
            }
            instrumentDef.setPricePrecision(Decimal64Utils.toString(pricePrecision));
        }

        if (!Decimal64Utils.isNaN(orderSizePrecision) && !Decimal64Utils.isNull(orderSizePrecision)) {
            long sizePrecision = orderSizePrecision;
            if (instrumentDef.getSizePrecision() != null) {
                sizePrecision = getMinPrecision(
                    Decimal64Utils.parse(instrumentDef.getSizePrecision()), orderSizePrecision
                );
            }
            instrumentDef.setSizePrecision(Decimal64Utils.toString(sizePrecision));
        }
    }

    private static long getMinPrecision(long p1, long p2) {
        boolean b1 = isBetween0To1(p1);
        boolean b2 = isBetween0To1(p2);
        if (b1 == b2) {
            return Decimal64Utils.min(p1, p2);
        } else {
            return b1 ? p1 : p2;
        }
    }

    private static boolean isBetween0To1(long value) {
        return Decimal64Utils.isGreater(value, Decimal64Utils.ZERO) && Decimal64Utils.isLess(value, Decimal64Utils.ONE);
    }

}
