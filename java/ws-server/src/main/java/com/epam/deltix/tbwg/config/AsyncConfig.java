package com.epam.deltix.tbwg.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.scheduling.annotation.AsyncConfigurer;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ConcurrentTaskExecutor;

import java.util.concurrent.Executors;

@Configuration
@EnableAsync
public class AsyncConfig implements AsyncConfigurer {

    @Override
    @Bean("asyncTaskExecutor")
    @Primary
    public ConcurrentTaskExecutor getAsyncExecutor() {
        return new ConcurrentTaskExecutor(Executors.newCachedThreadPool());
    }
}
