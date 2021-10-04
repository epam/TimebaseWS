package com.epam.deltix.tbwg.config;

import com.epam.deltix.tbwg.interceptors.RestLogInterceptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.task.AsyncTaskExecutor;
import org.springframework.web.servlet.config.annotation.AsyncSupportConfigurer;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.PathMatchConfigurer;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.util.UrlPathHelper;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    public static final String MAIN_API_PREFIX = "/api/v0";
    public static final String GRAFANA_API_PREFIX = "/grafana/v0";

    private final AsyncTaskExecutor asyncTaskExecutor;
    private final RestLogInterceptor logInterceptor;

    @Autowired
    public WebMvcConfig(AsyncTaskExecutor asyncTaskExecutor, RestLogInterceptor logInterceptor) {
        this.asyncTaskExecutor = asyncTaskExecutor;
        this.logInterceptor = logInterceptor;
    }

    // for encode slashes
    @Override
    public void configurePathMatch(PathMatchConfigurer configurer) {
        UrlPathHelper urlPathHelper = new UrlPathHelper();
        urlPathHelper.setUrlDecode(false);
        configurer.setUrlPathHelper(urlPathHelper);
    }

    @Override
    public void configureAsyncSupport(AsyncSupportConfigurer configurer) {
        configurer.setTaskExecutor(asyncTaskExecutor);
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(logInterceptor);
    }
}
