package com.epam.deltix.tbwg.webapp.utils;

import com.epam.deltix.qsrv.hf.pub.MappingTypeLoader;
import com.epam.deltix.qsrv.hf.pub.TypeLoader;
import com.epam.deltix.qsrv.hf.pub.TypeLoaderImpl;
import com.epam.deltix.qsrv.hf.pub.md.ClassDescriptor;
import com.epam.deltix.tbwg.messages.BarMessage;
import com.epam.deltix.timebase.messages.universal.*;

/**
 * Default Type Loader to support different types
 */
public class DefaultTypeLoader extends MappingTypeLoader {

    public DefaultTypeLoader () {
        this (TypeLoaderImpl.DEFAULT_INSTANCE);
    }

    public DefaultTypeLoader (TypeLoader parent) {
        super (parent);

        bind("deltix.timebase.api.messages.BarMessage", BarMessage.class);
        bind("com.epam.deltix.timebase.messages.BarMessage", BarMessage.class);

        bind("deltix.timebase.api.messages.universal.PackageHeader", PackageHeader.class);
        bind("deltix.timebase.api.messages.universal.L1Entry", L1Entry.class);
        bind("deltix.timebase.api.messages.universal.L2EntryNew", L2EntryNew.class);
        bind("deltix.timebase.api.messages.universal.TradeEntry", TradeEntry.class);
        bind("deltix.timebase.api.messages.universal.L2EntryUpdate", L2EntryUpdate.class);
        bind("deltix.timebase.api.messages.universal.L3EntryNew", L3EntryNew.class);
        bind("deltix.timebase.api.messages.universal.L3EntryUpdate", L3EntryUpdate.class);
        bind("deltix.timebase.api.messages.universal.BookResetEntry", BookResetEntry.class);
        bind("deltix.timebase.api.messages.universal.StatisticsEntry", StatisticsEntry.class);
    }

    @Override
    public synchronized Class<?> load(ClassDescriptor cd) throws ClassNotFoundException {
        String name = cd.getName();

        Class <?>       cls = map.get (name);
        if (cls != null)
            return (cls);

        if (name.endsWith("BarMessage"))
            return BarMessage.class;

        if (name.endsWith("PackageHeader"))
            return PackageHeader.class;

        return super.load(cd);
    }
}
