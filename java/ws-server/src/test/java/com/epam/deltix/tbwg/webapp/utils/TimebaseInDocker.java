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
package com.epam.deltix.tbwg.webapp.utils;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.wait.strategy.Wait;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

import java.time.Duration;

/**
 * To use TimebaseInDocker add your profile to TimebaseInDockerConfig or create your custom profile.
 * Also add your test to Test Backend Timebase in docker gitlab ci Job like and add it's to exclude in build.gradle test task
 */
@Profile("timebaseInDocker")
@Component
@Testcontainers
public class TimebaseInDocker {

    public static final int TIMEBASE_DOCKER_PORT = 8011;

    @Container
    public final GenericContainer timebase;

    public int timebasePort = -1;

    public TimebaseInDocker() {
        if (System.getenv("TIMEBASE_SERIAL") == null) {
            throw new IllegalArgumentException("No TIMEBASE_SERIAL environment variable");
        }

        timebase = new GenericContainer(DockerImageName.parse("registry-dev.deltixhub.com/quantserver.docker/timebase/server:5.5.23")
                .asCompatibleSubstituteFor("timebase"))
                .withEnv("JAVA_OPTS", "-DQuantServer.enableRemoteMonitoring=true -DTimeBase.version=5.0")
                .withEnv("TIMEBASE_SERIAL", System.getenv("TIMEBASE_SERIAL"))
                .withExposedPorts(TIMEBASE_DOCKER_PORT) // random test-container port <-> timebase container 8011 (TIMEBASE_DOCKER_PORT)
//                .withStartupTimeout(Duration.ofSeconds(30))//60s by default
                .waitingFor(Wait.forLogMessage(".*QuantServer started .*", 1))
        ;
    }

    public int getTimebasePort() {
        if (timebasePort == -1) {
            if (!timebase.isCreated()) {
                timebase.start();
            }
            timebasePort = timebase.getMappedPort(TIMEBASE_DOCKER_PORT);
        }
        return timebasePort;
    }

}