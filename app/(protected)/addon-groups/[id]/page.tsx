import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Pencil } from "lucide-react";
import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
import { Button } from "@/components/ui/button";
import { getAddonGroup } from "@/lib/actions/addon-actions";
import { getLocationCurrency } from "@/lib/actions/currency-actions";
import type { AddonGroup } from "@/types/product/type";
import { AddonGroupDetailView } from "./addon-group-detail-view";
import { AddonGroupDetailActions } from "./addon-group-detail-actions";

type Params = Promise<{ id: string }>;

export default async function AddonGroupPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;

  // /addon-groups/new is now a sibling route — bounce there if someone
  // links to it through the dynamic segment.
  if (id === "new") redirect("/addon-groups/new");

  let group: AddonGroup | null = null;
  try {
    group = await getAddonGroup(id);
    if (!group) notFound();
  } catch {
    throw new Error("Failed to load addon group");
  }

  const currency = await getLocationCurrency();

  const isArchived = group.archivedAt != null;
  const statusLabel = isArchived
    ? "Archived"
    : group.active
      ? "Active"
      : "Inactive";
  const statusClass = isArchived
    ? "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
    : group.active
      ? "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400"
      : "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400";

  const liveItems = (group.items ?? []).filter((i) => i.active);
  const subtitleParts = [
    `${liveItems.length} item${liveItems.length === 1 ? "" : "s"}`,
    `${group.minSelections}–${group.maxSelections} selectable`,
  ];

  return (
    <PageShell>
      <PageBreadcrumbs
        items={[
          { title: "Addon groups", href: "/addon-groups" },
          { title: group.name },
        ]}
      />
      <PageHeader
        title={group.name}
        titleAccessory={
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClass}`}
          >
            {statusLabel}
          </span>
        }
        subtitle={subtitleParts.join(" · ")}
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <Link href={`/addon-groups/${group.id}/edit`}>
                <Pencil className="mr-1.5 h-4 w-4" />
                Edit
              </Link>
            </Button>
            <AddonGroupDetailActions group={group} />
          </>
        }
      />

      <PageBody>
        <AddonGroupDetailView group={group} currency={currency} />
      </PageBody>
    </PageShell>
  );
}
