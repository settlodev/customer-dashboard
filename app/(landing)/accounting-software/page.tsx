import React from "react";

import { SolutionPage } from "@/components/landing-page/solution-page";
import { JsonLd } from "@/components/seo/json-ld";
import { SITE_URL } from "@/lib/crawl-policy";
import { solutionMetadata } from "@/lib/seo/page-metadata";
import {
  breadcrumbSchema,
  faqPageSchema,
  webPageSchema,
  type Faq,
} from "@/lib/seo/structured-data";

const PATH = "/accounting-software";
const TITLE = "Accounting Software & Systems";
const DESCRIPTION =
  "Accounting systems built into your POS. Ledger, invoicing, expenses, debtors and creditors, payroll and financial reports — posted automatically from the sales and stock you already record. Free 7-day trial.";

export const metadata = solutionMetadata({
  path: PATH,
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "accounting systems",
    "accounting system",
    "accounting software",
    "accounting software Tanzania",
    "bookkeeping software Tanzania",
    "financial reporting software",
    "invoicing software Tanzania",
    "payroll software Tanzania",
    "business accounting system",
    "hesabu za biashara",
    "mfumo wa hesabu",
  ],
});

const faqs: Faq[] = [
  {
    question: "What is an accounting system?",
    answer:
      "An accounting system records every financial event in your business — sales, purchases, expenses, wages, money owed to you and money you owe — into a ledger that produces your financial statements. A good one is not typed up separately at month end; it is posted automatically from what the business already does, which is why accounting built into a POS is more accurate than a spreadsheet reconciled after the fact.",
  },
  {
    question: "Does Settlo replace my accountant?",
    answer:
      "No, and it is not meant to. It replaces the shoebox of receipts and the end-of-month data entry that makes your accountant expensive. Settlo keeps the ledger, invoices, expenses and payroll current as you trade, and produces the reports your accountant needs, so their time goes into advice and compliance instead of typing.",
  },
  {
    question: "Can I issue invoices and track who owes me money?",
    answer:
      "Yes. Settlo handles proforma invoices, tax invoices and credit sales, and tracks debtors so you can see exactly who owes what and for how long. Customers can be sent invoice links to pay by Airtel Money, Mixx by Yas or Vodacom M-Pesa, and payments settle against the invoice automatically.",
  },
  {
    question: "Does it handle expenses and payroll?",
    answer:
      "It does. Expenses are recorded against categories and locations so you can see where money is going per branch. Staff records, shifts, salaries and payslips are managed in the same platform, and payroll costs post to the ledger alongside everything else.",
  },
  {
    question: "What financial reports do I get?",
    answer:
      "Daily sales and cash position, profit and margin by product, category, branch and staff member, expense breakdowns, debtor and creditor ageing, stock valuation, and full financial statements from the ledger. Every report is filtered by location and date range, and can be read on a phone.",
  },
];

export default function AccountingSoftwarePage() {
  return (
    <>
      <JsonLd
        schema={[
          webPageSchema({ path: PATH, name: TITLE, description: DESCRIPTION }),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Accounting Software", path: PATH },
          ]),
          faqPageSchema(faqs, `${SITE_URL}${PATH}`),
        ]}
      />
      <SolutionPage
        eyebrow="Accounting"
        title="Accounting systems that post"
        titleAccent="while you trade"
        intro={
          <>
            <p>
              Most small businesses do their books twice: once when they sell,
              and again weeks later when someone types it all into a
              spreadsheet. Settlo removes the second pass. Sales, stock
              movements, expenses and wages post to the ledger as they happen,
              so your accounts are current at the close of every day.
            </p>
            <p>
              Invoicing, debtors and creditors, payroll and financial
              statements all run off the same records your POS is already
              creating — no export, no re-keying, no month-end scramble.
            </p>
          </>
        }
        highlights={[
          "Books current daily",
          "Invoices paid by mobile money",
          "Free 7-day trial",
          "Built for Tanzanian SMEs",
        ]}
        sections={[
          {
            heading: "A ledger fed by the business, not by data entry",
            body: "Every sale, purchase, expense, refund and payroll run posts itself. The ledger is a byproduct of trading rather than a separate job, which means the figures are both current and reconciled to what actually moved through the shop.",
            bullets: [
              "Automatic posting from POS sales, stock movements and procurement",
              "Expense capture by category, branch and cost centre",
              "Cost of goods sold calculated from real stock movements",
              "Multi-location books that consolidate to a group view",
            ],
          },
          {
            heading: "Invoicing and getting paid",
            body: "Raise a proforma, convert it to an invoice, send it, and let the customer settle it from their phone. Settlo matches the payment to the invoice, so your debtors list reflects who has actually paid rather than who says they have.",
            bullets: [
              "Proforma invoices, tax invoices and credit sales",
              "Shareable invoice and receipt links for customers",
              "Payment by Airtel Money, Mixx by Yas and Vodacom M-Pesa",
              "Debtor ageing so you know which balances are going stale",
            ],
          },
          {
            heading: "Suppliers, creditors and what you owe",
            body: "Purchase orders and goods-received notes create the payable, supplier returns credit it, and the creditors report tells you what is due and when. The same records that value your stock also value what you owe for it.",
          },
          {
            heading: "Staff, salaries and payslips",
            body: "Manage staff records, roles, shifts and salaries in the same platform that runs your till. Payslips are generated from the shift and salary data, and the payroll cost lands in the ledger with everything else.",
          },
          {
            heading: "Reports an owner will actually read",
            body: "Financial reporting is only useful if it is looked at. Settlo's reports are built for a phone screen and a five-minute morning check: what did we sell, what did it cost, who owes us, and where is the cash.",
            bullets: [
              "Daily sales, gross margin and cash-position summaries",
              "Profit by product, category, branch and staff member",
              "Expense, debtor, creditor and stock-valuation reports",
              "Date-range and per-location filters on every report",
            ],
          },
        ]}
        faqs={faqs}
        faqHeading="Accounting questions"
        relatedHeading="Explore the rest of the platform"
        related={[
          {
            label: "POS system in Tanzania",
            description:
              "The checkout that generates the transactions your ledger is built from.",
            href: "/pos-system-tanzania",
          },
          {
            label: "Inventory management",
            description:
              "Real-time stock, purchasing and stock takes feeding your cost of goods sold.",
            href: "/inventory-management",
          },
          {
            label: "Empowering SMEs",
            description:
              "How clean books help Tanzanian SMEs qualify for business funding.",
            href: "/empowering-smes",
          },
          {
            label: "Mfumo wa kurekodi mauzo",
            description: "Maelezo kwa Kiswahili kuhusu mfumo wa Settlo.",
            href: "/sw",
          },
        ]}
        ctaHeading="Close your next month in an afternoon"
        ctaBody="Start the free trial, trade for a week, and see your ledger, debtors and margin reports build themselves. No credit card required."
        primaryCta={{ label: "Start free trial", href: "/register" }}
        secondaryCta={{ label: "Talk to sales", href: "/contact-us" }}
        breadcrumb={[
          { name: "Home", path: "/" },
          { name: "Accounting Software", path: PATH },
        ]}
      />
    </>
  );
}
