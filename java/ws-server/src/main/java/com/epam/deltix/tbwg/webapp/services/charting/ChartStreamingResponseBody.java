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
package com.epam.deltix.tbwg.webapp.services.charting;

import com.epam.deltix.tbwg.webapp.services.charting.queries.ChartingResult;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.epam.deltix.gflog.api.Log;
import com.epam.deltix.gflog.api.LogFactory;
import com.epam.deltix.tbwg.webapp.model.charting.line.LineElementDef;
import com.epam.deltix.tbwg.webapp.services.charting.queries.LineResult;
import com.epam.deltix.tbwg.webapp.services.charting.queries.LinesQueryResult;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

import java.io.IOException;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeFormatterBuilder;
import java.util.ArrayList;
import java.util.List;

public class ChartStreamingResponseBody implements StreamingResponseBody {

    private static final Log LOGGER = LogFactory.getLog(ChartStreamingResponseBody.class);

    private static final DateTimeFormatter FORMATTER = new DateTimeFormatterBuilder().appendInstant(3).toFormatter();

    private final ChartingResult chartResult;

    public ChartStreamingResponseBody(ChartingResult chartResult) {
        this.chartResult = chartResult;
    }

    @Override
    public void writeTo(OutputStream outputStream) throws IOException {
        LinesQueryResult linesResult = chartResult.result();

        try (OutputStreamWriter writer = new OutputStreamWriter(outputStream)) {
            // start
            writer.append("[{");

            // name
            writer.append("\"name\":\"").append(linesResult.getName()).append("\"").append(',');

            // build lines
            List<List<StringBuilder>> lines = new ArrayList<>();
            for (LineResult lineResult : linesResult.getLines()) {
                List<StringBuilder> line = new ArrayList<>();
                lines.add(line);
                for (int i = 0; i < lineResult.linesCount(); ++i) {
                    line.add(new StringBuilder());
                }

                lineResult.getPoints().subscribe(message -> {
                    if (message instanceof LineElementDef) {
                        LineElementDef point = (LineElementDef) message;
                        int id = point.lineId();
                        if (id >= 0 && id < line.size()) {
                            StringBuilder sb = line.get(id);
                            if (sb.length() > 0) {
                                sb.append(",");
                            }

                            point.writeTo(sb);
                        }
                    }
                });
            }

            try {
                chartResult.run();
            } catch (Throwable t) {
                LOGGER.error().append("Failed to build chart result").append(t).commit();
                writer.append("\"error\":")
                    .append(new ObjectMapper().writeValueAsString(t.getMessage()))
                    .append(",");
            }

            // write lines
            writer.append("\"lines\":{");

            boolean lineComa = false;
            for (int i = 0; i < linesResult.getLines().size(); ++i) {
                LineResult lineResult = linesResult.getLines().get(i);
                List<StringBuilder> line = lines.get(i);

                for (int lineNum = 0; lineNum < line.size(); ++lineNum) {
                    if (lineComa) {
                        writer.append(",");
                    } else {
                        lineComa = true;
                    }

                    // write line
                    // line name
                    writer.append("\"").append(lineResult.getName().replace("[]", "[" + lineNum + "]")).append("\":");

                    // start line
                    writer.append("{");
                    {
                        // aggregation size
                        writer.append("\"aggregationSizeMs\":").append(String.valueOf(lineResult.getAggregation())).append(',');

                        // new window size
                        writer.append("\"newWindowSizeMs\":").append(String.valueOf(lineResult.getNewWindowSize())).append(',');

                        // points
                        writer.append("\"points\":");
                        writer.append("[");
                        writer.append(line.get(lineNum));
                        writer.append("]");
                    }
                    // end line
                    writer.append("}");
                }
            }

            // lines end
            writer.append("}");

            // effective window
            writer.append(",");
            writer.append("\"effectiveWindow\":");
            writer.append("{");
            writer.append("\"start\":\"").append(FORMATTER.format(linesResult.getInterval().getStartTime())).append("\"").append(",");
            writer.append("\"end\":\"").append(FORMATTER.format(linesResult.getInterval().getEndTime())).append("\"");
            writer.append("}");

            // end
            writer.append("}]");
        } finally {
            chartResult.close();
            flushOutput(outputStream);
        }
    }

    private void flushOutput(OutputStream outputStream) {
        try {
            outputStream.flush();
        } catch (IOException e) {
            LOGGER.warn().append("Failed to flush output chart stream").commit();
        }
    }

}
