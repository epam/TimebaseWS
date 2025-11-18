package com.epam.deltix.tbwg.webapp.utils.json;

import com.epam.deltix.qsrv.util.json.DataEncoding;
import com.epam.deltix.qsrv.util.json.JSONRawMessagePrinter;
import com.epam.deltix.qsrv.util.json.PrintType;
import com.epam.deltix.tbwg.webapp.settings.LocaleSettings;

import java.util.Locale;

public class WebGatewayJsonRawMessagePrinterFactory {

    public static JSONRawMessagePrinter create() {
        return create(JsonBigIntEncoding.NUMBER);
    }
    public static JSONRawMessagePrinter create(JsonBigIntEncoding bigIntEncoding) {
        Locale locale = LocaleSettings.getApplicationLocale();
        if (bigIntEncoding == JsonBigIntEncoding.STRING) {
            return new CustomEncodingJsonRawMessagePrinter(locale);
        }
        return new JSONRawMessagePrinter(false, true, DataEncoding.STANDARD, true, true, PrintType.FULL, false, "$type", locale);
    }
}
