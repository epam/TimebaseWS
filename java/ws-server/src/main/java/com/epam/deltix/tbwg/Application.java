package com.epam.deltix.tbwg;

import com.epam.deltix.tbwg.config.LogConfigurer;
import com.epam.deltix.tbwg.utils.ShutdownSignal;
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
@SpringBootApplication(scanBasePackages = { "com.epam.deltix.tbwg", "com.epam.deltix.spring" })
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
            if (context != null)
                context.close();
            //LogConfigurator.unconfigure();
        }
    }

}
