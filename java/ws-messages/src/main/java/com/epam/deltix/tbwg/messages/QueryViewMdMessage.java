package com.epam.deltix.tbwg.messages;

import com.epam.deltix.timebase.messages.*;

public class QueryViewMdMessage extends ViewMdMessage {
    public static final String CLASS_NAME = QueryViewMdMessage.class.getName();

    protected String query;

    @SchemaElement(
        title = "Query"
    )
    @SchemaType(
        isNullable = false
    )
    public String getQuery() {
        return query;
    }

    public void setQuery(String query) {
        this.query = query;
    }

    @Override
    protected QueryViewMdMessage createInstance() {
        return new QueryViewMdMessage();
    }

    @Override
    public QueryViewMdMessage clone() {
        QueryViewMdMessage t = createInstance();
        t.copyFrom(this);
        return t;
    }

    @Override
    public InstrumentMessage copyFrom(RecordInfo source) {
        super.copyFrom(source);
        if (source instanceof QueryViewMdMessage) {
            final QueryViewMdMessage obj = (QueryViewMdMessage) source;
            query = obj.query;
        }
        return this;
    }

}
