import React from "react";

const sections = [
  {
    group: "General Terms",
    accent: "#EB7F44",
    accentBg: "#FDF0E8",
    accentText: "#993C1D",
    items: [
      {
        n: 1,
        title: "Account registration",
        body: "To access and use the Services, you must register for a Settlo account. You must provide your full legal name, business address, phone number, a valid email address, and any other information indicated as required. Settlo may reject your application or cancel an existing account at our sole discretion. You must be at least 18 years old, or the age of majority in your jurisdiction. You confirm that you are using the Services for business purposes and not for personal, household, or family use. You are responsible for all activity that occurs under your account.",
      },
      {
        n: 2,
        title: "Restrictions",
        body: "You may not use our services for unauthorized, illegal, or criminal purposes. We reserve the right to share information with law enforcement if we suspect such activity. You agree not to reproduce, duplicate, copy, sell, or resell any portion of the Service without express written permission. You agree not to work around, bypass, or circumvent any technical limitations of the Services, or use any tool to enable features otherwise disabled. You agree not to access the Services using any robot, spider, scraper, or other automated means.",
      },
      {
        n: 3,
        title: "Your content",
        body: "You retain all rights to your content when you upload it into our Services, but you grant Settlo a non-exclusive, transferable, sub-licensable, royalty-free, worldwide licence to host, use, distribute, modify, run, copy, store, publicly perform, display, and create derivative works of your materials to operate, provide, and promote the Services. Anything you provide must not contain content we consider objectionable (e.g., illegal, obscene, hateful, or harmful). We may remove any content at any time.",
      },
      {
        n: 4,
        title: "Security",
        body: "We take security seriously but cannot guarantee that bad actors will not gain access to your personal information. You must keep passwords safe, manage device access carefully, and notify us of any suspected unauthorized use. In the event of an account ownership dispute, Settlo reserves the right to request documentation and determine rightful account ownership. We may temporarily suspend an account until resolution is determined between disputing parties.",
      },
      {
        n: 5,
        title: "Privacy",
        body: "By using Settlo Services as a seller, you acknowledge our data practices. We will not share, distribute, or use your personal information with third parties without your permission. Settlo's collection, use, and processing of your personal information is governed by our Privacy Policy.",
      },
      {
        n: 6,
        title: "Your licence",
        body: "We grant you a limited, non-exclusive, revocable, non-transferable, non-sublicensable licence to use the Paid Services, and a royalty-free equivalent licence for Free Services as authorised in these General Terms. You must accept any updates we make available to continue using the Services. We reserve the right to modify the Services or any part thereof for any reason, without notice and at any time.",
      },
      {
        n: 7,
        title: "Your responsibilities",
        body: "You are responsible for the creation and operation of your Settlo Store, your materials, the goods and services you sell, and all aspects of transactions between you and your customers — including authorising charges, determining and collecting taxes, refunds, returns, fulfilment, customer service, and regulatory compliance. Settlo is not the seller or merchant of record and has no responsibility for your store, your materials, or the goods and services you sell. You represent and warrant that you will comply with all applicable laws, rules, and regulations in your use of the Services.",
      },
      {
        n: 8,
        title: "Confidentiality",
        body: "Both you and Settlo agree to use each other's Confidential Information only to perform obligations under these Terms. Each party will take all reasonable steps to prevent duplication, disclosure, or unauthorized use of the other's Confidential Information. Confidential Information excludes information already in the public domain, independently developed without reference to the other party's information, or rightfully obtained from a third party without breach of these Terms.",
      },
    ],
  },
  {
    group: "Payment Terms",
    accent: "#1D9E75",
    accentBg: "#E1F5EE",
    accentText: "#085041",
    items: [
      {
        n: 9,
        title: "Our role",
        body: "Settlo enables you to accept mobile payments from customers. We partner with BoT-approved Payment Processor Selcom Pay Tech to process payments. Payment accounts may be created on your behalf upon sign-up. It is your sole responsibility to activate and deactivate these accounts and comply with their applicable terms.",
      },
      {
        n: 10,
        title: "Fees and payment",
        body: "Our payment partner charges a processing fee of 1.5% per transaction, deducted from collected funds before deposit into your account. You must keep a valid payment method on file for all incurred and recurring fees. Settlo will continue to charge your authorised payment method until the Services are terminated and all outstanding fees are paid in full. Fees may change from time to time and you will be notified in advance.",
      },
      {
        n: 11,
        title: "Payout schedule",
        body: "Unless you have chosen a custom schedule, Selcom Pay Tech initiates payouts directly to your registered number or bank account: Monday–Thursday before 13:00 EAT; Friday before 13:00 EAT on the following Sunday; weekends and non-business days before the next business day. Additional charges may apply for bank account settlements. If payment of fees is unsuccessful for 28 days following our initial attempt, Settlo may freeze your store.",
      },
      {
        n: 12,
        title: "Taxes",
        body: "You are solely responsible for determining, collecting, withholding, reporting, and remitting all applicable taxes, duties, fees, surcharges, and additional charges arising from any sale on your Settlo Store or your use of the Services. Settlo is not obligated to determine whether taxes apply, or to calculate, collect, report, or remit any taxes on your behalf. All sums payable to Settlo shall be paid free and clear of any deductions or withholdings.",
      },
      {
        n: 13,
        title: "Receipts",
        body: "Our system does not automatically issue TRA fiscal receipts. If you wish to issue electronic receipts, you must contact TRA to obtain your unique API and arrange for manual integration with our system. This integration service may be charged separately by Settlo.",
      },
      {
        n: 14,
        title: "Limitation of liability and indemnification",
        body: "To the extent permitted by applicable laws, Settlo and its suppliers will not be liable for any direct, indirect, incidental, special, consequential, or exemplary damages arising from the use of or inability to use the Services. The Services are provided on an 'as is' and 'as available' basis without any warranty. You agree to indemnify and hold Settlo harmless from any claim or demand arising out of your breach of these Terms, your violation of any law, or any aspect of the transaction between you and your customer.",
      },
      {
        n: 15,
        title: "Term and termination",
        body: "You may cancel your account and terminate these Terms at any time by contacting Settlo Support. Settlo may suspend or terminate your account for any reason, without notice, including if we suspect fraudulent activity. Upon termination: Settlo will cease providing Services; you will not be entitled to any refunds; any outstanding balance will immediately become due; and your Settlo Store will be taken offline. If you purchased a domain through Settlo, it will no longer be automatically renewed upon cancellation.",
      },
      {
        n: 16,
        title: "Modifications",
        body: "Settlo reserves the right to update or change any portion of these Terms at any time. We will provide reasonable advance notice of changes that materially affect your use of the Services or your rights, via email or through the Settlo administrative console. Changes may take effect immediately for legal, regulatory, fraud prevention, or security reasons. Your continued use of the Services after notice constitutes acceptance of the amended Terms.",
      },
      {
        n: 17,
        title: "General conditions",
        body: "These Terms constitute the entire agreement between you and Settlo and govern your use of the Services, superseding any prior agreements. The Terms will be governed by and interpreted in accordance with applicable Tanzanian law. If any provision is found invalid or unenforceable, it shall be modified to achieve its intent to the greatest extent possible, with remaining provisions continuing in full force. Settlo may assign these Terms without notice or consent. You may not assign your rights or obligations without Settlo's prior written consent.",
      },
    ],
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background rounded-lg">
      {/* Hero header */}
      <div
        style={{
          borderBottom: "1px solid var(--color-border-tertiary, #eaeaea)",
        }}
      >
        <div className="max-w-3xl mx-auto px-6 py-14">
          <div
            className="text-xs font-semibold uppercase tracking-widest mb-4"
            style={{ color: "#EB7F44" }}
          >
            Legal document
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-foreground mb-3">
            Terms of Service
          </h1>
          <p className="text-base text-muted-foreground">
            Settlo Technologies Limited · Last updated January 2025
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-12 space-y-14">
        {/* Intro card */}
        <div
          className="rounded-xl p-5 text-sm leading-7 text-muted-foreground"
          style={{ background: "#FDF0E8", border: "1px solid #F5C4B3" }}
        >
          <p>
            These General Terms of Service (&apos;General Terms&apos;) are a
            legal agreement between you, as a current or prospective customer of
            Settlo&apos;s services (&apos;you&apos;, &apos;your&apos;) and{" "}
            <strong className="text-foreground font-medium">
              Settlo Technologies Limited
            </strong>{" "}
            (&apos;Settlo&apos;, &apos;we&apos;, &apos;our&apos;,
            &apos;us&apos;) and govern your use of Settlo&apos;s services. By
            registering for or using the Services you agree to be bound by these
            Terms.
          </p>
        </div>

        {/* Section groups */}
        {sections.map((group) => (
          <div key={group.group} className="space-y-1">
            <div className="flex items-center gap-3 mb-6">
              <div
                className="h-px flex-1"
                style={{ background: "var(--color-border-tertiary, #eaeaea)" }}
              />
              <span
                className="text-[11px] font-semibold uppercase tracking-widest px-3 py-1 rounded-full"
                style={{ background: group.accentBg, color: group.accentText }}
              >
                {group.group}
              </span>
              <div
                className="h-px flex-1"
                style={{ background: "var(--color-border-tertiary, #eaeaea)" }}
              />
            </div>

            <div className="space-y-6">
              {group.items.map((item) => (
                <div key={item.n} className="flex gap-4">
                  <div
                    className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold mt-0.5"
                    style={{
                      background: group.accentBg,
                      color: group.accentText,
                    }}
                  >
                    {item.n}
                  </div>
                  <div
                    className="flex-1 pb-6"
                    style={{
                      borderBottom:
                        "1px solid var(--color-border-tertiary, #eaeaea)",
                    }}
                  >
                    <h3 className="text-sm font-semibold text-foreground mb-2 capitalize">
                      {item.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-7">
                      {item.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Third-party services notice */}
        <div
          className="rounded-xl p-5 text-sm leading-7"
          style={{ background: "#EEEDFE", border: "1px solid #CECBF6" }}
        >
          <p className="font-medium text-sm mb-1" style={{ color: "#3C3489" }}>
            Third-party services
          </p>
          <p style={{ color: "#534AB7" }}>
            Settlo may provide access to third-party software, applications,
            products, or services. Such services are made available as a
            convenience only. Your use of any third-party service is solely
            between you and the applicable third-party provider. Settlo provides
            no warranties and accepts no liability with respect to third-party
            services or providers.
          </p>
        </div>

        {/* Acknowledgement box */}
        <div
          className="rounded-xl p-5 text-sm leading-7"
          style={{ background: "#E1F5EE", border: "1px solid #9FE1CB" }}
        >
          <p className="font-medium text-sm mb-1" style={{ color: "#085041" }}>
            Acknowledgement
          </p>
          <p style={{ color: "#0F6E56" }}>
            I, the business owner or an authorised employee, have read and
            understood all terms and conditions in this binding contract of
            service between my business and Settlo Technologies Limited.
          </p>
        </div>

        {/* Footer */}
        <div
          className="pt-6 text-center space-y-1"
          style={{
            borderTop: "1px solid var(--color-border-tertiary, #eaeaea)",
          }}
        >
          <p className="text-xs text-muted-foreground">
            By using Settlo&apos;s services, you agree to these terms and
            conditions.
          </p>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Settlo Technologies Limited. All rights
            reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
