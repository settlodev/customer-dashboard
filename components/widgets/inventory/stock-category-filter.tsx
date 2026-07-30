"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { StockCategory } from "@/types/stock-category/type";

/**
 * Category filter for the stock list. A client component because the
 * surrounding tabs are plain `<Link>`s — this one has to push a rewritten
 * query string rather than render a static href.
 *
 * Merges into the existing params instead of replacing them, so the active
 * tab and search term survive a category change. Selecting a category resets
 * `page`, or you can land on page 4 of a one-page result.
 */
export function StockCategoryFilter({
  categories,
}: {
  categories: StockCategory[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get("category") ?? "";

  const onChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("category", value);
    } else {
      params.delete("category");
    }
    params.delete("page");
    const qs = params.toString();
    router.push(qs ? `/stock-variants?${qs}` : "/stock-variants");
  };

  return (
    <select
      aria-label="Filter by stock category"
      value={current}
      onChange={(e) => onChange(e.target.value)}
      className="h-8 rounded-md border border-line bg-card px-2 text-[12.5px] text-ink"
    >
      <option value="">All categories</option>
      {categories.map((c) => (
        <option key={c.id} value={c.id}>
          {c.active ? c.name : `${c.name} (inactive)`}
        </option>
      ))}
    </select>
  );
}
