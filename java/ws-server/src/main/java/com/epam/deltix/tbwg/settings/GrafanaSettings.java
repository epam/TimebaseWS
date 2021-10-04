package com.epam.deltix.tbwg.settings;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.regex.Pattern;

@Component
@ConfigurationProperties(prefix = "grafana")
public class GrafanaSettings {

    private Set<String> streams = new HashSet<>();
    private String include;
    private String exclude;
    private boolean enabled;
    private List<String> pluginsPackages;
    private Pattern iPattern;
    private Pattern ePattern;

    public Set<String> getStreams() {
        return streams;
    }

    public void setStreams(Set<String> streams) {
        this.streams = streams;
    }

    public String getInclude() {
        return include;
    }

    public void setInclude(String include) {
        this.include = include;
        if (include != null && include.length() > 0)
            iPattern = Pattern.compile(include);
        else
            iPattern = null;
    }

    public String getExclude() {
        return exclude;
    }

    public void setExclude(String exclude) {
        this.exclude = exclude;
        if (exclude != null && exclude.length() > 0)
            ePattern = Pattern.compile(exclude);
        else
            ePattern = null;
    }

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public List<String> getPluginsPackages() {
        return pluginsPackages;
    }

    public void setPluginsPackages(List<String> pluginsPackages) {
        this.pluginsPackages = pluginsPackages;
    }

    public boolean isKeyAccepted(String key) {
        if (streams.isEmpty()) {
            boolean matches = true;
            if (iPattern != null)
                matches = iPattern.matcher(key).find();
            if (ePattern != null)
                matches &= !ePattern.matcher(key).find();
            return matches;
        }
        return streams.contains(key);
    }
}
