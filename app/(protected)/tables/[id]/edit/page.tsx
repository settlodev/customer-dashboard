import { UUID } from "node:crypto";
import { notFound, redirect } from "next/navigation";

import {
  PageShell,
  PageHeader,
  PageBreadcrumbs,
  PageBody,
} from "@/components/layouts/page-shell";
import SpaceForm from "@/components/forms/space_form";
import { getTable, getSpace } from "@/lib/actions/space-actions";
import { Space } from "@/types/space/type";

type Params = Promise<{ id: string }>;

export default async function TableEditPage({ params }: { params: Params }) {
  const { id } = await params;

  if (id === "new") redirect("/tables/new");

  let space: Space | null = null;
  let redirectTo: string | null = null;
  try {
    space = await getTable(id as UUID);
  } catch {
    try {
      const asSpace = await getSpace(id as UUID);
      redirectTo = `/spaces/${asSpace.id}/edit`;
    } catch {
      /* fall through to notFound */
    }
  }
  if (redirectTo) redirect(redirectTo);
  if (!space) notFound();

  return (
    <PageShell>
      <PageBreadcrumbs
        items={[
          { title: "Tables", href: "/tables" },
          { title: space.name, href: `/tables/${space.id}` },
          { title: "Edit" },
        ]}
      />
      <PageHeader
        title={`Edit ${space.name}`}
        subtitle="Update capacity, status, layout, and reservation settings."
      />
      <PageBody>
        <SpaceForm item={space} mode="table" />
      </PageBody>
    </PageShell>
  );
}
