package com.epam.deltix.tbwg.utils;

import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import com.epam.deltix.gflog.api.Log;
import com.epam.deltix.gflog.api.LogFactory;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;

import java.lang.reflect.Type;
import java.text.ParseException;
import java.util.List;

public class HeaderAccessorHelper {

    private static final Log LOG = LogFactory.getLog(HeaderAccessorHelper.class);

    public static final String FROM_TIMESTAMP_HEADER = "fromTimestamp";
    public static final String SYMBOLS_HEADER = "symbols";
    public static final String TYPES_HEADER = "types";

    private final DateFormatter formatter = new DateFormatter();

    private final Gson gson = new Gson();

    private static final Type LIST_STRING = new TypeToken<List<String>>(){}.getType();

    public long getTimestamp(SimpMessageHeaderAccessor headerAccessor) {
        List<String> list = headerAccessor.getNativeHeader(FROM_TIMESTAMP_HEADER);
        if (list != null && !list.isEmpty()) {
            String dateString = list.get(0);
            try {
                return formatter.fromDateString(dateString);
            } catch (ParseException e) {
                LOG.error().append("Error while parsing date string ")
                        .append(dateString)
                        .append(". Returning Long.MIN_VALUE. Error: ")
                        .append(e).commit();
            }
        }
        return Long.MIN_VALUE;
    }

    public List<String> getSymbols(SimpMessageHeaderAccessor headerAccessor) {
        List<String> headers = headerAccessor.getNativeHeader(SYMBOLS_HEADER);
        if (headers == null || headers.isEmpty()) {
            return null;
        }
        return gson.fromJson(headers.get(0), LIST_STRING);
    }

    public List<String> getTypes(SimpMessageHeaderAccessor headerAccessor) {
        List<String> headers = headerAccessor.getNativeHeader(TYPES_HEADER);
        if (headers == null || headers.isEmpty()) {
            return null;
        }
        return gson.fromJson(headers.get(0), LIST_STRING);
    }

}
