package com.epam.deltix.tbwg.utils.qql;

import com.epam.deltix.gflog.api.Log;
import com.epam.deltix.gflog.api.LogFactory;
import com.epam.deltix.qsrv.hf.pub.md.*;
import com.epam.deltix.qsrv.hf.tickdb.pub.DXTickDB;
import com.epam.deltix.qsrv.hf.tickdb.pub.DXTickStream;
import com.epam.deltix.qsrv.hf.tickdb.pub.RawMessageHelper;
import com.epam.deltix.qsrv.hf.tickdb.pub.SelectionOptions;
import com.epam.deltix.qsrv.hf.tickdb.pub.query.InstrumentMessageSource;

import javax.annotation.Nonnull;
import java.util.*;

/**
 * @author Daniil Yarmalkevich
 * Date: 6/20/2019
 */
@Deprecated
public class SelectBuilder {

    private static final Log LOG = LogFactory.getLog(SelectBuilder.class);

    private final List<String> options = new LinkedList<>();
    private final Map<String, DataType> fields = new HashMap<>();
    private final Set<String> selectedFields = new HashSet<>();
    private final DXTickStream stream;
    private final DXTickDB db;
    private long startTime = Long.MIN_VALUE;
    private String[] types = null;
    private String[] symbols = null;

    private SelectBuilder(DXTickDB db, DXTickStream stream) {
        for (ClassDescriptor desc : stream.getAllDescriptors()) {
            if (desc instanceof RecordClassDescriptor) {
                RecordClassDescriptor rDesc = (RecordClassDescriptor) desc;
                for (DataField field : rDesc.getFields()) {
                    this.fields.put(field.getName(), field.getType());
                }
            }
        }
        this.fields.put("symbol", new VarcharDataType("UTF8", false, false));
        this.fields.put("timestamp", new DateTimeDataType(false));
        //this.fields.put("instrumentType", new EnumDataType(false, new EnumClassDescriptor(InstrumentType.class)));
        this.stream = stream;
        this.db = db;
    }

    public Field field(String field) throws NoSuchFieldException {
        if (fields.containsKey(field)) {
            return new Field(field);
        } else {
            throw new NoSuchFieldException(field);
        }
    }

    public SelectBuilder selectFields(String ... selectFields) throws NoSuchFieldException {
        for (String field : selectFields) {
            if (fields.containsKey(field)) {
                selectedFields.add(field);
            } else {
                throw new NoSuchFieldException(field);
            }
        }
        return this;
    }

    public SelectBuilder selectFields(List<String> selectFields) throws NoSuchFieldException {
        for (String field : selectFields) {
            if (fields.containsKey(field)) {
                selectedFields.add(field);
            } else {
                throw new NoSuchFieldException(field);
            }
        }
        return this;
    }

    public SelectBuilder startTime(long startTime) {
        this.startTime = startTime;
        return this;
    }

    public SelectBuilder types(String[] types) {
        this.types = types;
        return this;
    }

    public SelectBuilder symbols(String[] symbols) {
        this.symbols = symbols;
        return this;
    }

//    public SelectBuilder identities(IdentityKey[] ids) {
//        Stream<CharSequence> list = ids != null ? Arrays.stream(ids).map(IdentityKey::getSymbol) : null;
//        this.symbols = list.toArray()
//        return this;
//    }

    public InstrumentMessageSource executeRaw() {
        if (db != null) {
            String query = toString();
            LOG.info().append("Executing query: ").append(query).commit();
            return db.executeQuery(query, new SelectionOptions(true, false), null, symbols, startTime);
        } else {
            throw new IllegalArgumentException("DB is null.");
        }
    }

    @Deprecated
    public static SelectBuilder builder(DXTickStream stream) {
        return new SelectBuilder(null, stream);
    }

    public static SelectBuilder builder(@Nonnull DXTickDB db, @Nonnull DXTickStream stream) {
        return new SelectBuilder(db, stream);
    }

    public static SelectBuilder builder(@Nonnull DXTickDB db, @Nonnull String stream) {
        return new SelectBuilder(db, db.getStream(stream));
    }

    @Override
    public String toString() {
        StringBuilder sb = new StringBuilder("select ");
        sb.append(selectedFields.isEmpty() ? "*": String.join(",", selectedFields));
        sb.append(" from \"").append(stream.getKey()).append("\"");
        if (!options.isEmpty()) {
            sb.append(" where ").append(String.join(" and ", options));
        }
        return sb.toString();
    }

    public class NoSuchFieldException extends Exception {

        private final String field;

        public NoSuchFieldException(String field) {
            this.field = field;
        }

        @Override
        public String getMessage() {
            return String.format("There's no field %s in descriptors of stream %s", field, stream.getKey());
        }

        @Override
        public String toString() {
            return "{\"type\":\"NoSuchField\",\"field\":\"" + field + "\"}";
        }
    }

    public class WrongTypeException extends Exception {
        private final String field;
        private final String value;
        private final DataType expected;

        public WrongTypeException(String field, String value, DataType expected) {
            this.field = field;
            this.value = value;
            this.expected = expected;
        }

        @Override
        public String getMessage() {
            return String.format("Couldn't parse value %s to datatype %s for field %s.", value,
                    expected.getClass().getSimpleName(), field);
        }

        @Override
        public String toString() {
            return "{\"type\":\"WrongType\",\"field\":\"" + field + "\",\"value\":\"" + value + "\",\"expected\":\"" +
                    expected.getClass().getSimpleName() + "\"}";
        }
    }

    public class Field {

        private final String name;

        public Field(String name) {
            this.name = name;
        }

        public SelectBuilder equalTo(String value) throws WrongTypeException {
            return compare(value, "=");
        }

        public SelectBuilder equalTo(String... values) throws WrongTypeException {
            return set(true, values);
        }

        private void appendStringSet(List<Object> list, StringBuilder sb) {
            sb.append("(");
            for (int i = 0; i < list.size() - 1; i++) {
                Object value = list.get(i);
                if (value != null) {
                    sb.append('\'').append(value).append("', ");
                } else {
                    sb.append(value).append(", ");
                }
            }
            Object value = list.get(list.size() - 1);
            if (value != null) {
                sb.append('\'').append(value).append("')");
            } else {
                sb.append(value).append(')');
            }
        }

        private void appendSet(List<Object> list, StringBuilder sb) {
            sb.append("(");
            if (list.size() != 0) {
                for (int i = 0; i < list.size() - 1; i++) {
                    sb.append(list.get(i)).append(", ");
                }
                sb.append(list.get(list.size() - 1));
            }
            sb.append(")");
        }

        public SelectBuilder equalTo(Collection<String> values) throws WrongTypeException {
            String[] array = values.toArray(new String[]{});
            if (array.length == 1) {
                return equalTo(array[0]);
            } else {
                return equalTo(array);
            }
        }

        public SelectBuilder lessThan(String value) throws WrongTypeException {
            return compare(value, "<");
        }

        public SelectBuilder notGreaterThan(String value) throws WrongTypeException {
            return compare(value, "<=");
        }

        public SelectBuilder notLessThan(String value) throws WrongTypeException {
            return compare(value, ">=");
        }

        public SelectBuilder greaterThan(String value) throws WrongTypeException {
            return compare(value, ">");
        }

        public SelectBuilder notEqualTo(String value) throws WrongTypeException {
            return compare(value, "!=");
        }

        public SelectBuilder notEqualTo(String... values) throws WrongTypeException {
            return set(false, values);
        }

        public SelectBuilder notEqualTo(Collection<String> values) throws WrongTypeException {
            String[] array = values.toArray(new String[]{});
            if (array.length == 1) {
                return notEqualTo(array[0]);
            } else {
                return notEqualTo(array);
            }
        }

        public SelectBuilder notNull() throws WrongTypeException {
            return compare(null, "!=");
        }

        public SelectBuilder isNull() throws WrongTypeException {
            return compare(null, "=");
        }

        private SelectBuilder set(boolean in, String... values) throws WrongTypeException {
            ArrayList<Object> parsed = new ArrayList<>();
            DataType type = fields.get(name);
            boolean hasNull = false;
            for (String v : values) {
                if (v == null) {
                    hasNull = true;
                } else {
                    parsed.add(parseValue(type, v));
                }
            }
            StringBuilder sb = new StringBuilder();
            sb.append('(');
            if (in) {
                sb.append(name).append(" in ");
            } else {
                sb.append(name).append(" not in ");
            }
            if (type instanceof VarcharDataType) {
                appendStringSet(parsed, sb);
            } else {
                appendSet(parsed, sb);
            }
            if (hasNull) {
                if (in) {
                    sb.append(" or ").append(name);
                    sb.append(" = null");
                } else {
                    sb.append(" and ").append(name);
                    sb.append(" != null");
                }
            }
            sb.append(')');
            options.add(sb.toString());
            return SelectBuilder.this;
        }

        private SelectBuilder compare(String value, String operator) throws WrongTypeException {
            Object o;
            DataType type = fields.get(name);
            o = parseValue(type, value);
            if (value != null && type instanceof VarcharDataType) {
                options.add('(' + name + ' ' + operator + " '" + o + "'" + ')');
            } else {
                options.add('(' + name + ' ' + operator + ' ' + o + ')');
            }
            return SelectBuilder.this;
        }

        public SelectBuilder between(String lowerBound, String upperBound) throws WrongTypeException {
            Object o1, o2;
            DataType type = fields.get(name);
            o1 = parseValue(type, lowerBound);
            o2 = parseValue(type, upperBound);
            if (type instanceof VarcharDataType) {
                options.add('(' + name + " between '" + o1 + "' and '" + o2 + '\'' + ')');
            } else {
                options.add('(' + name + " between " + o1 + " and " + o2 + ')');
            }
            return SelectBuilder.this;
        }

        private Object parseValue(DataType dataType, String value) throws WrongTypeException {
            try {
                return RawMessageHelper.parseValue(dataType, value);
            } catch (IllegalArgumentException exc) {
                throw new WrongTypeException(name, value, dataType);
            }
        }

    }

//    public static void main(String[] args) throws NoSuchFieldException, WrongTypeException {
//        try (DXTickDB db = TickDBFactory.createFromUrl("dxtick://localhost:4242")) {
//            db.open(true);
//            DXTickStream stream = db.getStream("securities.BINANCE");
//            SelectBuilder builder = new SelectBuilder(stream)
//                    .field("symbol").equalTo("ETH/BTC", "LTC/BTC", "BNB/BTC", null)
//                    .field("minOrderSize").lessThan("0.1")
//                    .field("security").notNull()
//                    .field("minOrderPrice").between("0.00000001", "1");
//            String getQuery = builder.toString();
//            System.out.println(getQuery);
//            try (InstrumentMessageSource src = db.executeQuery(getQuery,
//                    new SelectionOptions(true, false))) {
//                while (src.next()) {
//                    System.out.println(src.getMessage());
//                }
//            }
//        }
//    }

}
