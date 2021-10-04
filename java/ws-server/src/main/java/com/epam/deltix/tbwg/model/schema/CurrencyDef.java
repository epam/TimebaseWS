package com.epam.deltix.tbwg.model.schema;

/**
 * Created by Alex Karpovich on 09/01/2020.
 */
public class CurrencyDef {
    public String       alphabeticCode;
    public int          numericCode;

    public CurrencyDef(String alphabeticCode, int numericCode) {
        this.alphabeticCode = alphabeticCode;
        this.numericCode = numericCode;
    }
}
