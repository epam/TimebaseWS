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
package com.epam.deltix.tbwg.webapp.services.charting.queries;

import com.epam.deltix.tbwg.webapp.services.charting.TimeInterval;
import com.epam.deltix.tbwg.webapp.model.charting.ChartType;

public class QqlQueryImpl extends LinesQueryImpl implements QqlQuery {

    private final String qql;

    public QqlQueryImpl(String qql, ChartType type,
                        TimeInterval interval, int maxPointsCount, long pointInterval,
                        boolean isLive)
    {
        super(type, interval, maxPointsCount, pointInterval, isLive);
        this.qql = qql;
    }

    @Override
    public String getQql() {
        return qql;
    }

    @Override
    public String toString() {
        final StringBuffer sb = new StringBuffer("QqlQuery ");
        sb.append(qql).append("[");
        sb.append(interval).append('|');
        sb.append(type).append('|');
        sb.append(pointInterval);
        if (isLive) {
            sb.append("|live");
        }
        sb.append(']');
        return sb.toString();
    }
}
