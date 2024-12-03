package com.epam.deltix.tbwg.webapp.services.charting.transformations;

import com.epam.deltix.timebase.messages.universal.*;
import com.epam.deltix.util.collections.generated.ObjectArrayList;

import java.util.function.Predicate;

public class TransformationUtils {

    public static boolean isL2Book(PackageHeader message) {
        return checkBookType(message, 10, TransformationUtils::isL2Entry);
    }

    public static boolean isL3Book(PackageHeader message) {
        return checkBookType(message, 10, TransformationUtils::isL3Entry);
    }

    private static boolean checkBookType(PackageHeader message, int maxLevels, Predicate<BaseEntryInfo> check) {
        ObjectArrayList<BaseEntryInfo> entries = message.getEntries();
        if (entries != null) {
            for (int i = 0; i < entries.size() && i < maxLevels; ++i) {
                if (check.test(entries.get(i))) {
                    return true;
                }
            }
        }

        return false;
    }

    private static boolean isL2Entry(BaseEntryInfo entry) {
        return entry instanceof L2EntryNew || entry instanceof L2EntryUpdate;
    }

    private static boolean isL3Entry(BaseEntryInfo entry) {
        return entry instanceof L3EntryNew || entry instanceof L3EntryUpdate;
    }

}
