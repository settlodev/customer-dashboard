/**
 * Admin (lender-side) Loan Management types — mirror the Loan Management Service
 * (`co.tz.settlo.lms`) DTOs. Money `BigDecimal` fields serialise as JSON numbers;
 * `*Date` are `LocalDate` ("yyyy-MM-dd"), `*At` are `OffsetDateTime` ISO strings.
 *
 * These power the internal admin.localhost loans section (gated on the internal
 * `loans:*` permissions). Borrower-side types live in `types/loans/type.ts`.
 */

import { z } from "zod";

// ── Enums (LMS common) ────────────────────────────────────────────────
export type LoanProductType = "POS_DEVICE" | "STOCK" | "BUSINESS_IMPROVEMENT";
export type PayeeType = "SUPPLIER" | "MWANGA_CASA" | "IN_KIND_DEVICE";
export type RepaymentType = "INSTALLMENTS" | "SALES_HOLDBACK" | "BULLET";
export type PricingType = "FLAT_FEE" | "FACTOR_RATE" | "DECLINING_INTEREST";
export type InterestMethod = "FLAT" | "REDUCING_BALANCE" | "NONE";
export type RepaymentFrequency =
  | "DAILY"
  | "WEEKLY"
  | "BIWEEKLY"
  | "MONTHLY"
  | "BULLET";

export type ApplicationStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "IN_REVIEW"
  | "APPROVED"
  | "ACCEPTED"
  | "REJECTED"
  | "WITHDRAWN"
  | "EXPIRED";

export type LoanStatus =
  | "PENDING_DISBURSEMENT"
  | "ACTIVE"
  | "IN_ARREARS"
  | "CLOSED"
  | "DEFAULTED"
  | "WRITTEN_OFF"
  | "CANCELLED";

export type DisbursementStatus =
  | "INITIATED"
  | "SUBMITTED"
  | "CONFIRMED"
  | "FAILED"
  | "CANCELLED";

export type DisbursementMethod = "MANUAL" | "AUTOMATED";
export type FundingSourceType =
  | "OWN_EQUITY"
  | "BANK_FACILITY"
  | "INVESTOR"
  | "PARTNER";

// ── Loan product ──────────────────────────────────────────────────────

export interface LoanProductResponse {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  productType: LoanProductType;
  payeeType: PayeeType;
  repaymentType: RepaymentType;
  pricingType: PricingType;
  interestMethod: InterestMethod;
  repaymentFrequency: RepaymentFrequency;
  flatFeeRate?: number | null;
  factorRate?: number | null;
  annualInterestRate?: number | null;
  originationFeeRate?: number | null;
  minPrincipal: number;
  maxPrincipal: number;
  minTermDays: number;
  maxTermDays: number;
  maxConcurrentLoansPerBorrower: number;
  holdbackPercent?: number | null;
  processingFee?: number | null;
  minInterestRate?: number | null;
  allocationOrder?: string | null;
  gracePeriodDays?: number | null;
  penaltyRatePerDay?: number | null;
  lateFeeFlat?: number | null;
  defaultThresholdDays?: number | null;
  termsTemplate?: string | null;
  currency: string;
  active: boolean;
}

// ── Display labels & tones ────────────────────────────────────────────

export const LOAN_PRODUCT_TYPE_LABELS: Record<LoanProductType, string> = {
  POS_DEVICE: "Device financing",
  STOCK: "Stock loan",
  BUSINESS_IMPROVEMENT: "Working capital",
};

export const PRICING_TYPE_LABELS: Record<PricingType, string> = {
  FLAT_FEE: "Flat fee",
  FACTOR_RATE: "Factor rate",
  DECLINING_INTEREST: "Declining interest",
};

export const REPAYMENT_TYPE_LABELS: Record<RepaymentType, string> = {
  INSTALLMENTS: "Installments",
  SALES_HOLDBACK: "Sales holdback",
  BULLET: "Bullet",
};

export const REPAYMENT_FREQUENCY_LABELS: Record<RepaymentFrequency, string> = {
  DAILY: "Daily",
  WEEKLY: "Weekly",
  BIWEEKLY: "Bi-weekly",
  MONTHLY: "Monthly",
  BULLET: "Bullet",
};

export const APPLICATION_STATUS_TONES: Record<ApplicationStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  SUBMITTED: "bg-orange-50 text-orange-700",
  IN_REVIEW: "bg-amber-50 text-amber-700",
  APPROVED: "bg-emerald-50 text-emerald-700",
  ACCEPTED: "bg-green-50 text-green-700",
  REJECTED: "bg-red-50 text-red-700",
  WITHDRAWN: "bg-gray-100 text-gray-500",
  EXPIRED: "bg-gray-100 text-gray-500",
};

/** "1,200,000" (no currency prefix — the product carries its own currencyCode). */
export const fmtAmount = (n: number | null | undefined): string =>
  n == null || Number.isNaN(n) ? "—" : Math.round(n).toLocaleString();

export const PAYEE_TYPE_LABELS: Record<PayeeType, string> = {
  SUPPLIER: "Supplier",
  MWANGA_CASA: "Customer Account",
  IN_KIND_DEVICE: "In Kind",
};

export const INTEREST_METHOD_LABELS: Record<InterestMethod, string> = {
  FLAT: "Flat",
  REDUCING_BALANCE: "Reducing balance",
  NONE: "None (fee-based only)",
};

// ── Descriptions (shown as field hints — plain prose for non-bankers) ──

export const PAYEE_TYPE_DESCRIPTIONS: Record<PayeeType, string> = {
  SUPPLIER:
    "Funds go directly to the device vendor or stock supplier — the borrower never handles the cash. Common for POS device and stock loans.",
  MWANGA_CASA:
    "Funds are deposited into the borrower's own bank account (any bank). Used for working capital where the business needs cash in hand.",
  IN_KIND_DEVICE:
    "No cash changes hands. A physical device or goods are issued directly to the borrower at disbursement.",
};

export const PRODUCT_TYPE_DESCRIPTIONS: Record<LoanProductType, string> = {
  POS_DEVICE:
    "Finance a POS terminal or card reader. The device is the collateral — paid to the device supplier or issued directly to the borrower.",
  STOCK:
    "Finance inventory or stock purchases. Funds are sent straight to the approved supplier so the borrower can stock their shelves.",
  BUSINESS_IMPROVEMENT:
    "General working capital. Cash goes into the borrower's own bank account for business use (equipment, rent, salaries, etc.).",
};

export const PRICING_TYPE_DESCRIPTIONS: Record<PricingType, string> = {
  FLAT_FEE:
    "A one-time fee as a percentage of the loan amount — the same cost no matter how long the loan runs. E.g. 8% on TZS 500,000 = TZS 40,000 fee.",
  FACTOR_RATE:
    "Total repayable = loan amount × factor. E.g. factor 1.10 on TZS 500,000 = repay TZS 550,000 total. Simple and transparent.",
  DECLINING_INTEREST:
    "Interest is recalculated each period on the remaining balance. The borrower pays less interest over time as the principal reduces.",
};

export const INTEREST_METHOD_DESCRIPTIONS: Record<InterestMethod, string> = {
  FLAT:
    "Interest is fixed every period, calculated on the original loan amount from start to finish.",
  REDUCING_BALANCE:
    "Interest reduces each period as the borrower repays — the outstanding balance shrinks, so the interest charge shrinks with it.",
  NONE:
    "No interest is charged. All cost is expressed as a fee (flat fee or factor rate). Select Flat Fee or Factor Rate as the pricing model.",
};

export const REPAYMENT_TYPE_DESCRIPTIONS: Record<RepaymentType, string> = {
  INSTALLMENTS:
    "Borrower pays a fixed amount each period (weekly, monthly, etc.) until the full balance is cleared. The most common structure.",
  SALES_HOLDBACK:
    "A set percentage of the borrower's daily sales is automatically swept to repay the loan. Repayment follows the business's revenue.",
  BULLET:
    "No payments during the loan term. The full balance — principal, fees, and interest — is due in one lump sum on the maturity date.",
};

// Payee types valid for each product type. Other combinations are blocked.
// Rule: cash (MWANGA_CASA) can't be used for device/stock; in-kind/device can't be used for working capital.
export const ALLOWED_PAYEE_TYPES_BY_PRODUCT: Record<LoanProductType, PayeeType[]> = {
  POS_DEVICE: ["SUPPLIER", "IN_KIND_DEVICE"],
  STOCK: ["SUPPLIER"],
  BUSINESS_IMPROVEMENT: ["MWANGA_CASA"],
};

// ── Terms & conditions templates (prefilled by product type) ───────────
// {{variable}} placeholders are substituted at loan-booking time.
// Available: {{applicantName}}, {{businessName}}, {{businessRegNumber}},
//   {{borrowerPhone}}, {{borrowerEmail}}, {{applicationNumber}},
//   {{currency}}, {{loanAmount}}, {{termDays}}, {{installmentCount}},
//   {{installmentAmount}}, {{disbursementDate}}, {{maturityDate}},
//   {{gracePeriodDays}}, {{lateFeeFlat}}, {{penaltyRatePerDay}},
//   {{defaultThresholdDays}}
export const TERMS_TEMPLATE_PRESETS: Record<LoanProductType, string> = {
  POS_DEVICE: `LOAN AGREEMENT — POS DEVICE FINANCING
Application: {{applicationNumber}}

BORROWER
Name: {{applicantName}}
Business: {{businessName}} ({{businessRegNumber}})
Phone: {{borrowerPhone}}
Email: {{borrowerEmail}}

LOAN DETAILS
Amount: {{currency}} {{loanAmount}}
Term: {{termDays}} days
Repayments: {{installmentCount}} × {{currency}} {{installmentAmount}}
Disbursement Date: {{disbursementDate}}
Maturity Date: {{maturityDate}}

DEVICE CONDITIONS
The POS device provided under this agreement is and remains Settlo's property until the loan is fully repaid. The borrower agrees to:
• Keep the device in good working condition at all times.
• Not sell, transfer, pledge, or assign the device to any third party.
• Report any loss or theft to Settlo within 24 hours. The outstanding loan balance remains payable regardless.
• Not attempt to repair, unlock, or modify the device without prior written consent from Settlo.
• Return the device to Settlo on demand if the loan is in default.

REPAYMENT
Repayments are due as per the schedule issued at disbursement.
A grace period of {{gracePeriodDays}} day(s) applies after each due date.
Late payments attract a one-time flat fee of {{currency}} {{lateFeeFlat}} on the first overdue day,
plus a daily charge of {{penaltyRatePerDay}} of the unpaid balance until settled.
After {{defaultThresholdDays}} days of non-payment the loan is classified as defaulted.

CONSENT
By submitting this application, I confirm I have read, understood, and agree to all terms above.`,

  STOCK: `LOAN AGREEMENT — STOCK / INVENTORY FINANCING
Application: {{applicationNumber}}

BORROWER
Name: {{applicantName}}
Business: {{businessName}} ({{businessRegNumber}})
Phone: {{borrowerPhone}}
Email: {{borrowerEmail}}

LOAN DETAILS
Amount: {{currency}} {{loanAmount}}
Term: {{termDays}} days
Repayments: {{installmentCount}} × {{currency}} {{installmentAmount}}
Disbursement Date: {{disbursementDate}}
Maturity Date: {{maturityDate}}

PURPOSE & DISBURSEMENT
Funds are disbursed directly to the approved supplier for the purchase of stock or inventory on behalf of the borrower.
The borrower confirms that:
• The goods are intended for legitimate business use only.
• Funds will not be redirected to any purpose other than the approved stock purchase.
• The borrower remains solely responsible for full repayment regardless of stock performance or sales.

REPAYMENT
Repayments are due as per the schedule issued at disbursement.
A grace period of {{gracePeriodDays}} day(s) applies after each due date.
Late payments attract a one-time flat fee of {{currency}} {{lateFeeFlat}} on the first overdue day,
plus a daily charge of {{penaltyRatePerDay}} of the unpaid balance until settled.
After {{defaultThresholdDays}} days of non-payment the loan is classified as defaulted.

CONSENT
By submitting this application, I confirm I have read, understood, and agree to all terms above.`,

  BUSINESS_IMPROVEMENT: `LOAN AGREEMENT — WORKING CAPITAL / BUSINESS IMPROVEMENT
Application: {{applicationNumber}}

BORROWER
Name: {{applicantName}}
Business: {{businessName}} ({{businessRegNumber}})
Phone: {{borrowerPhone}}
Email: {{borrowerEmail}}

LOAN DETAILS
Amount: {{currency}} {{loanAmount}}
Term: {{termDays}} days
Repayments: {{installmentCount}} × {{currency}} {{installmentAmount}}
Disbursement Date: {{disbursementDate}}
Maturity Date: {{maturityDate}}

PURPOSE & DISBURSEMENT
Funds are deposited into the borrower's registered bank account for working capital and general business improvement.
The borrower confirms that:
• The funds will be used exclusively for business-related purposes as declared in the loan application.
• Funds will not be used for personal expenses or activities unrelated to the stated business.
• The borrower remains solely responsible for repayment regardless of business performance.

REPAYMENT
Repayments are due as per the schedule issued at disbursement.
A grace period of {{gracePeriodDays}} day(s) applies after each due date.
Late payments attract a one-time flat fee of {{currency}} {{lateFeeFlat}} on the first overdue day,
plus a daily charge of {{penaltyRatePerDay}} of the unpaid balance until settled.
After {{defaultThresholdDays}} days of non-payment the loan is classified as defaulted.

CONSENT
By submitting this application, I confirm I have read, understood, and agree to all terms above.`,
};

// ── Select option lists (label-map order) ─────────────────────────────

export interface SelectOption {
  value: string;
  label: string;
}
const toOptions = (m: Record<string, string>): SelectOption[] =>
  Object.entries(m).map(([value, label]) => ({ value, label }));

export const LOAN_PRODUCT_TYPE_OPTIONS = toOptions(LOAN_PRODUCT_TYPE_LABELS);
export const PAYEE_TYPE_OPTIONS = toOptions(PAYEE_TYPE_LABELS);
export const REPAYMENT_TYPE_OPTIONS = toOptions(REPAYMENT_TYPE_LABELS);
export const PRICING_TYPE_OPTIONS = toOptions(PRICING_TYPE_LABELS);
export const INTEREST_METHOD_OPTIONS = toOptions(INTEREST_METHOD_LABELS);
export const REPAYMENT_FREQUENCY_OPTIONS = toOptions(REPAYMENT_FREQUENCY_LABELS);

// ── Write requests (mirror the LMS record DTOs) ───────────────────────
// On CREATE all identity fields are set. On UPDATE the LMS DTO omits the
// immutable identity (`code`, `productType`, `payeeType`, `repaymentType`,
// `currency`) and adds `active` — the form disables those fields in edit mode.

export interface CreateLoanProductRequest {
  code: string;
  name: string;
  description?: string;
  productType: LoanProductType;
  payeeType: PayeeType;
  repaymentType: RepaymentType;
  pricingType: PricingType;
  interestMethod: InterestMethod;
  repaymentFrequency: RepaymentFrequency;
  flatFeeRate?: number;
  factorRate?: number;
  annualInterestRate?: number;
  originationFeeRate?: number;
  minPrincipal: number;
  maxPrincipal: number;
  minTermDays: number;
  maxTermDays: number;
  maxConcurrentLoansPerBorrower: number;
  holdbackPercent?: number;
  processingFee?: number;
  minInterestRate?: number;
  allocationOrder?: string;
  gracePeriodDays?: number;
  penaltyRatePerDay?: number;
  lateFeeFlat?: number;
  defaultThresholdDays?: number;
  termsTemplate?: string;
  currency: string;
}

export interface UpdateLoanProductRequest {
  name: string;
  description?: string;
  pricingType: PricingType;
  interestMethod: InterestMethod;
  repaymentFrequency: RepaymentFrequency;
  flatFeeRate?: number;
  factorRate?: number;
  annualInterestRate?: number;
  originationFeeRate?: number;
  minPrincipal: number;
  maxPrincipal: number;
  minTermDays: number;
  maxTermDays: number;
  maxConcurrentLoansPerBorrower: number;
  holdbackPercent?: number;
  processingFee?: number;
  minInterestRate?: number;
  allocationOrder?: string;
  gracePeriodDays?: number;
  penaltyRatePerDay?: number;
  lateFeeFlat?: number;
  defaultThresholdDays?: number;
  termsTemplate?: string;
  active: boolean;
}

// ── Form state + validation ───────────────────────────────────────────
// Numerics are held as `number | ""` so inputs can be blank; the zod schema
// coerces on submit ("" → undefined) and enforces required/range rules.

export interface LoanProductFormValues {
  code: string;
  name: string;
  description: string;
  productType: LoanProductType;
  payeeType: PayeeType;
  repaymentType: RepaymentType;
  pricingType: PricingType;
  interestMethod: InterestMethod;
  repaymentFrequency: RepaymentFrequency;
  currency: string;
  flatFeeRate: number | "";
  factorRate: number | "";
  annualInterestRate: number | "";
  originationFeeRate: number | "";
  minInterestRate: number | "";
  processingFee: number | "";
  holdbackPercent: number | "";
  minPrincipal: number | "";
  maxPrincipal: number | "";
  minTermDays: number | "";
  maxTermDays: number | "";
  maxConcurrentLoansPerBorrower: number | "";
  allocationOrder: string;
  gracePeriodDays: number | "";
  penaltyRatePerDay: number | "";
  lateFeeFlat: number | "";
  defaultThresholdDays: number | "";
  termsTemplate: string;
  active: boolean;
}

const emptyToUndefined = (v: unknown): unknown =>
  v === "" || v === null || v === undefined ? undefined : v;

const toNumberOrUndefined = (v: unknown): number | undefined => {
  const u = emptyToUndefined(v);
  if (u === undefined) return undefined;
  const n = Number(u);
  return Number.isNaN(n) ? undefined : n;
};

const requiredPositive = (message: string) =>
  z.preprocess(
    toNumberOrUndefined,
    z
      .number({ required_error: message, invalid_type_error: message })
      .positive(message),
  );

const requiredPositiveInt = (message: string) =>
  z.preprocess(
    toNumberOrUndefined,
    z
      .number({ required_error: message, invalid_type_error: message })
      .int(message)
      .positive(message),
  );

const optionalNonNegative = z.preprocess(
  toNumberOrUndefined,
  z.number().nonnegative("Cannot be negative").optional(),
);

const optionalNonNegativeInt = z.preprocess(
  toNumberOrUndefined,
  z.number().int("Whole number").nonnegative("Cannot be negative").optional(),
);

export const LoanProductFormSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(1, "Code is required")
      .max(64, "Max 64 characters"),
    name: z
      .string()
      .trim()
      .min(1, "Name is required")
      .max(255, "Max 255 characters"),
    description: z.string().max(2000, "Max 2000 characters"),
    productType: z.enum(["POS_DEVICE", "STOCK", "BUSINESS_IMPROVEMENT"], {
      required_error: "Select a product type",
    }),
    payeeType: z.enum(["SUPPLIER", "MWANGA_CASA", "IN_KIND_DEVICE"], {
      required_error: "Select a payee type",
    }),
    repaymentType: z.enum(["INSTALLMENTS", "SALES_HOLDBACK", "BULLET"], {
      required_error: "Select a repayment type",
    }),
    pricingType: z.enum(["FLAT_FEE", "FACTOR_RATE", "DECLINING_INTEREST"], {
      required_error: "Select a pricing type",
    }),
    interestMethod: z.enum(["FLAT", "REDUCING_BALANCE", "NONE"], {
      required_error: "Select an interest method",
    }),
    repaymentFrequency: z.enum(
      ["DAILY", "WEEKLY", "BIWEEKLY", "MONTHLY", "BULLET"],
      { required_error: "Select a frequency" },
    ),
    currency: z
      .string()
      .trim()
      .regex(/^[A-Za-z]{3}$/, "3-letter ISO code (e.g. TZS)"),
    flatFeeRate: optionalNonNegative,
    factorRate: optionalNonNegative,
    annualInterestRate: optionalNonNegative,
    originationFeeRate: optionalNonNegative,
    minInterestRate: optionalNonNegative,
    processingFee: optionalNonNegative,
    holdbackPercent: optionalNonNegative,
    minPrincipal: requiredPositive("Minimum principal is required"),
    maxPrincipal: requiredPositive("Maximum principal is required"),
    minTermDays: requiredPositiveInt("Minimum term is required"),
    maxTermDays: requiredPositiveInt("Maximum term is required"),
    maxConcurrentLoansPerBorrower: requiredPositiveInt(
      "Concurrent loan limit is required",
    ),
    allocationOrder: z.string().max(255, "Max 255 characters"),
    gracePeriodDays: optionalNonNegativeInt,
    penaltyRatePerDay: optionalNonNegative,
    lateFeeFlat: optionalNonNegative,
    defaultThresholdDays: optionalNonNegativeInt,
    termsTemplate: z.string().max(20000, "Max 20000 characters"),
    active: z.boolean(),
  })
  .refine(
    (d) =>
      d.minPrincipal == null ||
      d.maxPrincipal == null ||
      d.maxPrincipal >= d.minPrincipal,
    { message: "Must be ≥ minimum principal", path: ["maxPrincipal"] },
  )
  .refine(
    (d) =>
      d.minTermDays == null ||
      d.maxTermDays == null ||
      d.maxTermDays >= d.minTermDays,
    { message: "Must be ≥ minimum term", path: ["maxTermDays"] },
  )
  .refine(
    (d) => {
      const allowed = ALLOWED_PAYEE_TYPES_BY_PRODUCT[d.productType];
      return !allowed || allowed.includes(d.payeeType);
    },
    { message: "This payee type is not valid for the selected product type", path: ["payeeType"] },
  )
  .refine(
    (d) => !(d.interestMethod === "NONE" && d.pricingType === "DECLINING_INTEREST"),
    { message: "Declining interest requires a flat or reducing-balance interest method — or switch pricing to Flat Fee / Factor Rate", path: ["pricingType"] },
  );

/** Parsed (coerced) output — empties become `undefined`, numerics become numbers. */
export type LoanProductFormOutput = z.infer<typeof LoanProductFormSchema>;

// ── Loan applications ─────────────────────────────────────────────────
// Mirrors the LMS `ApplicationResponse`. Only UUIDs are carried for
// business/account/product — names are resolved on the FE where needed.

export interface LoanApplicationResponse {
  id: string;
  applicationNumber: string;
  businessId: string;
  accountId: string;
  loanProductId: string;
  requestedAmount: number;
  requestedTermDays: number;
  purpose?: string | null;
  status: ApplicationStatus;
  approvedAmount?: number | null;
  approvedTermDays?: number | null;
  decisionNotes?: string | null;
  rejectionReason?: string | null;
  decisionedById?: string | null;
  decisionedAt?: string | null;
  loanId?: string | null;
}

/** Mirrors the LMS `DecisionRequest`. `approvedAmount`/`approvedTermDays` required when approving. */
export interface LoanDecisionRequest {
  approve: boolean;
  decisionedById: string;
  approvedAmount?: number;
  approvedTermDays?: number;
  notes?: string;
  rejectionReason?: string;
}

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  IN_REVIEW: "In review",
  APPROVED: "Approved",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
  WITHDRAWN: "Withdrawn",
  EXPIRED: "Expired",
};

/** Statuses the admin queue can filter by (order = segmented-tab order). */
export const APPLICATION_STATUS_FILTERS: ApplicationStatus[] = [
  "IN_REVIEW",
  "SUBMITTED",
  "APPROVED",
  "ACCEPTED",
  "REJECTED",
];

/** A decidable application is one the LMS will accept a decision on. */
export const isDecidable = (status: ApplicationStatus): boolean =>
  status === "IN_REVIEW";

// ── Loans (book) + disbursement ───────────────────────────────────────

export type PayoutMethod = "BANK_TRANSFER" | "MOBILE_MONEY";

export interface LoanResponse {
  id: string;
  loanNumber: string;
  applicationId: string;
  businessId: string;
  loanProductId: string;
  principal: number;
  feeAmount: number;
  interestAmount: number;
  totalReceivable: number;
  termDays: number;
  installmentCount: number;
  currency: string;
  outstandingTotal: number;
  status: LoanStatus;
  startDate?: string | null;
}

export interface DisbursementResponse {
  id: string;
  loanId: string;
  fundingSourceId: string;
  payoutAccountId: string;
  amount: number;
  method: DisbursementMethod;
  status: DisbursementStatus;
  providerRef?: string | null;
  externalRef?: string | null;
  failureReason?: string | null;
}

export interface FundingSourceResponse {
  id: string;
  name: string;
  type: FundingSourceType;
  currency: string;
  capitalLimit?: number | null;
  currentExposure?: number | null;
  availableCapacity?: number | null;
  glAccountRef?: string | null;
  disbursementMethod: DisbursementMethod;
  bankGatewayKey?: string | null;
  active: boolean;
}

export interface PayoutAccountResponse {
  id: string;
  businessId: string;
  method: PayoutMethod;
  bankName?: string | null;
  accountName?: string | null;
  accountNumber?: string | null;
  branch?: string | null;
  mobileProvider?: string | null;
  mobileNumber?: string | null;
  label?: string | null;
  defaultAccount: boolean;
  verified: boolean;
  status?: string | null;
}

export interface InitiateDisbursementRequest {
  fundingSourceId: string;
  payoutAccountId: string;
}

export interface ConfirmDisbursementRequest {
  externalRef: string;
  confirmedById: string;
}

export const LOAN_STATUS_LABELS: Record<LoanStatus, string> = {
  PENDING_DISBURSEMENT: "Pending disbursement",
  ACTIVE: "Active",
  IN_ARREARS: "In arrears",
  CLOSED: "Closed",
  DEFAULTED: "Defaulted",
  WRITTEN_OFF: "Written off",
  CANCELLED: "Cancelled",
};

export const LOAN_STATUS_TONES: Record<LoanStatus, string> = {
  PENDING_DISBURSEMENT: "bg-amber-50 text-amber-700",
  ACTIVE: "bg-green-50 text-green-700",
  IN_ARREARS: "bg-orange-50 text-orange-700",
  CLOSED: "bg-gray-100 text-gray-600",
  DEFAULTED: "bg-red-50 text-red-700",
  WRITTEN_OFF: "bg-red-50 text-red-700",
  CANCELLED: "bg-gray-100 text-gray-500",
};

/** Loan-book filter order; the console defaults to the disbursement queue. */
export const LOAN_STATUS_FILTERS: LoanStatus[] = [
  "PENDING_DISBURSEMENT",
  "ACTIVE",
  "IN_ARREARS",
  "CLOSED",
  "DEFAULTED",
];

export const DISBURSEMENT_STATUS_LABELS: Record<DisbursementStatus, string> = {
  INITIATED: "Initiated",
  SUBMITTED: "Submitted",
  CONFIRMED: "Confirmed",
  FAILED: "Failed",
  CANCELLED: "Cancelled",
};

export const DISBURSEMENT_STATUS_TONES: Record<DisbursementStatus, string> = {
  INITIATED: "bg-amber-50 text-amber-700",
  SUBMITTED: "bg-orange-50 text-orange-700",
  CONFIRMED: "bg-green-50 text-green-700",
  FAILED: "bg-red-50 text-red-700",
  CANCELLED: "bg-gray-100 text-gray-500",
};

export const FUNDING_SOURCE_TYPE_LABELS: Record<FundingSourceType, string> = {
  OWN_EQUITY: "Own equity",
  BANK_FACILITY: "Bank facility",
  INVESTOR: "Investor",
  PARTNER: "Partner",
};

export const PAYOUT_METHOD_LABELS: Record<PayoutMethod, string> = {
  BANK_TRANSFER: "Bank transfer",
  MOBILE_MONEY: "Mobile money",
};

/** Short human label for a payout account row (method + masked destination). */
export function payoutAccountLabel(a: PayoutAccountResponse): string {
  if (a.method === "MOBILE_MONEY") {
    const num = a.mobileNumber ?? "";
    return `${a.mobileProvider ?? "Mobile"} · ${num}`.trim();
  }
  const tail = a.accountNumber ? `••${a.accountNumber.slice(-4)}` : "";
  return `${a.bankName ?? "Bank"} ${tail}`.trim();
}

// ── Funding sources (write + form) ────────────────────────────────────
// On UPDATE the LMS DTO omits `type` + `currency` (immutable) — the form
// disables them in edit mode.

export const DISBURSEMENT_METHOD_LABELS: Record<DisbursementMethod, string> = {
  MANUAL: "Manual",
  AUTOMATED: "Automated (gateway)",
};

export const FUNDING_SOURCE_TYPE_OPTIONS = toOptions(FUNDING_SOURCE_TYPE_LABELS);
export const DISBURSEMENT_METHOD_OPTIONS = toOptions(DISBURSEMENT_METHOD_LABELS);

export interface CreateFundingSourceRequest {
  name: string;
  type: FundingSourceType;
  currency: string;
  capitalLimit?: number;
  glAccountRef?: string;
  disbursementMethod: DisbursementMethod;
  bankGatewayKey?: string;
}

export interface UpdateFundingSourceRequest {
  name: string;
  capitalLimit?: number;
  glAccountRef?: string;
  disbursementMethod: DisbursementMethod;
  bankGatewayKey?: string;
  active: boolean;
}

export interface FundingSourceFormValues {
  name: string;
  type: FundingSourceType;
  currency: string;
  disbursementMethod: DisbursementMethod;
  bankGatewayKey: string;
  capitalLimit: number | "";
  glAccountRef: string;
  active: boolean;
}

export const FundingSourceFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Name is required")
      .max(255, "Max 255 characters"),
    type: z.enum(["OWN_EQUITY", "BANK_FACILITY", "INVESTOR", "PARTNER"], {
      required_error: "Select a source type",
    }),
    currency: z
      .string()
      .trim()
      .regex(/^[A-Za-z]{3}$/, "3-letter ISO code (e.g. TZS)"),
    disbursementMethod: z.enum(["MANUAL", "AUTOMATED"], {
      required_error: "Select a disbursement method",
    }),
    bankGatewayKey: z.string().max(255, "Max 255 characters"),
    capitalLimit: optionalNonNegative,
    glAccountRef: z.string().max(255, "Max 255 characters"),
    active: z.boolean(),
  })
  .refine(
    (d) =>
      d.disbursementMethod !== "AUTOMATED" ||
      d.bankGatewayKey.trim().length > 0,
    {
      message: "Gateway key is required for automated disbursement",
      path: ["bankGatewayKey"],
    },
  );

export type FundingSourceFormOutput = z.infer<typeof FundingSourceFormSchema>;

// ── Loan lifecycle (write-off / waiver / restructure) ─────────────────

export type AllocationPriority = "PENALTY" | "INTEREST" | "PRINCIPAL" | "FEE";

export const ALLOCATION_PRIORITY_LABELS: Record<AllocationPriority, string> = {
  PENALTY: "Penalty",
  INTEREST: "Interest",
  PRINCIPAL: "Principal",
  FEE: "Fee",
};
export const ALLOCATION_PRIORITY_OPTIONS = toOptions(ALLOCATION_PRIORITY_LABELS);

export interface LoanActionResponse {
  loanId: string;
  status: LoanStatus;
  outstandingTotal: number;
}

export interface RestructureResponse {
  loanId: string;
  status: LoanStatus;
  installmentCount: number;
  maturityDate?: string | null;
}

export interface WriteOffRequest {
  reference: string;
  reason?: string;
}

export interface WaiverRequest {
  component: AllocationPriority;
  amount: number;
  reference: string;
  reason?: string;
}

export interface RestructureRequest {
  newTermDays: number;
  newInstallmentCount: number;
  reference: string;
  reason?: string;
}

/** Loan statuses on which lifecycle actions are allowed (matches the LMS guards). */
export const isLiveLoan = (status: LoanStatus): boolean =>
  status === "ACTIVE" || status === "IN_ARREARS" || status === "DEFAULTED";
