import type { Faq } from "@/lib/seo/structured-data";

/**
 * Homepage FAQ content.
 *
 * Single source of truth for both the visible accordion
 * (components/landing-page/Faqs.tsx) and the FAQPage structured data
 * emitted on the homepage. Google requires the answer text in the markup to
 * match what the user can actually read on the page, so these must not
 * drift apart — import from here rather than re-typing copy.
 */
export const HOME_FAQS: Faq[] = [
  {
    question: "What is Settlo?",
    answer:
      "Settlo is an all-in-one business platform that combines point-of-sale, inventory management, accounting, and flexible business funding. It's built for businesses that need to sell, track stock, and manage operations from one place instead of stitching together separate tools.",
  },
  {
    question: "Which is the best POS system in Tanzania?",
    answer:
      "The best POS system for a Tanzanian business is one that handles local payment methods, works in both English and Swahili, and keeps stock and accounting in the same place. Settlo does all three: it accepts cash, card, Airtel Money, Mixx by Yas and Vodacom M-Pesa, runs on Android, iOS and the web, and connects your sales directly to inventory and financial reports. Plans start at TZS 10,000 per month with a free 7-day trial.",
  },
  {
    question: "How much does a POS system cost in Tanzania?",
    answer:
      "Settlo pricing starts at TZS 10,000 per month for Settlo Silver, TZS 25,000 per month for Settlo Platinum, and TZS 60,000 per month for Settlo Diamond. Paying annually costs the equivalent of 11 months, so you save one month on every plan. Every plan starts with a free 7-day trial and no credit card is required.",
  },
  {
    question: "Mfumo wa kurekodi mauzo ni nini?",
    answer:
      "Mfumo wa kurekodi mauzo ni programu inayorekodi kila mauzo unayofanya, inapunguza stoo kiotomatiki, na kukupa ripoti ya mapato na matumizi. Settlo ni mfumo wa kurekodi mauzo unaotumika Tanzania kwa lugha ya Kiswahili na Kiingereza, unaopokea pesa taslimu, kadi, Airtel Money, Mixx by Yas na M-Pesa, na unafanya kazi kwenye simu, tablet na kompyuta.",
  },
  {
    question: "How does Settlo work?",
    answer:
      "You sign up for a free 7-day trial (no credit card required), set up your business and locations, and start selling through the POS. Sales, stock levels, and staff activity sync in real time, so your inventory, reports, and cash flow always reflect what's actually happening in-store.",
  },
  {
    question: "Does Settlo handle inventory management and accounting?",
    answer:
      "Yes. Settlo tracks stock in real time across multiple locations and warehouses, with low-stock alerts, stock takes, transfers and full procurement (RFQs, purchase orders and goods receiving). On the accounting side it covers the ledger, invoicing, expenses, debtors and creditors, payroll and financial reports — so your books stay in step with what you sell without re-entering anything.",
  },
  {
    question: "What features does Settlo offer?",
    answer:
      "Settlo covers point-of-sale and checkout, real-time inventory across multiple locations, procurement (RFQs, purchase orders, and goods receiving), full accounting (ledger, invoicing, and financial reports), sales and performance analytics, customer profiles and loyalty, and access to business funding — all in one platform.",
  },
  {
    question: "What payment methods does Settlo support?",
    answer:
      "At checkout, Settlo accepts cash, card, and mobile money. For invoice and subscription payments, we support Airtel Money, Mixx by Yas, and Vodacom M-Pesa.",
  },
  {
    question: "Can I use Settlo for my business?",
    answer:
      "Yes — Settlo scales from a single store to multiple locations and warehouses, with plans to match each stage. It is used by retail shops, restaurants and bars, pharmacies, hardware stores and service businesses across Tanzania. Start with a free 7-day trial, no credit card required, and cancel anytime.",
  },
];
