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
package com.epam.deltix.tbwg.config;

import com.epam.deltix.gflog.api.*;
import com.epam.deltix.gflog.core.*;

import com.epam.deltix.gflog.core.appender.Appender;
import com.epam.deltix.gflog.core.appender.ConsoleAppenderFactory;
import com.epam.deltix.gflog.core.service.AsyncLogServiceFactory;
import com.epam.deltix.gflog.core.service.OverflowStrategy;
import com.epam.deltix.gflog.jul.JulBridge;
import org.springframework.core.io.ClassPathResource;

import java.io.File;
import java.util.Properties;

public class LogConfigurer {

    public static void configureLogging(String appName) {
        System.setProperty("org.springframework.boot.logging.LoggingSystem", "none"); // disables Spring Logging System, so we solely rely on GF Log

        LogConfig config = loadLogConfig(appName);
        if (config == null) {
            config = loadDefaultFromResources();
        }
        if (config == null) {
            config = createConsoleLogConfig();
        }

        LogConfigurator.configure(config);
    }

    private static LogConfig createConsoleLogConfig() {
        final LogConfig config = new LogConfig();

        final AsyncLogServiceFactory logServiceFactory = new AsyncLogServiceFactory();
        logServiceFactory.setOverflowStrategy(OverflowStrategy.DISCARD);

        final Appender appender = new ConsoleAppenderFactory().create();
        final Logger rootLogger = new Logger(LogLevel.INFO, appender);

        config.setService(logServiceFactory);
        config.addAppender(appender);
        config.addLogger(rootLogger);

        config.conclude();
        return config;
    }

    private static LogConfig loadDefaultFromResources() {
        try {
            ClassPathResource resource = new ClassPathResource("gflog-default.xml");
            return LogConfigFactory.load(resource.getInputStream());
        } catch (Throwable th) {
            LogDebug.warn(th);
        }
        return null;
    }

    private static LogConfig loadLogConfig(final String appName) {
        LogConfig config = null;

        final Properties substitution = System.getProperties();
        substitution.put("app.name", appName);

        if (LogConfigFactory.CONFIG != null) {
            try {
                config = LogConfigFactory.load(LogConfigFactory.CONFIG, substitution);
            } catch (final Throwable e) {
                LogDebug.warn("Can't load GFLog config from gflog.config (" + LogConfigFactory.CONFIG + "): " + e.getMessage());
            }
        }

        if (config == null) {
            final File configFile = new File(System.getProperty("user.dir"), "gflog.xml");

            try {
                if (configFile.exists()) {
                    config = LogConfigFactory.load(configFile, substitution);
                }
            } catch (final Throwable e) {
                LogDebug.warn("Can't load GFLog config from user.dir (" + configFile + "): " + e.getMessage());
            }
        }

        return config;
    }

}
