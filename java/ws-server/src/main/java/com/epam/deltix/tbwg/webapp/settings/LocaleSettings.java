package com.epam.deltix.tbwg.webapp.settings;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

@Component
public class LocaleSettings {

    @Value("${spring.web.locale:}")
    private String locale;

    private static Locale applicationLocale;

    public static Locale getApplicationLocale() {
        return applicationLocale;
    }

    @PostConstruct
    private void setup() {
        Set<String> available = Arrays.stream(Locale.getAvailableLocales()).map(Locale::toLanguageTag).collect(Collectors.toSet());
        if (available.contains(locale)) {
            applicationLocale = Locale.forLanguageTag(locale);
        } else {
            applicationLocale = Locale.getDefault();
        }
    }


}
