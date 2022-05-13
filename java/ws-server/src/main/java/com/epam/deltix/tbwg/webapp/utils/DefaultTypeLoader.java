package com.epam.deltix.tbwg.webapp.utils;

import com.epam.deltix.qsrv.hf.pub.MappingTypeLoader;
import com.epam.deltix.qsrv.hf.pub.TypeLoader;
import com.epam.deltix.qsrv.hf.pub.TypeLoaderImpl;
import com.epam.deltix.qsrv.hf.pub.md.ClassDescriptor;
import com.epam.deltix.tbwg.messages.BarMessage;
import com.epam.deltix.timebase.messages.universal.PackageHeader;

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
        bind("com.epam.deltix.timebase.messages.universal.PackageHeader", PackageHeader.class);
    }

    @Override
    public synchronized Class<?> load(ClassDescriptor cd) throws ClassNotFoundException {
        Class <?>       cls = map.get (cd.getName ());
        if (cls != null)
            return (cls);

        if (cls.getName().endsWith("BarMessage"))
            return BarMessage.class;

        if (cls.getName().endsWith("PackageHeader"))
            return PackageHeader.class;

        return super.load(cd);
    }
}
