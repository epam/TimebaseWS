package com.epam.deltix.tbwg.messages;

import com.epam.deltix.containers.BinaryAsciiString;
import com.epam.deltix.containers.CharSequenceUtils;
import com.epam.deltix.containers.MutableString;
import com.epam.deltix.timebase.messages.InstrumentMessage;
import com.epam.deltix.timebase.messages.*;
import com.epam.deltix.util.annotations.TimestampMs;

public class ViewMetadataMessage extends InstrumentMessage implements RecordInterface {
    public static final String CLASS_NAME = ViewMetadataMessage.class.getName();
    protected CharSequence output = null;
    protected ViewOutputType outputType = null;
    protected byte live = -1;
    protected byte autoRestart = -1;
    protected ViewState state = null;
    protected CharSequence description = null;
    protected CharSequence query = null;
    protected ViewQueryType queryType = null;
    @TimestampMs
    protected long lastTimestamp = Long.MIN_VALUE;
    protected CharSequence statusMessage = null;

    public ViewMetadataMessage() {
    }

    @SchemaElement(
            name = "output",
            title = "Output"
    )
    @SchemaType(
            isNullable = false
    )
    public CharSequence getOutput() {
        return this.output;
    }

    public void setOutput(CharSequence value) {
        this.output = value;
    }

    public boolean hasOutput() {
        return this.output != null;
    }

    public void nullifyOutput() {
        this.output = null;
    }

    @SchemaElement(
            name = "outputType",
            title = "Output Type"
    )
    @SchemaType(
            isNullable = false
    )
    public ViewOutputType getOutputType() {
        return this.outputType;
    }

    public void setOutputType(ViewOutputType value) {
        this.outputType = value;
    }

    public boolean hasOutputType() {
        return this.outputType != null;
    }

    public void nullifyOutputType() {
        this.outputType = null;
    }

    @SchemaElement(
            name = "live",
            title = "Live"
    )
    @SchemaType(
            isNullable = false
    )
    public boolean isLive() {
        return this.live == 1;
    }

    public void setLive(boolean value) {
        this.live = (byte)(value ? 1 : 0);
    }

    public boolean hasLive() {
        return this.live != -1;
    }

    public void nullifyLive() {
        this.live = -1;
    }

    @SchemaElement(
            name = "autoRestart",
            title = "Auto Restart"
    )
    @SchemaType(
            isNullable = false
    )
    public boolean isAutoRestart() {
        return this.autoRestart == 1;
    }

    public void setAutoRestart(boolean value) {
        this.autoRestart = (byte)(value ? 1 : 0);
    }

    public boolean hasAutoRestart() {
        return this.autoRestart != -1;
    }

    public void nullifyAutoRestart() {
        this.autoRestart = -1;
    }

    @SchemaElement(
            name = "state",
            title = "State"
    )
    @SchemaType(
            isNullable = false
    )
    public ViewState getState() {
        return this.state;
    }

    public void setState(ViewState value) {
        this.state = value;
    }

    public boolean hasState() {
        return this.state != null;
    }

    public void nullifyState() {
        this.state = null;
    }

    @SchemaElement(
            name = "description",
            title = "Description"
    )
    public CharSequence getDescription() {
        return this.description;
    }

    public void setDescription(CharSequence value) {
        this.description = value;
    }

    public boolean hasDescription() {
        return this.description != null;
    }

    public void nullifyDescription() {
        this.description = null;
    }

    @SchemaElement(
            name = "query",
            title = "Query"
    )
    @SchemaType(
            isNullable = false
    )
    public CharSequence getQuery() {
        return this.query;
    }

    public void setQuery(CharSequence value) {
        this.query = value;
    }

    public boolean hasQuery() {
        return this.query != null;
    }

    public void nullifyQuery() {
        this.query = null;
    }

    @SchemaElement(
            name = "queryType",
            title = "View Query Type"
    )
    @SchemaType(
            isNullable = false
    )
    public ViewQueryType getQueryType() {
        return this.queryType;
    }

    public void setQueryType(ViewQueryType value) {
        this.queryType = value;
    }

    public boolean hasQueryType() {
        return this.queryType != null;
    }

    public void nullifyQueryType() {
        this.queryType = null;
    }

    @TimestampMs
    @SchemaElement(
            name = "lastTimestamp",
            title = "Last Timestamp"
    )
    @SchemaType(
            dataType = SchemaDataType.TIMESTAMP
    )
    public long getLastTimestamp() {
        return this.lastTimestamp;
    }

    public void setLastTimestamp(@TimestampMs long value) {
        this.lastTimestamp = value;
    }

    public boolean hasLastTimestamp() {
        return this.lastTimestamp != Long.MIN_VALUE;
    }

    public void nullifyLastTimestamp() {
        this.lastTimestamp = Long.MIN_VALUE;
    }

    @SchemaElement(
            name = "statusMessage",
            title = "StatusMessage"
    )
    public CharSequence getStatusMessage() {
        return this.statusMessage;
    }

    public void setStatusMessage(CharSequence value) {
        this.statusMessage = value;
    }

    public boolean hasStatusMessage() {
        return this.statusMessage != null;
    }

    public void nullifyStatusMessage() {
        this.statusMessage = null;
    }

    protected ViewMetadataMessage createInstance() {
        return new ViewMetadataMessage();
    }

    public ViewMetadataMessage nullify() {
        super.nullify();
        this.nullifyOutput();
        this.nullifyOutputType();
        this.nullifyLive();
        this.nullifyAutoRestart();
        this.nullifyState();
        this.nullifyDescription();
        this.nullifyQuery();
        this.nullifyQueryType();
        this.nullifyLastTimestamp();
        this.nullifyStatusMessage();
        return this;
    }

    public ViewMetadataMessage reset() {
        super.reset();
        this.output = null;
        this.outputType = null;
        this.live = -1;
        this.autoRestart = -1;
        this.state = null;
        this.description = null;
        this.query = null;
        this.queryType = null;
        this.lastTimestamp = Long.MIN_VALUE;
        this.statusMessage = null;
        return this;
    }

    public ViewMetadataMessage clone() {
        ViewMetadataMessage t = this.createInstance();
        t.copyFrom(this);
        return t;
    }

    public boolean equals(Object obj) {
        if (this == obj) {
            return true;
        } else {
            boolean superEquals = super.equals(obj);
            if (!superEquals) {
                return false;
            } else if (!(obj instanceof ViewMetadataMessage)) {
                return false;
            } else {
                ViewMetadataMessage other = (ViewMetadataMessage)obj;
                if (this.hasOutput() != other.hasOutput()) {
                    return false;
                } else {
                    CharSequence s1;
                    CharSequence s2;
                    if (this.hasOutput()) {
                        if (this.getOutput().length() != other.getOutput().length()) {
                            return false;
                        }

                        s1 = this.getOutput();
                        s2 = other.getOutput();
                        if (s1 instanceof MutableString && s2 instanceof MutableString || s1 instanceof String && s2 instanceof String || s1 instanceof BinaryAsciiString && s2 instanceof BinaryAsciiString) {
                            if (!s1.equals(s2)) {
                                return false;
                            }
                        } else if (!CharSequenceUtils.equals(s1, s2)) {
                            return false;
                        }
                    }

                    if (this.hasOutputType() != other.hasOutputType()) {
                        return false;
                    } else if (this.hasOutputType() && this.getOutputType() != other.getOutputType()) {
                        return false;
                    } else if (this.hasLive() != other.hasLive()) {
                        return false;
                    } else if (this.hasLive() && this.isLive() != other.isLive()) {
                        return false;
                    } else if (this.hasAutoRestart() != other.hasAutoRestart()) {
                        return false;
                    } else if (this.hasAutoRestart() && this.isAutoRestart() != other.isAutoRestart()) {
                        return false;
                    } else if (this.hasState() != other.hasState()) {
                        return false;
                    } else if (this.hasState() && this.getState() != other.getState()) {
                        return false;
                    } else if (this.hasDescription() != other.hasDescription()) {
                        return false;
                    } else {
                        if (this.hasDescription()) {
                            if (this.getDescription().length() != other.getDescription().length()) {
                                return false;
                            }

                            s1 = this.getDescription();
                            s2 = other.getDescription();
                            if (s1 instanceof MutableString && s2 instanceof MutableString || s1 instanceof String && s2 instanceof String || s1 instanceof BinaryAsciiString && s2 instanceof BinaryAsciiString) {
                                if (!s1.equals(s2)) {
                                    return false;
                                }
                            } else if (!CharSequenceUtils.equals(s1, s2)) {
                                return false;
                            }
                        }

                        if (this.hasQuery() != other.hasQuery()) {
                            return false;
                        } else {
                            if (this.hasQuery()) {
                                if (this.getQuery().length() != other.getQuery().length()) {
                                    return false;
                                }

                                s1 = this.getQuery();
                                s2 = other.getQuery();
                                if (s1 instanceof MutableString && s2 instanceof MutableString || s1 instanceof String && s2 instanceof String || s1 instanceof BinaryAsciiString && s2 instanceof BinaryAsciiString) {
                                    if (!s1.equals(s2)) {
                                        return false;
                                    }
                                } else if (!CharSequenceUtils.equals(s1, s2)) {
                                    return false;
                                }
                            }

                            if (this.hasQueryType() != other.hasQueryType()) {
                                return false;
                            } else if (this.hasQueryType() && this.getQueryType() != other.getQueryType()) {
                                return false;
                            } else if (this.hasLastTimestamp() != other.hasLastTimestamp()) {
                                return false;
                            } else if (this.hasLastTimestamp() && this.getLastTimestamp() != other.getLastTimestamp()) {
                                return false;
                            } else if (this.hasStatusMessage() != other.hasStatusMessage()) {
                                return false;
                            } else {
                                if (this.hasStatusMessage()) {
                                    if (this.getStatusMessage().length() != other.getStatusMessage().length()) {
                                        return false;
                                    }

                                    s1 = this.getStatusMessage();
                                    s2 = other.getStatusMessage();
                                    if (s1 instanceof MutableString && s2 instanceof MutableString || s1 instanceof String && s2 instanceof String || s1 instanceof BinaryAsciiString && s2 instanceof BinaryAsciiString) {
                                        if (!s1.equals(s2)) {
                                            return false;
                                        }
                                    } else if (!CharSequenceUtils.equals(s1, s2)) {
                                        return false;
                                    }
                                }

                                return true;
                            }
                        }
                    }
                }
            }
        }
    }

    public int hashCode() {
        int hash = super.hashCode();
        if (this.hasOutput()) {
            hash = hash * 31 + this.getOutput().hashCode();
        }

        if (this.hasOutputType()) {
            hash = hash * 31 + this.getOutputType().getNumber();
        }

        if (this.hasLive()) {
            hash = hash * 31 + (this.isLive() ? 1231 : 1237);
        }

        if (this.hasAutoRestart()) {
            hash = hash * 31 + (this.isAutoRestart() ? 1231 : 1237);
        }

        if (this.hasState()) {
            hash = hash * 31 + this.getState().getNumber();
        }

        if (this.hasDescription()) {
            hash = hash * 31 + this.getDescription().hashCode();
        }

        if (this.hasQuery()) {
            hash = hash * 31 + this.getQuery().hashCode();
        }

        if (this.hasQueryType()) {
            hash = hash * 31 + this.getQueryType().getNumber();
        }

        if (this.hasLastTimestamp()) {
            hash = hash * 31 + (int)(this.getLastTimestamp() ^ this.getLastTimestamp() >>> 32);
        }

        if (this.hasStatusMessage()) {
            hash = hash * 31 + this.getStatusMessage().hashCode();
        }

        return hash;
    }

    public ViewMetadataMessage copyFrom(RecordInfo template) {
        super.copyFrom(template);
        if (template instanceof ViewMetadataMessage) {
            ViewMetadataMessage t = (ViewMetadataMessage)template;
            if (!t.hasOutput()) {
                this.nullifyOutput();
            } else {
                if (this.hasOutput() && this.getOutput() instanceof StringBuilder) {
                    ((StringBuilder)this.getOutput()).setLength(0);
                } else {
                    this.setOutput(new StringBuilder());
                }

                ((StringBuilder)this.getOutput()).append(t.getOutput());
            }

            if (t.hasOutputType()) {
                this.setOutputType(t.getOutputType());
            } else {
                this.nullifyOutputType();
            }

            if (t.hasLive()) {
                this.setLive(t.isLive());
            } else {
                this.nullifyLive();
            }

            if (t.hasAutoRestart()) {
                this.setAutoRestart(t.isAutoRestart());
            } else {
                this.nullifyAutoRestart();
            }

            if (t.hasState()) {
                this.setState(t.getState());
            } else {
                this.nullifyState();
            }

            if (!t.hasDescription()) {
                this.nullifyDescription();
            } else {
                if (this.hasDescription() && this.getDescription() instanceof StringBuilder) {
                    ((StringBuilder)this.getDescription()).setLength(0);
                } else {
                    this.setDescription(new StringBuilder());
                }

                ((StringBuilder)this.getDescription()).append(t.getDescription());
            }

            if (!t.hasQuery()) {
                this.nullifyQuery();
            } else {
                if (this.hasQuery() && this.getQuery() instanceof StringBuilder) {
                    ((StringBuilder)this.getQuery()).setLength(0);
                } else {
                    this.setQuery(new StringBuilder());
                }

                ((StringBuilder)this.getQuery()).append(t.getQuery());
            }

            if (t.hasQueryType()) {
                this.setQueryType(t.getQueryType());
            } else {
                this.nullifyQueryType();
            }

            if (t.hasLastTimestamp()) {
                this.setLastTimestamp(t.getLastTimestamp());
            } else {
                this.nullifyLastTimestamp();
            }

            if (t.hasStatusMessage()) {
                if (this.hasStatusMessage() && this.getStatusMessage() instanceof StringBuilder) {
                    ((StringBuilder)this.getStatusMessage()).setLength(0);
                } else {
                    this.setStatusMessage(new StringBuilder());
                }

                ((StringBuilder)this.getStatusMessage()).append(t.getStatusMessage());
            } else {
                this.nullifyStatusMessage();
            }
        }

        return this;
    }

    public String toString() {
        StringBuilder str = new StringBuilder();
        return this.toString(str).toString();
    }

    public StringBuilder toString(StringBuilder str) {
        str.append("{ \"$type\":  \"ViewMetadataMessage\"");
        if (this.hasOutput()) {
            str.append(", \"output\": \"").append(this.getOutput()).append("\"");
        }

        if (this.hasOutputType()) {
            str.append(", \"outputType\": \"").append(this.getOutputType()).append("\"");
        }

        if (this.hasLive()) {
            str.append(", \"live\": ").append(this.isLive());
        }

        if (this.hasAutoRestart()) {
            str.append(", \"autoRestart\": ").append(this.isAutoRestart());
        }

        if (this.hasState()) {
            str.append(", \"state\": \"").append(this.getState()).append("\"");
        }

        if (this.hasDescription()) {
            str.append(", \"description\": \"").append(this.getDescription()).append("\"");
        }

        if (this.hasQuery()) {
            str.append(", \"query\": \"").append(this.getQuery()).append("\"");
        }

        if (this.hasQueryType()) {
            str.append(", \"queryType\": \"").append(this.getQueryType()).append("\"");
        }

        if (this.hasStatusMessage()) {
            str.append(", \"statusMessage\": \"").append(this.getStatusMessage()).append("\"");
        }

//        if (this.hasLastTimestamp()) {
//            str.append(", \"lastTimestamp\": \"").append(TicksFormat.formatSafe(this.getLastTimestamp(), 0)).append("\"");
//        }
//
//        if (this.hasTimeStampMs()) {
//            str.append(", \"timestamp\": \"").append(TicksFormat.formatNs(this.getTimeStampNs())).append("\"");
//        }

//        if (this.hasInstrumentType()) {
//            str.append(", \"instrumentType\": \"").append(this.getInstrumentType()).append("\"");
//        }

        if (this.hasSymbol()) {
            str.append(", \"symbol\": \"").append(this.getSymbol()).append("\"");
        }

        str.append("}");
        return str;
    }
}