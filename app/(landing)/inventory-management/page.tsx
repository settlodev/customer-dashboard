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

const PATH = "/inventory-management";
const TITLE = "Inventory Management Software";
const DESCRIPTION =
  "Inventory management software that tracks stock in real time across shops and warehouses. Low-stock alerts, stock takes, transfers, purchase orders and goods-received notes — connected to your POS and your accounts. Free 7-day trial.";

export const metadata = solutionMetadata({
  path: PATH,
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "inventory management",
    "inventory management system",
    "inventory management software",
    "inventory management Tanzania",
    "stock management software",
    "stock control system",
    "warehouse management Tanzania",
    "stock take software",
    "purchase order software",
    "kudhibiti stoo",
    "mfumo wa kutunza stoo",
  ],
});

const faqs: Faq[] = [
  {
    question: "What is inventory management software?",
    answer:
      "Inventory management software records what stock you hold, where it is held, what it cost and how fast it moves. Every sale, delivery, transfer and write-off updates the figure automatically, so the quantity on screen matches the quantity on the shelf. It replaces the stock book and the spreadsheet, and it is the only practical way to know your true margin on each item.",
  },
  {
    question: "Can I manage stock across several shops and a warehouse?",
    answer:
      "Yes. Settlo treats each shop, branch and warehouse as its own stock location. You can see the level of any item in any location, transfer stock between them with a tracked stock-transfer note, and run reports either per location or consolidated across the whole business.",
  },
  {
    question: "How does Settlo handle stock takes?",
    answer:
      "You open a stock take, count the items on a phone or tablet, and Settlo compares your count against the expected quantity. Variances are recorded per item with the staff member who counted them, so shrinkage is visible rather than absorbed silently. You can count a single category without freezing the whole shop.",
  },
  {
    question: "Does inventory connect to purchasing and suppliers?",
    answer:
      "It does. Settlo covers the full procurement chain — purchase requisitions, requests for quotation to suppliers, purchase orders, and goods-received notes that book delivered stock straight into inventory at the cost you actually paid. Supplier returns and refunds are tracked in the same place.",
  },
  {
    question: "Does it work for a restaurant or a kitchen?",
    answer:
      "Yes. Recipe and bill-of-materials management lets you define what goes into each dish, so selling a plate depletes the ingredients rather than a finished-goods count. That gives you real food cost per dish and shows where wastage is happening.",
  },
];

export default function InventoryManagementPage() {
  return (
    <>
      <JsonLd
        schema={[
          webPageSchema({ path: PATH, name: TITLE, description: DESCRIPTION }),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Inventory Management", path: PATH },
          ]),
          faqPageSchema(faqs, `${SITE_URL}${PATH}`),
        ]}
      />
      <SolutionPage
        eyebrow="Inventory"
        title="Inventory management that"
        titleAccent="counts itself"
        intro={
          <>
            <p>
              Most stock losses are not theft — they are a number nobody
              updated. Settlo keeps inventory accurate by making every sale,
              delivery, transfer and adjustment write straight to the stock
              record, in real time, across every shop and warehouse you run.
            </p>
            <p>
              You get low-stock alerts before you run out, true cost per item,
              and a stock figure you can trust when you decide what to reorder.
            </p>
          </>
        }
        highlights={[
          "Real-time across locations",
          "Low-stock alerts",
          "Free 7-day trial",
          "From TZS 10,000/month",
        ]}
        sections={[
          {
            heading: "One stock figure, every location",
            body: "Each shop, branch and warehouse holds its own stock, and the owner sees all of them at once. Move goods between locations with a tracked transfer, so nothing leaves a branch without a record of where it went and who sent it.",
            bullets: [
              "Live stock levels per location and consolidated across the business",
              "Tracked stock transfers between shops and warehouses",
              "Stock batches and variant-level tracking (size, colour, pack)",
              "Traceability records for regulated or perishable goods",
            ],
          },
          {
            heading: "Know before you run out",
            body: "Set a reorder point per item and Settlo warns you while there is still time to buy. Fast movers get restocked, slow movers stop tying up cash, and you stop discovering an empty shelf when a customer asks for something.",
            bullets: [
              "Configurable low-stock thresholds per product and location",
              "Stock-movement and turnover reporting to spot dead stock",
              "Wastage, damage and stock-modification records",
            ],
          },
          {
            heading: "Purchasing, from requisition to shelf",
            body: "Settlo carries the whole procurement chain in one place, so what you ordered, what arrived and what you were billed are the same set of records rather than three separate piles of paper.",
            bullets: [
              "Purchase requisitions raised by branch staff and approved centrally",
              "Requests for quotation sent to multiple suppliers for comparison",
              "Purchase orders with expected delivery dates and costs",
              "Goods-received notes that book stock in at actual landed cost",
              "Supplier returns, refunds and creditor balances",
            ],
          },
          {
            heading: "Counting that finds the variance",
            body: "Run a stock take on a phone, category by category, without closing the shop. Settlo compares counted against expected, records the variance per item and per counter, and posts the adjustment to your accounts so the books and the shelves agree.",
          },
          {
            heading: "Connected to sales and to your accounts",
            body: "Inventory is not a separate app here. Stock values flow into your financial reports, cost of goods sold is calculated from what actually moved, and margin per product comes out of the same data your POS is already generating.",
          },
        ]}
        faqs={faqs}
        faqHeading="Inventory management questions"
        relatedHeading="Explore the rest of the platform"
        related={[
          {
            label: "POS system in Tanzania",
            description:
              "The checkout that feeds your stock records — cash, card and mobile money.",
            href: "/pos-system-tanzania",
          },
          {
            label: "Accounting software",
            description:
              "Ledger, invoicing, expenses and reports built on the same data.",
            href: "/accounting-software",
          },
          {
            label: "Empowering SMEs",
            description:
              "How Tanzanian small and medium businesses use Settlo to grow.",
            href: "/empowering-smes",
          },
          {
            label: "Mfumo wa kurekodi mauzo",
            description: "Maelezo kwa Kiswahili kuhusu mfumo wa Settlo.",
            href: "/sw",
          },
        ]}
        ctaHeading="Get your stock under control this week"
        ctaBody="Import your product list, set your reorder points, and let the first week of sales show you what your real stock position is. Free for 7 days, no credit card required."
        primaryCta={{ label: "Start free trial", href: "/register" }}
        secondaryCta={{ label: "Talk to sales", href: "/contact-us" }}
        breadcrumb={[
          { name: "Home", path: "/" },
          { name: "Inventory Management", path: PATH },
        ]}
      />
    </>
  );
}
