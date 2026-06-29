"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

const OPTIONS: { label: string; value: string }[] = [
  { label: "All", value: "" },
  { label: "Draft", value: "DRAFT" },
  { label: "Sent", value: "SENT" },
  { label: "Converted", value: "CONVERTED" },
  { label: "Expired", value: "EXPIRED" },
  { label: "Cancelled", value: "CANCELLED" },
];

/**
 * Segmented status filter for the proforma list — syncs to `?status` (server
 * re-queries the filtered set), resetting paging. Mirrors the redesign's pill
 * control rather than the DataTable's dropdown.
 */
export function ProformaStatusTabs() {
  const pathname = usePathname();
  const router = useRouter();
  const params = useSearchParams();
  const current = params.get("status") ?? "";

  const go = (value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set("status", value);
    else next.delete("status");
    next.delete("page");
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  };

  return (
    <div className="inline-flex flex-wrap gap-1 rounded-lg border border-line bg-card p-1">
      {OPTIONS.map((o) => (
        <button
          key={o.value || "all"}
          type="button"
          onClick={() => go(o.value)}
          className={cn(
            "rounded-md px-3 py-1.5 text-[12.5px] font-medium transition-colors",
            current === o.value
              ? "bg-ink text-white"
              : "text-ink-3 hover:text-ink",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
