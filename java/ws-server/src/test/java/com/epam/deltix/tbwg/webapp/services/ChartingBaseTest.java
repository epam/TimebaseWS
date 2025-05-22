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
package com.epam.deltix.tbwg.webapp.services;

import com.epam.deltix.tbwg.messages.BarMessage;
import com.epam.deltix.tbwg.webapp.Application;
import com.epam.deltix.gflog.api.Log;
import com.epam.deltix.gflog.api.LogFactory;
import com.epam.deltix.qsrv.hf.pub.md.Introspector;
import com.epam.deltix.qsrv.hf.pub.md.RecordClassDescriptor;
import com.epam.deltix.qsrv.hf.pub.md.RecordClassSet;
import com.epam.deltix.tbwg.webapp.interceptors.TimebaseLoginInterceptor;
import com.epam.deltix.tbwg.webapp.model.L2PackageHeader;
import com.epam.deltix.tbwg.webapp.model.charting.ChartType;
import com.epam.deltix.tbwg.webapp.model.charting.ChartingFrameDto;
import com.epam.deltix.tbwg.webapp.services.charting.TimeInterval;
import com.epam.deltix.tbwg.webapp.services.charting.datasource.MessageSourceFactory;
import com.epam.deltix.tbwg.webapp.services.charting.datasource.ReactiveMessageSource;
import com.epam.deltix.tbwg.webapp.services.charting.datasource.ReactiveMessageSourceImpl;
import com.epam.deltix.tbwg.webapp.services.charting.queries.BookSymbolQueryImpl;
import com.epam.deltix.tbwg.webapp.services.producers.MessageProducer;
import com.epam.deltix.tbwg.webapp.services.timebase.TimebaseService;
import com.epam.deltix.tbwg.webapp.utils.ApiKeyUtils;
import lombok.SneakyThrows;
import org.junit.Before;
import org.junit.jupiter.api.Assertions;
import org.junit.runner.RunWith;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.junit4.SpringRunner;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Arrays;
import java.util.Scanner;

import static com.epam.deltix.tbwg.webapp.utils.BordersTimeBarChartsUtils.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@RunWith(SpringRunner.class)
@SpringBootTest(classes = Application.class, webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("testCharting")
@AutoConfigureMockMvc
public abstract class ChartingBaseTest {

    public static final long MINUTE_MILLIS = 60 * 1000L;
    public static final long HOUR_MILLIS = 60 * MINUTE_MILLIS;
    public static final long DAY_MILLIS = 24 * HOUR_MILLIS;
    public static final long WEEK_MILLIS = 7 * DAY_MILLIS;
    public static final long MONTH_MILLIS = 30 * DAY_MILLIS;
    public static final long QUARTER_MILLIS = 90 * DAY_MILLIS;
    public static final long YEAR_MILLIS = 365 * DAY_MILLIS;
    public static final String RESOURCE_FOLDER_PREFIX = "charting/";

    private static final String TEST_API_KEY = "TEST_API_KEY";
    private static final String TEST_API_SECRET = "TEST_API_SECRET";
    private static final String TEST_STREAM = "testStream";
    private static final String TEST_SYMBOL = "testSymbol";

    //todo
//    private final boolean UPDATE_TESTS = true;

    private static final Log LOG = LogFactory.getLog(ChartingBaseTest.class);

    @Value("${local.server.port}")
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;
    @Autowired
    private MockMvc mockMvc;

    @Autowired
    MessageSourceFactory messageSourceFactory;

    @MockBean
    TimebaseService timebaseService;

    @SpyBean
    TimebaseLoginInterceptor loginInterceptor;

    @Mock
    private BookSymbolQueryImpl bookSymbolQuery;

    @Before
    public void before() {
        // Configure the spy TimebaseLoginInterceptor,
        // since we need its main functionality, but we stub the methods since the login and logout calls may overlap
        // with other stub methods of the timebase server
        doReturn(true).when(loginInterceptor).preHandle(any(), any(), any());
        doNothing().when(loginInterceptor).afterCompletion(any(), any(), any(), any());

        // Reset the MockMvc instance to use the mock TimebaseLoginInterceptor
        mockMvc = MockMvcBuilders.standaloneSetup(timebaseService)
                .addInterceptors(loginInterceptor)
                .build();
    }

    @SneakyThrows
    public void setUp(long pointInterval, Instant startTime, Instant endTime, MessageType messageType,
                      ChartType chartType, MessageProducer messageProducer, String[] symbols)
    {
        if (messageType == MessageType.BAR_MESSAGE) {
            doReturn(new RecordClassSet(new RecordClassDescriptor[]{
                    Introspector.createEmptyMessageIntrospector().introspectRecordClass(BarMessage.class)
            })).when(timebaseService).getStreamMetadata(any());
        } else if (messageType == MessageType.PACKAGE_HEADER) {
            doReturn(new RecordClassSet(new RecordClassDescriptor[]{
                    Introspector.createEmptyMessageIntrospector().introspectRecordClass(L2PackageHeader.class)
            })).when(timebaseService).getStreamMetadata(any());
        }
//        else if (messageType == MessageType.BEST_BID_OFFER) {
//            doReturn(new RecordClassSet(new RecordClassDescriptor[]{
//                    Introspector.createEmptyMessageIntrospector().introspectRecordClass(BestBidOfferMessage.class)
//            })).when(timebaseService).getStreamMetadata(any());
//        }

        Mockito.when(bookSymbolQuery.getType()).thenReturn(chartType);
        Mockito.when(bookSymbolQuery.getPointInterval()).thenReturn(pointInterval);
        if (isDynamicBar(pointInterval)) {
            Mockito.when(bookSymbolQuery.getInterval())
                    .thenReturn(new TimeInterval(toBeginOfPeriod(startTime, pointInterval, true),
                            toEndOfPeriod(endTime, pointInterval, true)));
        } else {
            Mockito.when(bookSymbolQuery.getInterval())
                    .thenReturn(new TimeInterval(startTime.toEpochMilli() - (startTime.toEpochMilli() % pointInterval) + 1,
                            endTime.toEpochMilli() - (endTime.toEpochMilli() % pointInterval) + pointInterval));
        }
        Mockito.when(bookSymbolQuery.getStream()).thenReturn(TEST_STREAM);
        Mockito.when(bookSymbolQuery.getSymbols()).thenReturn(symbols);

        ReactiveMessageSource reactiveMessageSource = new ReactiveMessageSourceImpl(messageProducer, messageProducer.getObservable());
        Mockito.when(messageSourceFactory.buildSource(any(), any(), anyBoolean(), anyBoolean())).thenReturn(reactiveMessageSource);
        Mockito.when(messageSourceFactory.buildSource(any(), any(), anySet(), any(), anyBoolean(), anyBoolean())).thenReturn(reactiveMessageSource);
    }

    public long runTestFullResponseCheck(long pointInterval, Instant startTime, Instant endTime, String resultFilename,
                                         MessageType messageType, ChartType chartType, MessageProducer messageProducer) {
        return runTestFullResponseCheck(pointInterval, startTime, endTime, resultFilename, messageType, chartType, messageProducer, TEST_SYMBOL);
    }

    @SneakyThrows
    public long runTestFullResponseCheck(long pointInterval, Instant startTime, Instant endTime, String resultFilename,
                                         MessageType messageType, ChartType chartType, MessageProducer messageProducer,
                                         String symbol) {
        return runTestFullResponseCheck(pointInterval, startTime, endTime, resultFilename, messageType, chartType,
                messageProducer, new String[]{symbol});
    }

    @SneakyThrows
    public long runTestFullResponseCheck(long pointInterval, Instant startTime, Instant endTime, String resultFilename,
                                         MessageType messageType, ChartType chartType, MessageProducer messageProducer,
                                         String[] symbols) {
        setUp(pointInterval, startTime, endTime, messageType, chartType, messageProducer, symbols);
        UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl("http://localhost:" + port + "/api/v0/charting/dx/" + TEST_STREAM)
                .queryParam("startTime", startTime)
                .queryParam("endTime", endTime)
                .queryParam("pointInterval", pointInterval)
                .queryParam("type", chartType)
                .queryParam("symbols", Arrays.asList(symbols))
                .queryParam("correlationId", System.currentTimeMillis());

        long startTimestamp = System.currentTimeMillis();
        ResponseEntity<String> stringResponseEntity = ApiKeyUtils.signedRest(restTemplate.getRestTemplate(), HttpMethod.GET,
                //because UriComponentsBuilder comfortable to use, but without http://localhost: + port it fails, but with this prefix auth fails
                builder.toUriString().replaceFirst("http://localhost:" + port, ""), String.class, TEST_API_KEY, TEST_API_SECRET);
        String result = stringResponseEntity
                .getBody();
        long endTimestamp = System.currentTimeMillis();
        LOG.info("Request execution time: " + (endTimestamp - startTimestamp) + "ms");

        Assertions.assertNotNull(result);
        String expectedResult = readResultFromFile(resultFilename);

//        if (expectedResult != result && UPDATE_TESTS) {
//            //todo update resultFilename
//        }

        Assertions.assertEquals(removeUselessSymbols(expectedResult), removeUselessSymbols(result), "Check is result same us expected");
        return endTimestamp - startTimestamp;
    }

    public long runTestCheckCountOfPoints(long pointInterval, Instant startTime, Instant endTime, MessageType messageType,
                                          ChartType chartType, long countOfPoints, MessageProducer messageProducer) {
        return runTestCheckCountOfPoints(pointInterval, startTime, endTime, messageType, chartType, countOfPoints, messageProducer, true);
    }

    public long runTestCheckCountOfPoints(long pointInterval, Instant startTime, Instant endTime, MessageType messageType,
                                          ChartType chartType, long countOfPoints, MessageProducer messageProducer, boolean logTime) {
        setUp(pointInterval, startTime, endTime, messageType, chartType, messageProducer, new String[]{TEST_SYMBOL});
        UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl("http://localhost:" + port + "/api/v0/charting/dx/" + TEST_STREAM)
                .queryParam("startTime", startTime)
                .queryParam("endTime", endTime)
                .queryParam("pointInterval", pointInterval)
                .queryParam("symbols", TEST_SYMBOL)
                .queryParam("type", chartType)
                .queryParam("correlationId", System.currentTimeMillis());

        long startTimestamp = System.currentTimeMillis();
        ChartingFrameDto[] result = ApiKeyUtils.signedRest(restTemplate.getRestTemplate(), HttpMethod.GET,
                        //because UriComponentsBuilder comfortable to use, but without http://localhost: + port it fails, but with this prefix auth fails
                        builder.toUriString().replaceFirst("http://localhost:" + port, ""), ChartingFrameDto[].class, TEST_API_KEY, TEST_API_SECRET)
                .getBody();
        long endTimestamp = System.currentTimeMillis();
        if (logTime) {
            LOG.info("Request execution time: " + (endTimestamp - startTimestamp) + "ms");
        }

        Assertions.assertNotNull(result);
        Assertions.assertEquals(1, result.length, "Result should have only one ChartingFrameDef");
        if (chartType == ChartType.BARS) {
            Assertions.assertEquals(countOfPoints, result[0].getLines().get(TEST_SYMBOL + "_BARS").getPoints().size(),
                    "Count of points are different startTime = " + startTime + " endTime = " + endTime);
        } else if (chartType == ChartType.PRICE_LEVELS) {
            Assertions.assertEquals(countOfPoints, result[0].getLines().get(TEST_SYMBOL + "_TRADES").getPoints().size(),
                    "Count of points are different startTime = " + startTime + " endTime = " + endTime);
        } else if (chartType == ChartType.TRADES_BBO) {
            Assertions.assertEquals(countOfPoints, result[0].getLines().get(TEST_SYMBOL + "_BBO").getPoints().size(),
                    "Count of points are different startTime = " + startTime + " endTime = " + endTime);
        }
        return endTimestamp - startTimestamp;
    }

    private String readResultFromFile(String filename) {
        InputStream is = getClass().getClassLoader().getResourceAsStream(RESOURCE_FOLDER_PREFIX + filename);
        Assertions.assertNotNull(is, "Can't open file resources/" + RESOURCE_FOLDER_PREFIX + filename + " with response json");
        Scanner scanner = new Scanner(new InputStreamReader(is, StandardCharsets.UTF_8));
        StringBuilder result = new StringBuilder();
        while (scanner.hasNextLine()) {
            result.append(scanner.nextLine());
        }

        return result.toString();
    }

    private String removeUselessSymbols(String s) {
        s = s.replace(" ", "");
        s = s.replace("\n", "");

        s = s.replace(",", ",\n");
        s = s.replace("{", "{\n");
        s = s.replace("[", "[\n");
        s = s.replace("}", "}\n");
        s = s.replace("]", "]\n");
        return s;
    }

    public enum MessageType {
        PACKAGE_HEADER,
        BEST_BID_OFFER,
        BAR_MESSAGE
    }
}