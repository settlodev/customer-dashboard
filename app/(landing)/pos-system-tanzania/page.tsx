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

const PATH = "/pos-system-tanzania";
const TITLE = "POS System in Tanzania";
const DESCRIPTION =
  "Settlo is an all-in-one POS system in Tanzania for retail shops, restaurants, bars and pharmacies. Accept cash, card, M-Pesa, Airtel Money and Mixx by Yas, track stock in real time and see your numbers daily. From TZS 10,000/month with a free 7-day trial.";

export const metadata = solutionMetadata({
  path: PATH,
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "POS",
    "POS system",
    "POS Tanzania",
    "POS in Tanzania",
    "POS system in Tanzania",
    "best POS system in Tanzania",
    "point of sale Tanzania",
    "point of sale system",
    "retail POS Tanzania",
    "restaurant POS Tanzania",
    "POS machine Tanzania",
    "mfumo wa mauzo",
    "mfumo wa kurekodi mauzo",
  ],
});

const faqs: Faq[] = [
  {
    question: "What is the best POS system in Tanzania?",
    answer:
      "The right POS for a Tanzanian business needs three things: it must accept the payment methods your customers actually use, work in Swahili as well as English, and keep stock and accounting in the same system so you are not re-typing figures at month end. Settlo covers all three — cash, card, Vodacom M-Pesa, Airtel Money and Mixx by Yas at checkout, a bilingual interface, and inventory plus accounting built into the same platform. Plans run from TZS 10,000 to TZS 60,000 per month and every one starts with a free 7-day trial.",
  },
  {
    question: "How much does a POS system cost in Tanzania?",
    answer:
      "Settlo Silver is TZS 10,000 per month, Settlo Platinum is TZS 25,000 per month and Settlo Diamond is TZS 60,000 per month. Annual billing costs the equivalent of eleven months, so you save one month on any plan. There is no setup fee, no credit card is required to start the free 7-day trial, and you can cancel at any time.",
  },
  {
    question: "Does the Settlo POS work without internet?",
    answer:
      "Settlo runs on Android phones and tablets, iPhone and iPad, and any web browser, so you can keep selling on a phone if the till machine or the shop connection goes down. Sales, stock levels and staff activity sync in real time once the device is back online, so your reports stay accurate.",
  },
  {
    question: "Can one POS system handle more than one shop?",
    answer:
      "Yes. Settlo is built around multiple locations and warehouses from the start. Each branch has its own stock, staff and till, while the owner sees consolidated sales, stock and financial reports across every location. Stock transfers between branches are tracked, so you always know where an item went.",
  },
  {
    question: "Which businesses use Settlo POS?",
    answer:
      "Retail shops and supermarkets, restaurants, bars and cafés, pharmacies, hardware and building supply stores, salons and service businesses. The restaurant plans add table reservations, a kitchen display screen and recipe management, so food costs are tracked against what is actually sold.",
  },
];

export default function PosSystemTanzaniaPage() {
  return (
    <>
      <JsonLd
        schema={[
          webPageSchema({ path: PATH, name: TITLE, description: DESCRIPTION }),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "POS System in Tanzania", path: PATH },
          ]),
          faqPageSchema(faqs, `${SITE_URL}${PATH}`),
        ]}
      />
      <SolutionPage
        eyebrow="Point of sale"
        title="The all-in-one"
        titleAccent="POS system in Tanzania"
        intro={
          <>
            <p>
              Settlo is a point-of-sale system built for how business is
              actually done in Tanzania. Ring up a sale on a phone, a tablet or
              a full till; take cash, card, Vodacom M-Pesa, Airtel Money or
              Mixx by Yas; and watch stock, reports and your ledger update
              themselves as you sell.
            </p>
            <p>
              No separate stock book, no spreadsheet at the end of the month,
              no guessing what a branch sold yesterday. Mfumo mmoja wa kurekodi
              mauzo, kudhibiti stoo na kufuatilia hesabu za biashara yako.
            </p>
          </>
        }
        highlights={[
          "Free 7-day trial",
          "No credit card required",
          "From TZS 10,000/month",
          "English & Kiswahili",
        ]}
        sections={[
          {
            heading: "A checkout your staff can learn in an afternoon",
            body: "A POS only helps if the person behind the counter can use it under pressure. Settlo's checkout is designed for speed on a small screen — search or scan an item, apply a discount, split a payment, print or send the receipt.",
            bullets: [
              "Barcode scanning, quick keys and product search built for busy counters",
              "Cash, card and mobile money on the same sale, including split payments",
              "Printed, WhatsApp or emailed receipts, and QR-code digital receipts",
              "Refunds, voids and discounts that leave an audit trail against the staff member",
              "Shift and day-session management with a Z-report at closing",
            ],
          },
          {
            heading: "Stock that counts itself while you sell",
            body: "Every sale writes straight through to inventory, so the stock figure you look at is the stock you have. That is the difference between a POS and a cash register, and it is where most Tanzanian retailers lose money.",
            bullets: [
              "Real-time stock levels across every branch and warehouse",
              "Low-stock alerts before an item runs out, not after",
              "Stock takes, transfers, modifications and wastage tracking",
              "Purchase requisitions, RFQs, purchase orders and goods-received notes",
              "Recipe and bill-of-materials costing for kitchens and production",
            ],
          },
          {
            heading: "Payments the way your customers pay",
            body: "Mobile money is not an add-on in Tanzania — it is the default. Settlo takes cash, card and mobile money at the counter, and settles invoices and subscriptions through Airtel Money, Mixx by Yas and Vodacom M-Pesa.",
          },
          {
            heading: "The numbers, every day, without asking for them",
            body: "Sales by branch, by staff member, by product and by hour. Gross margin per item. Expenses, debtors and creditors. Settlo turns the day's trading into reports the owner can read on a phone, so decisions are made on figures rather than on feel.",
            bullets: [
              "Daily sales, profit and cash-position summaries",
              "Best and worst performing products and categories",
              "Staff performance and shift reconciliation",
              "Full accounting ledger, invoicing and financial statements",
            ],
          },
          {
            heading: "Grows from one counter to a chain",
            body: "Start on Settlo Silver with a single shop and up to 100 products. Move to Platinum as your catalogue and team grow, and to Diamond when you are running multiple locations, a restaurant floor, a kitchen display and room bookings. The data comes with you — there is no migration between plans.",
          },
        ]}
        faqs={faqs}
        faqHeading="POS questions Tanzanian business owners ask"
        relatedHeading="Explore the rest of the platform"
        related={[
          {
            label: "Inventory management",
            description:
              "Real-time stock across branches and warehouses, with alerts, transfers and stock takes.",
            href: "/inventory-management",
          },
          {
            label: "Accounting software",
            description:
              "Ledger, invoicing, expenses, payroll and financial reports connected to your sales.",
            href: "/accounting-software",
          },
          {
            label: "Empowering SMEs",
            description:
              "How Settlo helps small and medium businesses in Tanzania grow and access funding.",
            href: "/empowering-smes",
          },
          {
            label: "Mfumo wa kurekodi mauzo",
            description:
              "Soma kwa Kiswahili jinsi Settlo inavyorekodi mauzo na kudhibiti stoo.",
            href: "/sw",
          },
        ]}
        ctaHeading="Try the POS free for 7 days"
        ctaBody="Set up your shop, add your products and take your first sale today. No credit card, no setup fee, and you can cancel any time."
        primaryCta={{ label: "Start free trial", href: "/register" }}
        secondaryCta={{ label: "Talk to sales", href: "/contact-us" }}
        breadcrumb={[
          { name: "Home", path: "/" },
          { name: "POS System in Tanzania", path: PATH },
        ]}
      />
    </>
  );
}
