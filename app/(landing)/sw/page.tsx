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

const PATH = "/sw";
const TITLE = "Mfumo wa Kurekodi Mauzo na Kudhibiti Stoo";
const DESCRIPTION =
  "Settlo ni mfumo wa kurekodi mauzo, kudhibiti stoo na kutunza hesabu za biashara yako Tanzania. Pokea pesa taslimu, kadi, M-Pesa, Airtel Money na Mixx by Yas. Jaribu bure kwa siku 7, kuanzia TSh 10,000 kwa mwezi.";

export const metadata = solutionMetadata({
  path: PATH,
  title: TITLE,
  description: DESCRIPTION,
  locale: "sw_TZ",
  translationPair: true,
  keywords: [
    "mfumo wa kurekodi mauzo",
    "mfumo wa mauzo",
    "mfumo wa biashara",
    "programu ya mauzo",
    "kudhibiti stoo",
    "mfumo wa kutunza stoo",
    "hesabu za biashara",
    "mfumo wa hesabu",
    "daftari la kidigitali",
    "kuza biashara",
    "POS Tanzania",
    "mfumo wa POS",
  ],
});

const faqs: Faq[] = [
  {
    question: "Mfumo wa kurekodi mauzo ni nini?",
    answer:
      "Mfumo wa kurekodi mauzo ni programu inayorekodi kila mauzo unayofanya, inapunguza stoo kiotomatiki, na kukupa ripoti ya mapato, matumizi na faida. Badala ya daftari la mkono au Excel, kila muamala unahifadhiwa papo hapo — hivyo unajua kwa uhakika umeuza nini, umebakiwa na nini, na umepata faida kiasi gani.",
  },
  {
    question: "Settlo inagharimu kiasi gani?",
    answer:
      "Settlo Silver ni TSh 10,000 kwa mwezi, Settlo Platinum ni TSh 25,000 kwa mwezi, na Settlo Diamond ni TSh 60,000 kwa mwezi. Ukilipia mwaka mzima unalipa sawa na miezi kumi na moja, hivyo unaokoa mwezi mmoja. Hakuna gharama ya kuanzisha, na unaanza na siku 7 za majaribio bure bila kadi ya benki.",
  },
  {
    question: "Naweza kupokea malipo ya simu?",
    answer:
      "Ndiyo. Kwenye mauzo unapokea pesa taslimu, kadi na pesa za simu. Kwa ankara na malipo ya usajili, Settlo inatumia Airtel Money, Mixx by Yas na Vodacom M-Pesa.",
  },
  {
    question: "Je, inafanya kazi kwenye simu?",
    answer:
      "Ndiyo. Settlo inafanya kazi kwenye simu za Android, iPhone, tablet na kompyuta kupitia mtandao. Huhitaji mashine maalum ya POS — simu uliyonayo inatosha kuanza, na taarifa zote zinasawazishwa kiotomatiki kwenye vifaa vyako vyote.",
  },
  {
    question: "Naweza kutumia kwa maduka zaidi ya moja?",
    answer:
      "Ndiyo. Settlo inasimamia maduka mengi na maghala kwa wakati mmoja. Kila duka lina stoo yake, wafanyakazi wake na mauzo yake, lakini mmiliki anaona ripoti ya jumla ya biashara nzima. Unaweza pia kuhamisha bidhaa kati ya maduka na kumbukumbu ikabaki.",
  },
  {
    question: "Nitapataje msaada?",
    answer:
      "Timu yetu inapatikana kwa Kiswahili na Kiingereza kwa simu +255 759 229 777, barua pepe support@settlo.co.tz, na WhatsApp. Ofisi zetu zipo Victoria Noble Centre, Barabara ya Bagamoyo, Dar es Salaam.",
  },
];

export default function SwahiliPage() {
  return (
    <>
      <JsonLd
        schema={[
          webPageSchema({
            path: PATH,
            name: TITLE,
            description: DESCRIPTION,
            language: "sw-TZ",
          }),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Kiswahili", path: PATH },
          ]),
          faqPageSchema(faqs, `${SITE_URL}${PATH}`),
        ]}
      />
      <SolutionPage
        eyebrow="Kwa Kiswahili"
        title="Mfumo wa kurekodi mauzo na"
        titleAccent="kudhibiti stoo ya biashara yako"
        intro={
          <>
            <p>
              Settlo ni mfumo mmoja unaokusaidia kurekodi mauzo, kudhibiti
              stoo, kutunza hesabu na kufuatilia wafanyakazi wa biashara yako —
              yote mahali pamoja, kwa Kiswahili, kwenye simu yako.
            </p>
            <p>
              Kila unapouza, stoo inapungua yenyewe na ripoti inajiandika. Huna
              haja ya daftari la mkono wala kuhesabu upya mwisho wa mwezi.
              Kesho yako ni kubwa.
            </p>
          </>
        }
        highlights={[
          "Siku 7 za majaribio bure",
          "Hakuna kadi ya benki",
          "Kuanzia TSh 10,000 kwa mwezi",
          "Kiswahili na Kiingereza",
        ]}
        sections={[
          {
            heading: "Kurekodi mauzo kwa haraka",
            body: "Muuzaji anarekodi mauzo kwa sekunde chache — anatafuta bidhaa au anaskani bakodi, anapokea malipo, na anatoa risiti. Kila muamala unahifadhiwa na jina la aliyeuza, hivyo unajua nani aliuza nini na saa ngapi.",
            bullets: [
              "Pokea pesa taslimu, kadi, M-Pesa, Airtel Money na Mixx by Yas",
              "Risiti za karatasi, WhatsApp, barua pepe au QR code",
              "Punguzo, marejesho na kufuta mauzo kwa kumbukumbu kamili",
              "Ripoti ya Z na kufunga zamu mwisho wa siku",
            ],
          },
          {
            heading: "Kudhibiti stoo bila kuhesabu kila siku",
            body: "Stoo inajipunguza yenyewe kila unapouza, na inaongezeka unapopokea bidhaa kutoka kwa wasambazaji. Unapata taarifa bidhaa inapokaribia kuisha, kabla mteja hajakuuliza na ukakosa.",
            bullets: [
              "Kiwango cha stoo kwa kila duka na ghala kwa wakati halisi",
              "Taarifa ya bidhaa zinazokaribia kuisha",
              "Kuhamisha bidhaa kati ya maduka kwa kumbukumbu",
              "Kuhesabu stoo na kuona tofauti kati ya hesabu na kilichopo",
              "Oda za manunuzi na risiti za kupokea bidhaa",
            ],
          },
          {
            heading: "Hesabu na ripoti za biashara",
            body: "Settlo inatunza leja, ankara, matumizi, wadaiwa na wadai — na inaandaa ripoti za kifedha kutokana na mauzo uliyofanya. Hivyo hesabu zako zinakuwa tayari kila siku, si mwisho wa mwaka.",
            bullets: [
              "Ankara na proforma, na malipo kwa pesa za simu",
              "Wadaiwa na wadai — nani anakudai na nani unamdai",
              "Matumizi kwa kila duka na kila aina",
              "Mishahara, zamu na hati za malipo za wafanyakazi",
              "Ripoti ya faida kwa bidhaa, kwa duka na kwa muuzaji",
            ],
          },
          {
            heading: "Maduka mengi, mmiliki mmoja",
            body: "Kama una maduka zaidi ya moja au ghala, kila sehemu ina stoo na wafanyakazi wake, lakini wewe kama mmiliki unaona kila kitu kwa pamoja kutoka kwenye simu yako popote ulipo.",
          },
          {
            heading: "Mikopo ya biashara",
            body: "Benki nyingi zinakataa biashara ndogo kwa sababu hakuna kumbukumbu za kuaminika. Ukitumia Settlo, historia ya mauzo yako, thamani ya stoo na hesabu zako zinajengeka zenyewe — na hii ndiyo inayokufungulia njia ya kupata mtaji wa kukuza biashara.",
          },
        ]}
        faqs={faqs}
        faqHeading="Maswali yanayoulizwa mara kwa mara"
        relatedHeading="Soma zaidi"
        related={[
          {
            label: "POS system in Tanzania",
            description:
              "Read in English about the Settlo point-of-sale system.",
            href: "/pos-system-tanzania",
          },
          {
            label: "Inventory management",
            description: "Kudhibiti stoo — maelezo kwa Kiingereza.",
            href: "/inventory-management",
          },
          {
            label: "Accounting software",
            description: "Hesabu za biashara — maelezo kwa Kiingereza.",
            href: "/accounting-software",
          },
          {
            label: "Wasiliana nasi",
            description: "Ongea na timu yetu kwa Kiswahili.",
            href: "/contact-us",
          },
        ]}
        ctaHeading="Anza bure leo kwa siku 7"
        ctaBody="Jisajili, ingiza bidhaa zako, na uanze kuuza leo. Hakuna kadi ya benki, hakuna gharama ya kuanzisha, na unaweza kusitisha wakati wowote."
        primaryCta={{ label: "Jaribu bure", href: "/register" }}
        secondaryCta={{ label: "Wasiliana nasi", href: "/contact-us" }}
        breadcrumb={[
          { name: "Home", path: "/" },
          { name: "Kiswahili", path: PATH },
        ]}
      />
    </>
  );
}
