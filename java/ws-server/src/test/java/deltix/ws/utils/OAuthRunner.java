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
