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

package com.epam.deltix.tbwg.webapp.services.charting.provider;

import com.epam.deltix.gflog.api.Log;
import com.epam.deltix.gflog.api.LogFactory;
import com.epam.deltix.tbwg.webapp.config.ChartingConfiguration;
import com.epam.deltix.tbwg.webapp.services.charting.queries.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@Service
public class TimeBaseLinesProvider implements LinesProvider {

    private static final Log LOGGER = LogFactory.getLog(TimeBaseLinesProvider.class);

    private final ChartingConfiguration config;
    private final TransformationService transformationService;
    private final ExecutorService executor;

    @Autowired
    public TimeBaseLinesProvider(ChartingConfiguration config,
                                 TransformationService transformationService)
    {
        this.config = config;
        this.transformationService = transformationService;
        executor = Executors.newFixedThreadPool(config.getMaxPoolSize());
    }

    @Override
    public ChartingResult getLines(LinesQuery query) {
        LinesQueryResult transformation = transformationService.buildTransformationPlan(query);
        return new ChartingResultImpl(
            query, transformation, executor, config
        );
    }

}
