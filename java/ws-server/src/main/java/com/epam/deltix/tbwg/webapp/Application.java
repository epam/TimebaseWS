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

package com.epam.deltix.tbwg.webapp;


import com.epam.deltix.gflog.core.LogConfigurator;
import com.epam.deltix.tbwg.webapp.config.LogConfigurer;
import com.epam.deltix.tbwg.webapp.utils.ShutdownSignal;
import org.agrona.CloseHelper;
import org.springframework.boot.Banner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.web.servlet.ServletComponentScan;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.security.config.annotation.method.configuration.EnableGlobalMethodSecurity;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;


@ServletComponentScan
@SpringBootApplication(scanBasePackages = { "com.epam.deltix"})
@EnableWebSocket
@EnableScheduling
@EnableWebSocketMessageBroker
@EnableConfigurationProperties
@EnableGlobalMethodSecurity(prePostEnabled = true)
public class Application {

    public static final String VERSION = Application.class.getPackage().getImplementationVersion();

    public static void main(String[] args) {
        System.setProperty("org.apache.tomcat.util.buf.UDecoder.ALLOW_ENCODED_SLASH", "true");

        LogConfigurer.configureLogging("timebase-web-gateway");

        ConfigurableApplicationContext context = null;
        try {
            final ShutdownSignal shutdownSignal = new ShutdownSignal();
            final SpringApplication application = new SpringApplication(Application.class);
            application.setBannerMode(Banner.Mode.LOG);
            application.setBanner(new TimebaseWSBanner());
            application.setRegisterShutdownHook(false);
            context = application.run(args);
            shutdownSignal.await();
        } catch (Throwable ex) {
            ex.printStackTrace(System.out);
        }
        finally {
            CloseHelper.close(context);
            LogConfigurator.unconfigure();
        }
    }

}
