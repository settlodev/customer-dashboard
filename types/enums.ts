export enum Gender {
    MALE = "MALE",
    FEMALE = "FEMALE",
    UNDISCLOSED = "UNDISCLOSED",
}

export enum BusinessType {
    RETAIL = "RETAIL",
    HOSPITALITY = "HOSPITALITY",

}

export enum subscriptionStatus {
    TRIAL = "TRIAL",
    ACTIVE = "ACTIVE",
    PAST_DUE = "PAST_DUE",
    EXPIRED = "EXPIRED",
    SUSPENDED = "SUSPENDED",
}

export enum discountType {
    FIXED = "FIXED",
    PERCENTAGE = "PERCENTAGE",
}
export enum discountUsage{
    ONCE = "ONCE",
    REPEATED = "REPEATED",
}

export enum broadcastType {
    SMS = "SMS",
    EMAIL = "EMAIL",
    NOTIFICATION = "NOTIFICATION",
}

export enum audienceType{
    ALL="ALL",
    CUSTOMER="CUSTOMER",
    STAFF = "STAFF",
}

export enum reasonForStockModification {
    INVENTORYRECOUNT = "INVENTORY RECOUNT",
    DAMAGE = 'DAMAGE',
    THEFT = ' THEFT',
    INTERNALUSE = 'INTERNAL USE'
}


export enum orderStatus {
    PENDING = "PENDING",
    PROCESSING = "PROCESSING",
    DELIVERED = "DELIVERED",
    CANCELLED = "CANCELLED",
    RETURNED = "RETURNED",
    COMPLETED = "COMPLETED",
}

export enum orderType {
    DIRECT = "DIRECT SALE",
    CREDIT = "CREDIT SALE",
}

export enum invoiceStatus{
    PAID = "PAID",
    NOT_PAID = "UNPAID",
    PARTIALLY_PAID = "PARTIALLY PAID",
}

export enum TableSpaceType {
    TABLE = "TABLE",
    SEAT = "SEAT",
    ROOM = "ROOM",
    SECTION = "SECTION",
    TERRACE = "TERRACE",
    BAR = "BAR",
    COUNTER = "COUNTER",
    HALL = "HALL",
}

export enum TableStatus {
    AVAILABLE = "AVAILABLE",
    RESERVED = "RESERVED",
    SEATED = "SEATED",
    OCCUPIED = "OCCUPIED",
    DIRTY = "DIRTY",
    OUT_OF_SERVICE = "OUT_OF_SERVICE",
}

export enum CustomerSource {
    POS = "POS",
    ONLINE = "ONLINE",
    GOOGLE = "GOOGLE",
    INSTAGRAM = "INSTAGRAM",
    REFERRAL = "REFERRAL",
    WALK_IN = "WALK_IN",
}

export enum CustomerCreatedFrom {
    POS = "POS",
    MOBILE_APP = "MOBILE_APP",
    WEBSITE = "WEBSITE",
    RESERVATION = "RESERVATION",
}

export enum AddressType {
    HOME = "HOME",
    WORK = "WORK",
    OTHER = "OTHER",
}

export enum ReservationStatus {
    PENDING = "PENDING",
    CONFIRMED = "CONFIRMED",
    SEATED = "SEATED",
    COMPLETED = "COMPLETED",
    CANCELLED = "CANCELLED",
    NO_SHOW = "NO_SHOW",
}

export enum DepositPaymentStatus {
    NOT_REQUIRED = "NOT_REQUIRED",
    PENDING = "PENDING",
    PAID = "PAID",
    FAILED = "FAILED",
    REFUNDED = "REFUNDED",
}

export enum ReservationExceptionType {
    CLOSED = "CLOSED",
    PRIVATE_EVENT = "PRIVATE_EVENT",
    HOLIDAY = "HOLIDAY",
    MAINTENANCE = "MAINTENANCE",
    BLOCKED = "BLOCKED",
}

