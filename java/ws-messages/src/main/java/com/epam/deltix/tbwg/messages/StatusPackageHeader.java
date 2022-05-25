package com.epam.deltix.tbwg.messages;

import com.epam.deltix.timebase.messages.*;
import com.epam.deltix.timebase.messages.universal.PackageHeader;

@SchemaElement(
    name = "deltix.tbwg.messages.StatusPackageHeader"
)
public class StatusPackageHeader extends PackageHeader {
    public static final String CLASS_NAME = StatusPackageHeader.class.getName();

    protected long exchangeId = TypeConstants.EXCHANGE_NULL;

    protected SecurityStatus status = null;

    /**
     * @return Exchange Id
     */
    @SchemaElement(
        title = "Exchange Id"
    )
    @SchemaType(
        encoding = "ALPHANUMERIC(10)",
        isNullable = true,
        dataType = SchemaDataType.VARCHAR
    )
    public long getExchangeId() {
        return exchangeId;
    }

    /**
     * @param value - Exchange Id
     */
    public void setExchangeId(long value) {
        this.exchangeId = value;
    }

    /**
     * @return true if Exchange Idis not null
     */
    public boolean hasExchangeId() {
        return exchangeId != TypeConstants.EXCHANGE_NULL;
    }

    public void nullifyExchangeId() {
        this.exchangeId = TypeConstants.EXCHANGE_NULL;
    }

    /**
     * @return Status
     */
    @SchemaElement(
        title = "Status"
    )
    @SchemaType(
        isNullable = true
    )
    public SecurityStatus getStatus() {
        return status;
    }

    /**
     * @param value - Status
     */
    public void setStatus(SecurityStatus value) {
        this.status = value;
    }

    /**
     * @return true if Statusis not null
     */
    public boolean hasStatus() {
        return status != null;
    }

    public void nullifyStatus() {
        this.status = null;
    }

    /**
     * Creates new instance of this class.
     * @return new instance of this class.
     */
    @Override
    protected StatusPackageHeader createInstance() {
        return new StatusPackageHeader();
    }

    /**
     * Method nullifies all instance properties
     */
    @Override
    public StatusPackageHeader nullify() {
        super.nullify();
        nullifyExchangeId();
        nullifyStatus();
        return this;
    }

    /**
     * Resets all instance properties to their default values
     */
    @Override
    public StatusPackageHeader reset() {
        super.reset();
        exchangeId = TypeConstants.EXCHANGE_NULL;
        status = null;
        return this;
    }

    /**
     * Method copies state to a given instance
     */
    @Override
    public StatusPackageHeader clone() {
        StatusPackageHeader t = createInstance();
        t.copyFrom(this);
        return t;
    }

    /**
     * Indicates whether some other object is "equal to" this one.
     */
    @Override
    public boolean equals(Object obj) {
        if (this == obj) return true;
        boolean superEquals = super.equals(obj);
        if (!superEquals) return false;
        if (!(obj instanceof StatusPackageHeader)) return false;
        StatusPackageHeader other =(StatusPackageHeader)obj;
        if (hasExchangeId() != other.hasExchangeId()) return false;
        if (hasExchangeId() && getExchangeId() != other.getExchangeId()) return false;
        if (hasStatus() != other.hasStatus()) return false;
        if (hasStatus() && getStatus() != other.getStatus()) return false;
        return true;
    }

    /**
     * Returns a hash code value for the object. This method is * supported for the benefit of hash tables such as those provided by.
     */
    @Override
    public int hashCode() {
        int hash = super.hashCode();
        if (hasExchangeId()) {
            hash = hash * 31 + ((int)(getExchangeId() ^ (getExchangeId() >>> 32)));
        }
        if (hasStatus()) {
            hash = hash * 31 + getStatus().getNumber();
        }
        return hash;
    }

    /**
     * Method copies state to a given instance
     * @param template class instance that should be used as a copy source
     */
    @Override
    public StatusPackageHeader copyFrom(RecordInfo template) {
        super.copyFrom(template);
        if (template instanceof StatusPackageHeader) {
            StatusPackageHeader t = (StatusPackageHeader)template;
            if (t.hasExchangeId()) {
                setExchangeId(t.getExchangeId());
            } else {
                nullifyExchangeId();
            }
            if (t.hasStatus()) {
                setStatus(t.getStatus());
            } else {
                nullifyStatus();
            }
        }
        return this;
    }

}
