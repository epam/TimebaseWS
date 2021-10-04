package com.epam.deltix.tbwg.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties
public class ChartingConfiguration {

    @Value("${charting.corePoolSize:4}")
    private int corePoolSize;

    @Value("${charting.maxPoolSize:4}")
    private int maxPoolSize;

    @Value("${charting.queryTimeoutSec:60}")
    private int queryTimeoutSec;

    public int getCorePoolSize() {
        return corePoolSize;
    }

    public void setCorePoolSize(int corePoolSize) {
        this.corePoolSize = corePoolSize;
    }

    public int getMaxPoolSize() {
        return maxPoolSize;
    }

    public void setMaxPoolSize(int maxPoolSize) {
        this.maxPoolSize = maxPoolSize;
    }

    public int getQueryTimeoutSec() {
        return queryTimeoutSec;
    }

    public void setQueryTimeoutSec(int queryTimeoutSec) {
        this.queryTimeoutSec = queryTimeoutSec;
    }
}
