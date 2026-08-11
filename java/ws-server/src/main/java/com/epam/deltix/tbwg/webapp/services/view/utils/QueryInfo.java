/*
 * Copyright 2026 EPAM Systems, Inc
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
package com.epam.deltix.tbwg.webapp.services.view.utils;

import com.epam.deltix.gflog.api.Log;
import com.epam.deltix.gflog.api.LogFactory;
import com.epam.deltix.qsrv.hf.tickdb.lang.compiler.sem.Environment;
import com.epam.deltix.qsrv.hf.tickdb.lang.compiler.sem.TimeBaseEnvironment;
import com.epam.deltix.qsrv.hf.tickdb.lang.parser.QQLParser;
import com.epam.deltix.qsrv.hf.tickdb.lang.pub.*;
import com.epam.deltix.qsrv.hf.tickdb.pub.DXTickDB;
import com.epam.deltix.util.parsers.Element;
import com.epam.deltix.util.time.FixedInterval;
import com.epam.deltix.util.time.Interval;
import com.epam.deltix.util.time.TimeUnit;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

public class QueryInfo {

    private static final Log LOGGER = LogFactory.getLog(QueryInfo.class);

    private final List<String> sourceStreams;
    private final Interval timeInterval;
    private final boolean hasGroupByExpression;

    public QueryInfo(String query) {
        this(null, query);
    }

    public QueryInfo(DXTickDB db, String query) {
        Element element;
        try {
            element = QQLParser.parse(query, null);
        } catch (Exception e) {
            LOGGER.info().append("Failed to parse query:\n").append(e).commit();
            this.sourceStreams = new ArrayList<>();
            this.timeInterval = null;
            this.hasGroupByExpression = false;
            return;
        }

        Environment env = createEnv(db);
        this.sourceStreams = new ArrayList<>(extractStreams(env, element, new HashSet<>()));
        this.timeInterval = getTimeInterval(extractOverTimePeriod(element, null));
        this.hasGroupByExpression = getIsGroupByExpression(element);
    }

    private Environment createEnv(DXTickDB db) {
        if (db != null) {
            return new TimeBaseEnvironment(db, CompilerUtil.STDENV);
        }

        return CompilerUtil.STDENV;
    }

    public boolean isOverTime() {
        return timeInterval != null;
    }

    public Interval period() {
        return timeInterval;
    }

    public boolean hasGroupByExpression() {
        return hasGroupByExpression;
    }

    public List<String> sourceStreams() {
        return sourceStreams;
    }

    private Set<String> extractStreams(Environment env, Element element, Set<String> streams) {
        if (element instanceof SelectExpression) {
            SelectExpression selectExpression = (SelectExpression) element;
            extractStreamSource(env, selectExpression.getSource(), streams);
        } else if (element instanceof UnionExpression) {
            UnionExpression union = (UnionExpression) element;
            extractStreams(env, union.getLeft(), streams);
            extractStreams(env, union.getRight(), streams);
        }
        return streams;
    }

    private void extractStreamSource(Environment env, Expression source, Set<String> streams) {
        if (source instanceof Identifier) {
            Identifier streamId = (Identifier) source;
            streams.add(streamId.id);
        } else if (source instanceof StreamWithSpacesExpression) {
            StreamWithSpacesExpression sourceStream = (StreamWithSpacesExpression) source;
            Expression streamId = sourceStream.stream;
            if (streamId instanceof Identifier) {
                streams.add(((Identifier) streamId).id);
            }
        } else if (source instanceof UnionStreamsExpression) {
            UnionStreamsExpression unionStreamsExpression = (UnionStreamsExpression) source;
            for (Expression e : unionStreamsExpression.expressions) {
                extractStreamSource(env, e, streams);
            }
        } else if (source instanceof CallExpression) {
            CallExpression callExpression = (CallExpression) source;
            for (Expression arg : callExpression.args) {
                extractStreamSource(env, arg, streams);
            }
        } else {
            extractStreams(env, source, streams);
        }
    }

    private Long extractOverTimePeriod(Element element, Long currentPeriod) {
        if (element instanceof SelectExpression) {
            Long period = extractOverTimePeriod((SelectExpression) element, currentPeriod);
            return maxPeriod(period, currentPeriod);
        } else if (element instanceof UnionExpression) {
            UnionExpression union = (UnionExpression) element;
            Long p1 = extractOverTimePeriod(union.getLeft(), currentPeriod);
            Long p2 = extractOverTimePeriod(union.getRight(), currentPeriod);
            return maxPeriod(maxPeriod(p1, currentPeriod), maxPeriod(p2, currentPeriod));
        }

        return currentPeriod;
    }

    private Long extractOverTimePeriod(SelectExpression selectExpression, Long currentPeriod) {
        currentPeriod = maxPeriod(
            extractOverTimePeriod(selectExpression.getSource(), currentPeriod),
            currentPeriod
        );

        OverExpression overExpression = selectExpression.getOverExpression();
        if (overExpression instanceof OverTimeExpression) {
            OverTimeExpression overTimeExpression = (OverTimeExpression) overExpression;
            if (overTimeExpression.getTimeInterval() != null) {
                long period = overTimeExpression.getTimeInterval().getTimeStampMs();
                return maxPeriod(period, currentPeriod);
            }
        }

        return currentPeriod;
    }

    private Long maxPeriod(Long p1, Long p2) {
        if (p1 == null) {
            return p2;
        }
        if (p2 == null) {
            return p1;
        }
        return p1 > p2 ? p1 : p2;
    }

    private Interval getTimeInterval(Long intervalMs) {
        if (intervalMs == null) {
            return null;
        }

        return new FixedInterval(intervalMs, TimeUnit.MILLISECOND);
    }

    private boolean getIsGroupByExpression(Element element) {
        if (element instanceof SelectExpression) {
            return getIsGroupByExpression((SelectExpression) element);
        } else if (element instanceof UnionExpression) {
            UnionExpression union = (UnionExpression) element;
            return getIsGroupByExpression(union.getLeft()) ||
                getIsGroupByExpression(union.getRight());
        }

        return false;
    }

    private boolean getIsGroupByExpression(SelectExpression selectExpression) {
        boolean sourceGroupBy = getIsGroupByExpression(selectExpression.getSource());
        if (sourceGroupBy) {
            return true;
        }

        Expression[] groupBy = selectExpression.groupBy;
        if (groupBy == null || groupBy.length == 0) {
            return false;
        }
        if (groupBy.length == 1) {
            Expression e = groupBy[0];
            if (e instanceof Identifier) {
                Identifier id = (Identifier) e;
                if ("symbol".equalsIgnoreCase(unquote(id.id))) {
                    return false;
                }
                return true;
            }
        }
        return true;
    }

    private String unquote(String id) {
        if (id == null) {
            return null;
        }
        if (id.startsWith("\"") && id.endsWith("\"")) {
            return id.substring(1, id.length() - 1);
        }
        return id;
    }

}