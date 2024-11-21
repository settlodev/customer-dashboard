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
    EXPIRED = "EXPIRED",
    DUE="DUE",
    OK="OK",
    PAST_DUE="PAST_DUE",
}

export enum discountType {
    FIXED = "FIXED",
    PERCENTAGE = "PERCENTAGE",
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
    NEWSTOCK="NEW STOCK",
    INVENTORYRECOUNT = "INVENTORY RECOUNT",
    DAMAGE = 'DAMAGE',
    THEFT = ' THEFT',
    INTERNALUSE = 'INTERNAL USE'
}
