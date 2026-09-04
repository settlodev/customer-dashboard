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

const PATH = "/empowering-smes";
const TITLE = "Empowering SMEs in Tanzania";
const DESCRIPTION =
  "Empowering SMEs across Tanzania with affordable POS, inventory management, accounting and access to business funding — one platform from TZS 10,000 per month, in English and Kiswahili.";

export const metadata = solutionMetadata({
  path: PATH,
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "empowering SMEs",
    "empowering SMEs in Tanzania",
    "SME software",
    "SME software Tanzania",
    "small business software Tanzania",
    "business management software Tanzania",
    "SME funding Tanzania",
    "digitising small businesses Africa",
    "kuza biashara",
    "biashara ndogo na za kati",
  ],
});

const faqs: Faq[] = [
  {
    question: "What does Settlo do for small and medium businesses?",
    answer:
      "Settlo gives an SME the operating tools that were previously only affordable to large chains — a proper point of sale, real-time inventory across locations, a live accounting ledger, staff and payroll management, and customer records — on one subscription starting at TZS 10,000 per month. The point is not software for its own sake: it is knowing your margin, your stock and your cash position well enough to make decisions.",
  },
  {
    question: "Is Settlo affordable for a small shop?",
    answer:
      "Settlo Silver is TZS 10,000 per month and covers a single shop with up to 100 products, two staff users, POS, reports, inventory, customer and supplier management. There is no setup fee and no hardware requirement beyond a phone or tablet you likely already own. Annual billing costs eleven months instead of twelve.",
  },
  {
    question: "How does Settlo help an SME access funding?",
    answer:
      "Lenders decline most small businesses because there are no verifiable records, not because the business is weak. A business trading on Settlo accumulates exactly what a lender asks for: consistent daily sales history, stock valuation, expense records and a maintained ledger. Settlo offers access to flexible business funding on the strength of that trading record.",
  },
  {
    question: "Does Settlo work in Kiswahili?",
    answer:
      "Yes. Settlo runs in both English and Kiswahili, and support is available in both languages by phone, email and WhatsApp. Ni mfumo wa kurekodi mauzo unaotumika kwa Kiswahili, uliojengwa kwa ajili ya wafanyabiashara wa Tanzania.",
  },
  {
    question: "What kind of businesses is it built for?",
    answer:
      "Retail shops and supermarkets, restaurants, bars and cafés, pharmacies, hardware stores, salons, and service businesses — from a single counter to a group of branches with warehouses. The plans scale with the business, and your data carries across as you move up.",
  },
];

export default function EmpoweringSmesPage() {
  return (
    <>
      <JsonLd
        schema={[
          webPageSchema({ path: PATH, name: TITLE, description: DESCRIPTION }),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Empowering SMEs", path: PATH },
          ]),
          faqPageSchema(faqs, `${SITE_URL}${PATH}`),
        ]}
      />
      <SolutionPage
        eyebrow="Our mission"
        title="Empowering SMEs"
        titleAccent="across Tanzania"
        intro={
          <>
            <p>
              Small and medium businesses are the larger part of Tanzania&apos;s
              economy, and most of them run on memory, paper and a phone
              calculator. Not because owners lack the skill, but because the
              software that makes a chain efficient has never been priced or
              built for a shop with one counter.
            </p>
            <p>
              Settlo exists to close that gap: the same point of sale,
              inventory, accounting and funding tools a large retailer relies
              on, for TZS 10,000 a month, in Kiswahili, on a phone you already
              own. Kesho yako ni kubwa.
            </p>
          </>
        }
        highlights={[
          "From TZS 10,000/month",
          "English & Kiswahili",
          "No hardware required",
          "Access to funding",
        ]}
        sections={[
          {
            heading: "Priced for the business that actually exists",
            body: "An SME cannot justify an enterprise licence, an implementation consultant and a server. Settlo is a monthly subscription that starts at the price of a few days' takings, runs on a phone or tablet, and needs no installation. You can start on a Tuesday and be selling on it the same afternoon.",
          },
          {
            heading: "In the language the counter speaks",
            body: "Software fails in Tanzanian shops when the staff cannot read it. Settlo runs in Kiswahili and English, and support answers in both — by phone, email and WhatsApp — so training a new till operator takes an afternoon rather than a consultant.",
          },
          {
            heading: "Turning trading into a record that counts",
            body: "The single biggest constraint on a growing SME is credit, and the single biggest reason credit is refused is the absence of records. Trading on Settlo builds the evidence a lender needs as a byproduct of running the shop.",
            bullets: [
              "Consistent, timestamped daily sales history",
              "Stock valuation and cost of goods sold from real movements",
              "Expense, debtor and creditor records maintained as you trade",
              "Access to flexible business funding on the strength of that history",
            ],
          },
          {
            heading: "Tools that grow with the business",
            body: "A business that starts with one shop and 80 products should not have to change systems when it reaches three branches, a warehouse and a kitchen. Settlo scales from Silver through Platinum to Diamond — adding locations, users, recipes, table reservations, kitchen display and room bookings — without a migration.",
            bullets: [
              "Single shop to multi-branch and multi-warehouse operations",
              "2 to 25+ staff users with roles and permissions",
              "Retail, restaurant, pharmacy, hardware and service configurations",
              "Your data carries across every plan change",
            ],
          },
          {
            heading: "Decisions on figures, not on feel",
            body: "The change owners describe most often is not the till — it is knowing, by the end of each day, which products made money, which branch is slipping and how much cash is genuinely available. That is what moves a business from surviving to planning.",
          },
        ]}
        faqs={faqs}
        faqHeading="Questions from SME owners"
        relatedHeading="Explore the rest of the platform"
        related={[
          {
            label: "POS system in Tanzania",
            description:
              "The all-in-one checkout for retail, restaurants and service businesses.",
            href: "/pos-system-tanzania",
          },
          {
            label: "Inventory management",
            description:
              "Real-time stock across shops and warehouses, with alerts and stock takes.",
            href: "/inventory-management",
          },
          {
            label: "Accounting software",
            description:
              "A ledger, invoicing and reports that stay current as you trade.",
            href: "/accounting-software",
          },
          {
            label: "Mfumo wa kurekodi mauzo",
            description: "Maelezo kwa Kiswahili kuhusu mfumo wa Settlo.",
            href: "/sw",
          },
        ]}
        ctaHeading="Start with your shop, today"
        ctaBody="Seven days free, no credit card, no setup fee. Add your products, take your first sale, and see what your business looks like in numbers."
        primaryCta={{ label: "Start free trial", href: "/register" }}
        secondaryCta={{ label: "Talk to sales", href: "/contact-us" }}
        breadcrumb={[
          { name: "Home", path: "/" },
          { name: "Empowering SMEs", path: PATH },
        ]}
      />
    </>
  );
}
