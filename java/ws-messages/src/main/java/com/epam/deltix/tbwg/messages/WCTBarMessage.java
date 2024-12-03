package com.epam.deltix.tbwg.messages;

import com.epam.deltix.dfp.Decimal64Utils;
import com.epam.deltix.qsrv.hf.pub.md.DateTimeDataType;
import com.epam.deltix.qsrv.hf.pub.md.IntegerDataType;
import com.epam.deltix.timebase.messages.*;
import com.epam.deltix.util.collections.generated.ByteArrayList;

@SchemaElement(
    name = "deltix.wct.marketdata.historical.WCTBarMessage",
    title = "WCT Bar Message"
)
public class WCTBarMessage extends MarketMessage {
    @SchemaType(encoding = "ALPHANUMERIC(10)", dataType = SchemaDataType.VARCHAR)
    public long exchangeCode;

    @SchemaType(dataType = SchemaDataType.FLOAT, encoding = "DECIMAL64")
    public long openBid;
    @SchemaType(dataType = SchemaDataType.FLOAT, encoding = "DECIMAL64")
    public long highBid;
    @SchemaType(dataType = SchemaDataType.FLOAT, encoding = "DECIMAL64")
    public long lowBid;
    @SchemaType(dataType = SchemaDataType.FLOAT, encoding = "DECIMAL64")
    public long closeBid;
    @SchemaType(dataType = SchemaDataType.FLOAT, encoding = "DECIMAL64")
    public long openAsk;
    @SchemaType(dataType = SchemaDataType.FLOAT, encoding = "DECIMAL64")
    public long highAsk;
    @SchemaType(dataType = SchemaDataType.FLOAT, encoding = "DECIMAL64")
    public long lowAsk;
    @SchemaType(dataType = SchemaDataType.FLOAT, encoding = "DECIMAL64")
    public long closeAsk;

    @SchemaType(dataType = SchemaDataType.FLOAT, encoding = "DECIMAL64")
    public long highMid;
    @SchemaType(dataType = SchemaDataType.FLOAT, encoding = "DECIMAL64")
    public long lowMid;

    @SchemaElement(title = "Close Ask Quote Id")
    @SchemaType(dataType = SchemaDataType.BINARY)
    public ByteArrayList closeAskQuoteId = new ByteArrayList();

    @SchemaElement(title = "Close Bid Quote Id")
    @SchemaType(dataType = SchemaDataType.BINARY)
    public ByteArrayList closeBidQuoteId = new ByteArrayList();

    @SchemaType(dataType = SchemaDataType.FLOAT, encoding = "DECIMAL64")
    public long volume;

    @SchemaType(dataType = SchemaDataType.TIMESTAMP)
    public long openTimestamp;
    @SchemaType(dataType = SchemaDataType.TIMESTAMP)
    public long closeTimestamp;

    public void clear() {
        // AbstractMessage
        // InstrumentMessage
        // DACMessage
        // MarketMessage
        reset();

        // WCTBarMessage
        exchangeCode = IntegerDataType.INT64_NULL;

        openBid = Decimal64Utils.NULL;
        highBid = Decimal64Utils.NULL;
        lowBid = Decimal64Utils.NULL;
        closeBid = Decimal64Utils.NULL;
        openAsk = Decimal64Utils.NULL;
        highAsk = Decimal64Utils.NULL;
        lowAsk = Decimal64Utils.NULL;
        closeAsk = Decimal64Utils.NULL;

        highMid = Decimal64Utils.NULL;
        lowMid = Decimal64Utils.NULL;

        volume = Decimal64Utils.NULL;

        openTimestamp = DateTimeDataType.NULL;
        closeTimestamp = DateTimeDataType.NULL;
    }

    /**
     * Method copies state to a given instance
     * @param template class instance that should be used as a copy source
     */
    @Override
    public MarketMessage copyFrom(RecordInfo template) {
        super.copyFrom(template);
        if (template instanceof WCTBarMessage) {
            WCTBarMessage wct = (WCTBarMessage) template;

            this.exchangeCode = wct.exchangeCode;

            this.openBid = wct.openBid;
            this.highBid = wct.highBid;
            this.lowBid = wct.lowBid;
            this.closeBid = wct.closeBid;
            this.openAsk = wct.openAsk;
            this.highAsk = wct.highAsk;
            this.lowAsk = wct.lowAsk;
            this.closeAsk = wct.closeAsk;

            this.highMid = wct.highMid;
            this.lowMid = wct.lowMid;

            this.volume = wct.volume;

            this.openTimestamp = wct.openTimestamp;
            this.closeTimestamp = wct.closeTimestamp;
        }
        return this;
    }

    public boolean isInitialized() {
        return exchangeCode != IntegerDataType.INT64_NULL
            && openBid != Decimal64Utils.NULL
            && highBid != Decimal64Utils.NULL
            && lowBid != Decimal64Utils.NULL
            && closeBid != Decimal64Utils.NULL
            && openAsk != Decimal64Utils.NULL
            && highAsk != Decimal64Utils.NULL
            && lowAsk != Decimal64Utils.NULL
            && closeAsk != Decimal64Utils.NULL
            && highMid != Decimal64Utils.NULL
            && lowMid != Decimal64Utils.NULL
            && openTimestamp != DateTimeDataType.NULL
            && closeTimestamp != DateTimeDataType.NULL;
    }

    @Override
    public boolean equals(Object obj) {
        return obj instanceof WCTBarMessage && equals((WCTBarMessage) obj);
    }

    public boolean equals(WCTBarMessage other) {
        return getNanoTime() == other.getNanoTime() &&
            symbol.equals(other.symbol) &&
            originalTimestamp == other.originalTimestamp &&
            sequenceNumber == other.sequenceNumber &&
            exchangeCode == other.exchangeCode &&
            openBid == other.openBid &&
            highBid == other.highBid &&
            lowBid == other.lowBid &&
            closeBid == other.closeBid &&
            openAsk == other.openAsk &&
            highAsk == other.highAsk &&
            lowAsk == other.lowAsk &&
            closeAsk == other.closeAsk &&
            highMid == other.highMid &&
            lowMid == other.lowMid &&
            volume == other.volume &&
            openTimestamp == other.openTimestamp &&
            closeTimestamp == other.closeTimestamp
            ;
    }

    @Override
    public String toString() {
        StringBuilder builder = new StringBuilder();
        builder.append("{ ExchangeCode = ").append(exchangeCode)
            .append(", Timestamp = ").append(getTimeStampMs())
            //.append(", InstrumentType = ").append(instrumentType)
            .append(", Symbol = ").append(symbol)
            .append(", OriginalTimestamp = ").append(originalTimestamp)
            .append(", SequenceNumber = ").append(sequenceNumber);
        builder.append(", OpenBid = ");
        Decimal64Utils.appendTo(openBid, builder);
        builder.append(", HighBid = ");
        Decimal64Utils.appendTo(highBid, builder);
        builder.append(", LowBid = ");
        Decimal64Utils.appendTo(lowBid, builder);
        builder.append(", CloseBid = ");
        Decimal64Utils.appendTo(closeBid, builder);
        builder.append(", OpenAsk = ");
        Decimal64Utils.appendTo(openAsk, builder);
        builder.append(", HighAsk = ");
        Decimal64Utils.appendTo(highAsk, builder);
        builder.append(", LowAsk = ");
        Decimal64Utils.appendTo(lowAsk, builder);
        builder.append(", CloseAsk = ");
        Decimal64Utils.appendTo(closeAsk, builder);
        builder.append(", HighMid = ");
        Decimal64Utils.appendTo(highMid, builder);
        builder.append(", LowMid = ");
        Decimal64Utils.appendTo(lowMid, builder);
        builder.append(", Volume = ");
        Decimal64Utils.appendTo(volume, builder);
        builder.append(", OpenTimestamp = ").append(openTimestamp)
            .append(", CloseTimestamp = ").append(closeTimestamp)
            .append(" }");
        return builder.toString();
    }

}
