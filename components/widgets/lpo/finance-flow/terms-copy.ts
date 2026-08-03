/**
 * Settlo supplier-financing terms — the canonical clause copy rendered in
 * the FinanceFlowModal "Terms" step. Per the 2026-08-03 LPO-financing
 * design, this copy LIVES IN THE DASHBOARD; the LMS only records acceptance
 * of a version string (`GET/POST /api/v1/financing-terms`). Any material
 * edit here must ship together with a version bump on the LMS
 * (`lms.financing-terms.version`) so existing acceptances don't silently
 * cover new wording. The accept call always posts the `currentVersion` the
 * LMS reports — never a value hardcoded in the dashboard.
 *
 * Provenance: these 8 clauses are the design source's terms sheet
 * (`lpo-financing.jsx`, `.fm-terms` block) transcribed verbatim, with two
 * factual corrections for product-configured values the mock hardcoded —
 * clause 2 (Repayment) defers to the offer's own term instead of a fixed
 * 30-day figure, and clause 4 (Late repayment) defers to the loan
 * agreement's configured penalties instead of a fixed 1.5% monthly rate.
 * Final legal wording is still pending business sign-off before go-live.
 */

export interface FinancingTermsClause {
  title: string;
  body: string;
}

export const FINANCING_TERMS_CLAUSES: FinancingTermsClause[] = [
  {
    title: "What we do",
    body:
      "Settlo pays your approved supplier invoice in full on your behalf. Goods and invoice disputes remain between you and the supplier.",
  },
  {
    title: "Repayment",
    body:
      "You repay Settlo the financed amount plus the disclosed fee on or before the due date shown on your offer. The term shown on your offer runs from the date the supplier is paid.",
  },
  {
    title: "Fees",
    body:
      "A one-off facility fee is quoted per order before you accept. There are no compounding interest charges.",
  },
  {
    title: "Late repayment",
    body:
      "Late balances attract the late-payment charges set out in your loan agreement and may pause your financing limit until settled.",
  },
  {
    title: "Collections",
    body:
      "Repayments are drawn from your Settlo settlement balance first, then from the mobile money or bank account on file.",
  },
  {
    title: "Limit reviews",
    body:
      "Your limit is reviewed against your Settlo sales and repayment history and may change over time.",
  },
  {
    title: "Data",
    body:
      "You authorise Settlo and its lending partners to assess your transaction history for credit decisions and to report repayment conduct to licensed credit bureaus.",
  },
  {
    title: "Cancellation",
    body:
      "You may cancel a financing request any time before the supplier is paid, at no cost.",
  },
];
