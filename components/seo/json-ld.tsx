import React from "react";

/**
 * Renders schema.org structured data as a real
 * `<script type="application/ld+json">` tag.
 *
 * This exists because Next's `metadata.other` map renders every entry as
 * `<meta name="..." content="...">`. Structured data smuggled through it
 * (e.g. `other: { "script:ld+json": ... }`) therefore ships as meta tags,
 * which Google's structured-data parser ignores entirely — the schema is
 * present in the HTML but invisible to search. Rich results (pricing,
 * ratings, FAQ accordions, sitelinks) require the script tag below.
 */
export function JsonLd({ schema }: { schema: object | object[] }) {
  const payload = Array.isArray(schema) ? schema : [schema];

  return (
    <>
      {payload.map((entry, index) => (
        <script
          key={index}
          type="application/ld+json"
          // `<` is escaped so a stray "</script>" inside any string value
          // cannot terminate the tag early. JSON.stringify alone does not
          // escape it, and every value here is interpolated into raw HTML.
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(entry).replace(/</g, "\\u003c"),
          }}
        />
      ))}
    </>
  );
}
