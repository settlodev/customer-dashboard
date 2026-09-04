import Link from "next/link";
import { ArrowRight, Check, CheckCircle2 } from "lucide-react";
import React from "react";

import type { Faq } from "@/lib/seo/structured-data";

export type SolutionSection = {
  heading: string;
  body: string;
  bullets?: string[];
};

export type SolutionPageProps = {
  /** Small label above the H1. */
  eyebrow: string;
  /** H1 split so the second half renders in the brand gradient. */
  title: string;
  titleAccent: string;
  /** Lead paragraph — the first thing a search visitor reads. */
  intro: React.ReactNode;
  /** Trust chips under the CTA row. */
  highlights: string[];
  /** Body content. Each becomes an <h2> section. */
  sections: SolutionSection[];
  /** Rendered as visible copy AND as FAQPage markup by the calling page. */
  faqs: Faq[];
  faqHeading: string;
  ctaHeading: string;
  ctaBody: string;
  primaryCta: { label: string; href: string };
  secondaryCta: { label: string; href: string };
  /** Contextual links to sibling solution pages. */
  relatedHeading: string;
  related: { label: string; description: string; href: string }[];
  /** Visible breadcrumb, matching the BreadcrumbList markup. */
  breadcrumb: { name: string; path: string }[];
};

export function SolutionPage({
  eyebrow,
  title,
  titleAccent,
  intro,
  highlights,
  sections,
  faqs,
  faqHeading,
  ctaHeading,
  ctaBody,
  primaryCta,
  secondaryCta,
  relatedHeading,
  related,
  breadcrumb,
}: SolutionPageProps) {
  return (
    <div className="w-full space-y-20 md:space-y-24">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="pt-2">
        <ol className="flex flex-wrap items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          {breadcrumb.map((crumb, index) => {
            const isLast = index === breadcrumb.length - 1;
            return (
              <li key={crumb.path} className="flex items-center gap-2">
                {isLast ? (
                  <span aria-current="page" className="text-gray-700 dark:text-gray-300">
                    {crumb.name}
                  </span>
                ) : (
                  <>
                    <Link href={crumb.path} className="hover:text-primary transition-colors">
                      {crumb.name}
                    </Link>
                    <span aria-hidden="true">/</span>
                  </>
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      {/* Hero */}
      <section className="-mt-12">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary mb-4">
          {eyebrow}
        </p>
        <h1
          className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 dark:text-gray-100 mb-6 max-w-4xl"
          style={{ lineHeight: "1.2" }}
        >
          {title}{" "}
          <span className="bg-gradient-to-r from-primary to-orange-400 bg-clip-text text-transparent">
            {titleAccent}
          </span>
        </h1>
        <div className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed max-w-3xl space-y-4">
          {intro}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mt-8">
          <Link
            href={primaryCta.href}
            className="inline-flex items-center justify-center px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 shadow-sm hover:shadow-md transition-all duration-200"
          >
            {primaryCta.label}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
          <Link
            href={secondaryCta.href}
            className="inline-flex items-center justify-center px-6 py-3 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-lg font-medium border border-gray-200 dark:border-gray-700 hover:border-primary/40 hover:bg-primary-light dark:hover:bg-gray-700 transition-all duration-200"
          >
            {secondaryCta.label}
          </Link>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-6">
          {highlights.map((text) => (
            <span
              key={text}
              className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400"
            >
              <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
              {text}
            </span>
          ))}
        </div>
      </section>

      {/* Body sections */}
      <section className="space-y-12">
        {sections.map((section) => (
          <article key={section.heading} className="max-w-3xl">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 mb-4">
              {section.heading}
            </h2>
            <p className="text-base text-gray-600 dark:text-gray-400 leading-relaxed">
              {section.body}
            </p>
            {section.bullets && (
              <ul className="mt-5 space-y-2.5">
                {section.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                      {bullet}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </article>
        ))}
      </section>

      {/* FAQs — rendered as plain text so the FAQPage markup on the calling
          page always matches content the visitor can actually read. */}
      <section>
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 mb-8">
          {faqHeading}
        </h2>
        <div className="space-y-6 max-w-3xl">
          {faqs.map((faq) => (
            <div
              key={faq.question}
              className="rounded-2xl bg-white/70 dark:bg-gray-800/60 p-6 shadow-sm"
            >
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {faq.question}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {faq.answer}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Related solution pages — internal links spreading authority. */}
      <section>
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 mb-8">
          {relatedHeading}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {related.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group rounded-2xl bg-white/70 dark:bg-gray-800/60 p-6 shadow-sm hover:shadow-md border border-transparent hover:border-primary/30 transition-all duration-200"
            >
              <span className="block text-base font-semibold text-gray-900 dark:text-gray-100 mb-2 group-hover:text-primary transition-colors">
                {item.label}
              </span>
              <span className="block text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {item.description}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Closing CTA */}
      <section className="rounded-3xl bg-gradient-to-br from-primary/10 via-white/60 to-primary/5 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 p-8 md:p-12">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 mb-4">
          {ctaHeading}
        </h2>
        <p className="text-base text-gray-600 dark:text-gray-400 leading-relaxed max-w-2xl mb-8">
          {ctaBody}
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href={primaryCta.href}
            className="inline-flex items-center justify-center px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 shadow-sm hover:shadow-md transition-all duration-200"
          >
            {primaryCta.label}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
          <Link
            href={secondaryCta.href}
            className="inline-flex items-center justify-center px-6 py-3 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-lg font-medium border border-gray-200 dark:border-gray-700 hover:border-primary/40 transition-all duration-200"
          >
            {secondaryCta.label}
          </Link>
        </div>
      </section>
    </div>
  );
}
