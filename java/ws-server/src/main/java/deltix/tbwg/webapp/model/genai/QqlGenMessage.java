package deltix.tbwg.webapp.model.genai;

import com.fasterxml.jackson.annotation.JsonProperty;

public class QqlGenMessage {

    @JsonProperty
    private final String stage;
    @JsonProperty
    private final Integer attempt;
    @JsonProperty
    private final Integer maxAttempts;
    @JsonProperty
    private final String data;
    @JsonProperty
    private final String error;
    @JsonProperty
    private final Boolean finalEvent;

    private QqlGenMessage(Builder b) {
        this.stage = b.stage;
        this.attempt = b.attempt;
        this.maxAttempts = b.maxAttempts;
        this.data = b.data;
        this.error = b.error;
        this.finalEvent = b.finalEvent;
    }

    public String getStage() { return stage; }
    public Integer getAttempt() { return attempt; }
    public Integer getMaxAttempts() { return maxAttempts; }
    public String getData() { return data; }
    public String getError() { return error; }
    public Boolean getFinalEvent() { return finalEvent; }

    public static Builder builder(String stage) { return new Builder(stage); }

    public static class Builder {
        private final String stage;
        private Integer attempt;
        private Integer maxAttempts;
        private String data;
        private String error;
        private Boolean finalEvent;

        public Builder(String stage) { this.stage = stage; }
        public Builder attempt(Integer v) { this.attempt = v; return this; }
        public Builder maxAttempts(Integer v) { this.maxAttempts = v; return this; }
        public Builder data(String v) { this.data = v; return this; }
        public Builder error(String v) { this.error = v; return this; }
        public Builder finalEvent(Boolean v) { this.finalEvent = v; return this; }
        public QqlGenMessage build() { return new QqlGenMessage(this); }
    }
}
