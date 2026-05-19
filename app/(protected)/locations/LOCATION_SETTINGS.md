# Location Settings — Implementation Reference

## Overview

**LocationSetting** holds all operational configuration for a single Settlo location — POS behavior, receipt formatting, stock deduction modes, ticket printing, notifications, order handling, and more. Each Location has exactly one LocationSetting, auto-created with defaults when the location is created.

---

## Architecture

```
Location (1) ──── (1) LocationSetting
```

- **LocationSetting** is linked to Location via a `OneToOne` relationship (`mappedBy = "setting"`)
- Auto-created by `LocationSetting.createDefault(currencyCode)` during location creation
- Both entities extend `BaseEntity` (id, isArchived, status, canDelete, dateCreated, lastUpdated)

---

## REST API Endpoints

### Location Settings — `/api/location-settings/{locationId}`

| Method | Path | Description | Request Body | Response | Status |
|---|---|---|---|---|---|
| GET | `/` | Get settings for a location | — | `LocationSettingResponseDto` | 200 |
| GET | `/{id}` | Get a specific setting by ID | — | `LocationSettingResponseDto` | 200 |
| PUT | `/{id}` | Update settings (partial) | `LocationSettingUpdateDTO` | `LocationSettingResponseDto` | 200 |

**Note:** The `{id}` is the LocationSetting UUID (not the Location UUID). Get it from `LocationResponseDto.settings.id`.

### Notification Shortcut — `/api/locations/{businessId}`

| Method | Path | Description | Request Body | Response | Status |
|---|---|---|---|---|---|
| PUT | `/update-notifications/{locationId}` | Update notification settings only | `NotificationsUpdateDTO` | UUID | 200 |

---

## DTOs

### LocationSettingUpdateDTO (request — partial update)

All fields are optional. Only non-null fields are applied using `NullAwareBeanUtils.copyNonNullProperties()`.

```json
{
  "currencyCode": "TZS",
  "minimumSettlementAmount": 1000.00,
  "systemPasscode": "1234",
  "reportsPasscode": "5678",
  "isDefault": false,
  "ecommerceEnabled": true,
  "enableEmailNotifications": true,
  "enableSmsNotifications": false,
  "enablePushNotifications": true,
  "enableOrdersPrintsCount": false,
  "useRecipe": false,
  "usePasscode": true,
  "useDepartments": false,
  "useCustomPrice": false,
  "useWarehouse": false,
  "useShifts": true,
  "useKds": false,
  "showPosProductQuantity": true,
  "showPosProductPrice": true,
  "isActive": true,
  "acceptOrderRequests": true,
  "printEachTicketItem": false,
  "ticketToHaveAmount": true,
  "singleTicketPrint": false,
  "showPriceOnTicket": true,
  "allowTipping": true,
  "deductStockOnItemChange": true,
  "deductStockOnOrderClose": false,
  "deductStockOnPartialPay": false,
  "autoCloseOrderWhenFullyPaid": true,
  "autoPrintTickets": false,
  "showQrCodeOnReceipt": true,
  "showImageOnReceipt": true,
  "showAdditionalDetailsOnPhysicalReceipt": true,
  "showAdditionalDetailsOnDigitalReceipt": true,
  "showDateOnOrderNumber": true,
  "showOrderNumberPrefix": true,
  "orderNumberPrefix": "Order",
  "autoOpenCashDrawer": false,
  "autoPrintReceiptAfterSale": true,
  "orderRequestAcceptStartTime": "08:00:00",
  "orderRequestAcceptEndTime": "22:00:00",

  "enableCustomerLoyaltyPoints": true,
  "customerLoyaltyAwardType": "PER_ORDER",
  "customerLoyaltyPointsPerOrder": 10,
  "customerLoyaltyPointsPerValue": 1,
  "customerLoyaltyValueThreshold": 1000.00,
  "customerLoyaltyMinimumRedeemablePoints": 50,

  "enableStaffPoints": true,
  "staffPointsAwardType": "PER_ORDER_VALUE",
  "staffPointsPerOrder": 5,
  "staffPointsPerValue": 1,
  "staffPointsValueThreshold": 5000.00,
  "staffMinimumRedeemablePoints": 100,
  "staffPointsRecipient": "FINISHED_BY"
}
```

**Validation rules:**
| Field | Max Length | Notes |
|---|---|---|
| currencyCode | — | Not blank if present |
| systemPasscode | 255 | Not blank if present |
| reportsPasscode | — | Not blank if present |
| orderNumberPrefix | — | Defaults to `"Order"` if sent as blank |
| orderRequestAcceptStartTime | — | LocalTime. Must pair with endTime |
| orderRequestAcceptEndTime | — | LocalTime. Must pair with startTime. Start must be before end |

### LocationSettingResponseDto (response)

```json
{
  "id": "uuid",
  "locationId": "uuid",
  "currencyCode": "TZS",
  "minimumSettlementAmount": 1000.00,
  "systemPasscode": "1234",
  "reportsPasscode": "5678",
  "isDefault": false,
  "ecommerceEnabled": true,
  "enableEmailNotifications": true,
  "enableSmsNotifications": false,
  "enablePushNotifications": true,
  "enableOrdersPrintsCount": false,
  "useRecipe": false,
  "usePasscode": true,
  "useDepartments": false,
  "useCustomPrice": false,
  "useWarehouse": false,
  "useShifts": true,
  "useKds": false,
  "showPosProductQuantity": true,
  "showPosProductPrice": true,
  "isActive": true,
  "acceptOrderRequests": true,
  "printEachTicketItem": false,
  "ticketToHaveAmount": true,
  "singleTicketPrint": false,
  "showPriceOnTicket": true,
  "allowTipping": true,
  "deductStockOnItemChange": true,
  "deductStockOnOrderClose": false,
  "deductStockOnPartialPay": false,
  "autoCloseOrderWhenFullyPaid": true,
  "autoPrintTickets": false,
  "showQrCodeOnReceipt": true,
  "showImageOnReceipt": true,
  "showAdditionalDetailsOnPhysicalReceipt": true,
  "showAdditionalDetailsOnDigitalReceipt": true,
  "showDateOnOrderNumber": true,
  "orderNumberPrefix": "Order",
  "autoOpenCashDrawer": false,
  "autoPrintReceiptAfterSale": true,
  "canDelete": true,
  "status": true,
  "isArchived": false,

  "enableCustomerLoyaltyPoints": true,
  "customerLoyaltyAwardType": "PER_ORDER",
  "customerLoyaltyPointsPerOrder": 10,
  "customerLoyaltyPointsPerValue": 1,
  "customerLoyaltyValueThreshold": 1000.00,
  "customerLoyaltyMinimumRedeemablePoints": 50,

  "enableStaffPoints": true,
  "staffPointsAwardType": "PER_ORDER_VALUE",
  "staffPointsPerOrder": 5,
  "staffPointsPerValue": 1,
  "staffPointsValueThreshold": 5000.00,
  "staffMinimumRedeemablePoints": 100,
  "staffPointsRecipient": "FINISHED_BY"
}
```

### NotificationsUpdateDTO (request — notifications shortcut)

All three fields are required (`@NotNull`).

```json
{
  "enableEmailNotification": true,
  "enablePushNotification": true,
  "enableSmsNotification": false
}
```

---

## Settings Categories Quick Reference

### General

| Field | Type | Default | Purpose |
|---|---|---|---|
| currencyCode | String (max 5) | from country | Location currency |
| minimumSettlementAmount | BigDecimal | 0 | Minimum payout amount |
| isDefault | Boolean | false | Whether this is the default location |
| isActive | Boolean | true | Whether the location is actively operating |

### Security / Passcodes

| Field | Type | Default | Purpose |
|---|---|---|---|
| systemPasscode | String | "0000" | System-level access passcode |
| reportsPasscode | String | "0000" | Reports section passcode |
| usePasscode | Boolean | false | Enable/disable passcode requirement |

### Feature Toggles

| Field | Type | Default | Purpose |
|---|---|---|---|
| ecommerceEnabled | Boolean | false | Enable e-commerce for this location |
| useRecipe | Boolean | false | Enable recipe management |
| useDepartments | Boolean | false | Enable department-based organization |
| useCustomPrice | Boolean | false | Allow custom pricing at POS |
| useWarehouse | Boolean | false | Enable warehouse/inventory management |
| useShifts | Boolean | false | Enable shift management |
| useKds | Boolean | false | Enable Kitchen Display System |

### Notifications

| Field | Type | Default | Purpose |
|---|---|---|---|
| enableEmailNotifications | Boolean | true | Email notification channel |
| enableSmsNotifications | Boolean | true | SMS notification channel |
| enablePushNotifications | Boolean | true | Push notification channel |

### POS Display

| Field | Type | Default | Purpose |
|---|---|---|---|
| showPosProductQuantity | Boolean | true | Show product quantity on POS |
| showPosProductPrice | Boolean | true | Show product price on POS |

### Orders

| Field | Type | Default | Purpose |
|---|---|---|---|
| acceptOrderRequests | Boolean | true | Whether to accept incoming order requests |
| orderRequestAcceptStartTime | LocalTime | null | Start of order acceptance window |
| orderRequestAcceptEndTime | LocalTime | null | End of order acceptance window |
| autoCloseOrderWhenFullyPaid | Boolean | true | Auto-close orders once fully paid |
| enableOrdersPrintsCount | Boolean | true | Track print count per order |

### Order Numbers

| Field | Type | Default | Purpose |
|---|---|---|---|
| showDateOnOrderNumber | Boolean | true | Include date in order number |
| showOrderNumberPrefix | Boolean | — | Show/hide the prefix label |
| orderNumberPrefix | String | "Order" | Prefix text for order numbers (defaults to "Order" if blank) |

### Tickets / Kitchen Printing

| Field | Type | Default | Purpose |
|---|---|---|---|
| printEachTicketItem | Boolean | false | Print each item on its own ticket |
| ticketToHaveAmount | Boolean | false | Show amounts on kitchen tickets |
| singleTicketPrint | Boolean | false | Print all items on a single ticket |
| showPriceOnTicket | Boolean | false | Show prices on kitchen tickets |
| autoPrintTickets | Boolean | false | Auto-print tickets when order is placed |

### Receipts

| Field | Type | Default | Purpose |
|---|---|---|---|
| showQrCodeOnReceipt | Boolean | false | Print QR code on receipts |
| showImageOnReceipt | Boolean | false | Print image/logo on receipts |
| showAdditionalDetailsOnPhysicalReceipt | Boolean | false | Extra details on printed receipts |
| showAdditionalDetailsOnDigitalReceipt | Boolean | false | Extra details on digital receipts |
| autoPrintReceiptAfterSale | Boolean | false | Auto-print receipt when sale completes |

### Stock Deduction

| Field | Type | Default | Purpose |
|---|---|---|---|
| deductStockOnItemChange | Boolean | true | Deduct stock when items are added/modified |
| deductStockOnOrderClose | Boolean | false | Deduct stock when order is closed |
| deductStockOnPartialPay | Boolean | false | Deduct stock on partial payment |

**Note:** These are mutually exclusive modes — typically only one should be `true`. The system queries these via `getStockDeductionModesByOrderId()`.

### Payments

| Field | Type | Default | Purpose |
|---|---|---|---|
| allowTipping | Boolean | false | Allow customers to add tips |
| autoOpenCashDrawer | Boolean | false | Auto-open cash drawer on payment |

### Customer Loyalty Points

| Field | Type | Default | Purpose |
|---|---|---|---|
| enableCustomerLoyaltyPoints | Boolean | false | Master toggle for customer loyalty program |
| customerLoyaltyAwardType | Enum | PER_ORDER | How points are earned: `PER_ORDER` (flat per order) or `PER_ORDER_VALUE` (based on order amount) |
| customerLoyaltyPointsPerOrder | Integer | 0 | Points earned per closed order (when award type is PER_ORDER) |
| customerLoyaltyPointsPerValue | Integer | 0 | Points earned per value threshold reached (when award type is PER_ORDER_VALUE) |
| customerLoyaltyValueThreshold | BigDecimal | 0 | Amount needed to earn `customerLoyaltyPointsPerValue` points (e.g., 1000 = 1 point per 1000 TZS) |
| customerLoyaltyMinimumRedeemablePoints | Integer | 0 | Minimum points a customer must accumulate before redeeming |

### Staff Points

| Field | Type | Default | Purpose |
|---|---|---|---|
| enableStaffPoints | Boolean | false | Master toggle for staff points program |
| staffPointsAwardType | Enum | PER_ORDER | How points are earned: `PER_ORDER` or `PER_ORDER_VALUE` |
| staffPointsPerOrder | Integer | 0 | Points earned per closed order (when award type is PER_ORDER) |
| staffPointsPerValue | Integer | 0 | Points earned per value threshold reached (when award type is PER_ORDER_VALUE) |
| staffPointsValueThreshold | BigDecimal | 0 | Amount needed to earn `staffPointsPerValue` points |
| staffMinimumRedeemablePoints | Integer | 0 | Minimum points before staff can redeem |
| staffPointsRecipient | Enum | FINISHED_BY | Who receives the points: `FINISHED_BY`, `ASSIGNED_TO`, or `SPLIT` |

---

## Key Business Logic

### Settings Update Flow

1. Client sends `PUT /api/location-settings/{locationId}/{settingId}` with `LocationSettingUpdateDTO`
2. Service verifies the setting exists for the given location
3. `orderNumberPrefix` is defaulted to `"Order"` if sent as blank
4. Non-null fields are copied from DTO to entity using `NullAwareBeanUtils.copyNonNullProperties()`
5. Order request time range is validated:
   - Both `orderRequestAcceptStartTime` and `orderRequestAcceptEndTime` must be provided together, or both null
   - Start time must be before end time
6. Entity is saved
7. EntityManager is flushed and cleared
8. Two Kafka events are published:
   - `LOCATION_SETTINGS_UPDATED` — with the updated `LocationSettingResponseDto`
   - `LOCATION_UPDATED` — with the full `LocationResponseDto`
9. Returns the updated `LocationSettingResponseDto`

### Notifications Update Flow (Shortcut)

1. Client sends `PUT /api/locations/{businessId}/update-notifications/{locationId}` with `NotificationsUpdateDTO`
2. Updates only the three notification booleans directly via a `@Modifying` repository query
3. Returns the location UUID

### Default Settings Creation

When a location is created, `LocationSetting.createDefault(currencyCode)` is called with the country's currency code. Default values:

| Field | Default |
|---|---|
| systemPasscode / reportsPasscode | "0000" |
| minimumSettlementAmount | 0 |
| All notifications | true |
| ecommerceEnabled | false |
| useRecipe / useDepartments / useCustomPrice / useWarehouse / useShifts / useKds | false |
| usePasscode | false |
| showPosProductQuantity / showPosProductPrice | true |
| isActive | true |
| acceptOrderRequests | true |
| All ticket printing options | false |
| allowTipping | false |
| deductStockOnItemChange | true |
| deductStockOnOrderClose / deductStockOnPartialPay | false |
| autoCloseOrderWhenFullyPaid | true |
| All receipt options | false |
| orderNumberPrefix | "Order" |
| showDateOnOrderNumber | true |
| autoOpenCashDrawer / autoPrintReceiptAfterSale | false |
| enableCustomerLoyaltyPoints / enableStaffPoints | false |
| customerLoyaltyAwardType / staffPointsAwardType | PER_ORDER |
| All loyalty points/value/threshold fields | 0 |
| staffPointsRecipient | FINISHED_BY |

### Stock Deduction Modes

The repository exposes `getStockDeductionModesByOrderId()` which returns the three stock deduction flags for a given order's location. This is used internally by the order processing pipeline to determine when to deduct inventory.

### Order Request Time Window

The repository exposes `fetchOrderRequestSettingStatusByLocation()` which checks whether a location accepts order requests and whether the current time falls within the configured acceptance window. Used to validate incoming order requests.

### Loyalty Points Accumulation

Points are awarded automatically when an order is **closed** (status transitions to `CLOSED`). This happens via `LoyaltyPointsService.awardPointsOnOrderClose()`, triggered from `OrderTotalsCalculator` when an order is auto-closed after being fully paid.

**Award Type: PER_ORDER**
- A flat number of points is awarded per closed order
- Customer gets `customerLoyaltyPointsPerOrder` points
- Staff gets `staffPointsPerOrder` points

**Award Type: PER_ORDER_VALUE**
- Points are calculated based on the order's `netAmount` relative to the configured value threshold
- Formula: `points = floor(totalValue / valueThreshold) * pointsPerValue`
- **Carry-over:** The remainder that didn't reach a full threshold is saved to `loyaltyPointsCarryOver` on the Customer/Staff entity and added to the next order's value. No points are ever lost.
- Example: threshold=1000, pointsPerValue=1, order netAmount=2500, existing carryOver=300
  - totalValue = 2500 + 300 = 2800
  - Full thresholds = floor(2800 / 1000) = 2 → awards **2 points**
  - New carryOver = 2800 - 2000 = **800** (saved for next order)

**Staff Points Distribution (`staffPointsRecipient`):**
| Value | Behavior |
|---|---|
| `FINISHED_BY` | All points go to the staff member who finished/closed the order |
| `ASSIGNED_TO` | All points go to the staff member assigned to the order |
| `SPLIT` | Points split between both. If same person, they get full amount. If different, finishedBy gets `ceil(points/2)`, assignedTo gets `floor(points/2)` |

**Entities involved:**
- `Customer.loyaltyPoints` (Integer) — accumulated customer points
- `Customer.loyaltyPointsCarryOver` (BigDecimal) — remainder for PER_ORDER_VALUE mode
- `Staff.loyaltyPoints` (Integer) — accumulated staff points
- `Staff.loyaltyPointsCarryOver` (BigDecimal) — remainder for PER_ORDER_VALUE mode

Points are updated atomically via `@Modifying` JPQL queries (`addLoyaltyPoints`, `addLoyaltyPointsWithCarryOver`) to avoid race conditions.

---

## Important Notes

- **Partial updates only** — the settings update endpoint uses `NullAwareBeanUtils` so you only need to send fields you want to change
- **Kafka events** — every settings update publishes two events (`LOCATION_SETTINGS_UPDATED` + `LOCATION_UPDATED`), which other services may consume
- The **notification shortcut** endpoint (`/update-notifications`) is on the Location controller, not the LocationSetting controller
- `orderNumberPrefix` silently defaults to `"Order"` if you send an empty string — it will never be stored as blank
- The `settingId` needed for the PUT endpoint is found in the `LocationResponseDto` at `settings.id`
- `showOrderNumberPrefix` exists in the update DTO but is NOT present on the entity or response DTO — it controls display behavior on the client only

---

## File Structure

```
src/main/java/co/tz/settlo/api/controllers/
├── location_setting/
│   ├── LocationSetting.java             # JPA entity (~50 config fields + createDefault factory)
│   ├── LocationSettingRepository.java   # Spring Data JPA repository + custom queries
│   ├── LocationSettingService.java      # Business logic (get, update, mapping, validation)
│   ├── LocationSettingResource.java     # REST controller (/api/location-settings/{locationId})
│   ├── dtos/
│   │   ├── LocationSettingUpdateDTO.java    # Request DTO (partial update)
│   │   └── OrderRequestSettingStatus.java   # Projection for order request validation
│   ├── daos/
│   │   ├── StockDeductionModes.java         # Projection for stock deduction flags
│   │   └── LoyaltyPointsSettings.java      # Projection for loyalty points settings
│   └── enums/
│       ├── StockDeductionMode.java          # Stock deduction mode enum
│       ├── LoyaltyPointsAwardType.java      # PER_ORDER | PER_ORDER_VALUE
│       └── StaffPointsRecipient.java        # FINISHED_BY | ASSIGNED_TO | SPLIT
├── loyalty/
│   └── LoyaltyPointsService.java       # Points accumulation logic (customer + staff)

Settlo Common/src/main/java/co/tz/settlo/common/dto/location/
└── LocationSettingResponseDto.java      # Response DTO
```
