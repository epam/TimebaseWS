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
package deltix.ws.utils;

import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;

import java.io.File;
import java.io.IOException;
import java.util.concurrent.TimeUnit;

public class OAuthRunner {

    private String jarPath;
    private Process authServer;

    public OAuthRunner(String pathToOAuthJar) {
        jarPath = pathToOAuthJar;
    }

    public void run() throws UnableToRunOAuthException {
        try {
            ProcessBuilder pb = new ProcessBuilder("java", "-jar", jarPath);
            pb.directory(new File(System.getProperty("user.dir")));
            pb.redirectOutput(ProcessBuilder.Redirect.INHERIT);
            pb.redirectError(ProcessBuilder.Redirect.INHERIT);
            authServer = pb.start();
            boolean started = false;
            long startTime = System.currentTimeMillis();
            long interval = 30 * 1000; //30 seconds
            while (!started) {
                if (System.currentTimeMillis() - startTime < interval) {
                    try {
                        RestTemplate template = new RestTemplate();
                        ResponseEntity<String> response
                                = template.getForEntity("http://localhost:8100/actuator/health", String.class);
                        System.out.println(response.getBody());
                        started = true;
                    } catch (Exception ignored) {
                    }
                } else {
                    throw new UnableToRunOAuthException();
                }
            }
        } catch (IOException exc) {
            throw new RuntimeException(exc.getMessage());
        }
    }

    public void kill() {
        if (authServer != null) {
            authServer.destroy();
            authServer = null;
        }
    }

    public static void main(String[] args) throws Exception {
        System.out.println("Working Directory = " +
                System.getProperty("user.dir"));
        OAuthRunner runner = new OAuthRunner("java\\oauth-server\\build\\libs\\deltix-oauth-sever-0.2.3.jar");
        runner.run();
        TimeUnit.SECONDS.sleep(20);
        runner.kill();
    }

    public class UnableToRunOAuthException extends Exception {
        @Override
        public String getMessage() {
            return "Unable to run oauth exception.";
        }
    }
}