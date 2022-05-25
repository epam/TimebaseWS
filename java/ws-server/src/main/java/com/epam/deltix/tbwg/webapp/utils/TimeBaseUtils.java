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

import com.epam.deltix.qsrv.hf.pub.md.*;
import com.epam.deltix.qsrv.hf.tickdb.pub.DXTickStream;

import java.util.List;

public class TimeBaseUtils {

    public static RecordClassDescriptor[] introspectClasses(Class<?>... classes) {
        try {
            Introspector ix = Introspector.createEmptyMessageIntrospector();
            RecordClassDescriptor[] rcds = new RecordClassDescriptor[classes.length];
            for (int i = 0; i < classes.length; ++i) {
                rcds[i] = ix.introspectRecordClass(classes[i]);
            }
            return rcds;
        } catch (Throwable t) {
            throw new RuntimeException(t);
        }
    }

    public static long getEndTime(DXTickStream stream) {
        long[] range = stream.getTimeRange();
        return range != null ? range[1] : System.currentTimeMillis();
    }

    public static long getEndTime(DXTickStream[] streams) {
        long time = Long.MIN_VALUE;

        for (int i = 0; i < streams.length; i++) {
            long[] range = streams[i].getTimeRange();
            if (range != null)
                time = Math.max(time, range[1]);
        }

        return time;
    }

    public static long getEndTime(List<DXTickStream> streams) {
        long time = Long.MIN_VALUE;

        for (int i = 0; i < streams.size(); i++) {
            long[] range = streams.get(i).getTimeRange();
            if (range != null)
                time = Math.max(time, range[1]);
        }

        return time;
    }

}
