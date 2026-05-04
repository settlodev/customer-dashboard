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
import { getModifierGroup } from "@/lib/actions/modifier-actions";
import { getLocationCurrency } from "@/lib/actions/currency-actions";
import type { ModifierGroup } from "@/types/product/type";
import { ModifierGroupDetailView } from "./modifier-group-detail-view";
import { ModifierGroupDetailActions } from "./modifier-group-detail-actions";

type Params = Promise<{ id: string }>;

export default async function ModifierGroupPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;

  // /modifier-groups/new is now reachable via /modifier-groups/new/page —
  // bounce there if someone hits this dynamic segment with "new".
  if (id === "new") redirect("/modifier-groups/new");

  let group: ModifierGroup | null = null;
  try {
    group = await getModifierGroup(id);
    if (!group) notFound();
  } catch {
    throw new Error("Failed to load modifier group");
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

  const liveOptions = (group.options ?? []).filter(
    (o) => o.archivedAt == null,
  );
  const subtitleParts = [
    group.selectionType === "SINGLE" ? "Single selection" : "Multi selection",
    `${liveOptions.length} option${liveOptions.length === 1 ? "" : "s"}`,
  ];

  return (
    <PageShell>
      <PageBreadcrumbs
        items={[
          { title: "Modifier groups", href: "/modifier-groups" },
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
              <Link href={`/modifier-groups/${group.id}/edit`}>
                <Pencil className="mr-1.5 h-4 w-4" />
                Edit
              </Link>
            </Button>
            <ModifierGroupDetailActions group={group} />
          </>
        }
      />

      <PageBody>
        <ModifierGroupDetailView group={group} currency={currency} />
      </PageBody>
    </PageShell>
  );
}
