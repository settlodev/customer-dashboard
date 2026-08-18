import { notFound } from "next/navigation";

import {
  PageBody,
  PageBreadcrumbs,
  PageHeader,
  PageShell,
} from "@/components/layouts/page-shell";
import {
  JOURNAL_ENTRY_STATUS_LABELS,
  JOURNAL_ENTRY_STATUS_TONES,
} from "@/types/journal-entry/type";
import { getJournalEntry } from "@/lib/actions/journal-entry-actions";
import { getAccountingLocationSettings } from "@/lib/actions/accounting-location-settings-actions";

import JournalEntryForm from "@/components/forms/journal_entry_form";
import { JournalEntryDetailClient } from "./journal-entry-detail-client";

type Params = Promise<{ id: string }>;

export default async function JournalEntryDetail({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;
  const isNew = id === "new";
  const settings = await getAccountingLocationSettings();
  const defaultCurrency = settings.currency || settings.defaultCurrency || "TZS";

  if (isNew) {
    return (
      <PageShell>
        <PageBreadcrumbs
          items={[
            { title: "Accounting" },
            {
              title: "Journal entries",
              href: "/accounting/journal-entries",
            },
            { title: "New" },
          ]}
        />
        <PageHeader
          title="New journal entry"
          subtitle="Manual double-entry posting. Saved as DRAFT until balanced and posted."
        />
        <PageBody>
          <JournalEntryForm item={null} defaultCurrency={defaultCurrency} />
        </PageBody>
      </PageShell>
    );
  }

  const entry = await getJournalEntry(id);
  if (!entry) notFound();

  return (
    <PageShell>
      <PageBreadcrumbs
        items={[
          { title: "Accounting" },
          {
            title: "Journal entries",
            href: "/accounting/journal-entries",
          },
          { title: entry.entryNumber },
        ]}
      />
      <PageHeader
        title={entry.entryNumber}
        subtitle={entry.description ?? undefined}
        titleAccessory={
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${JOURNAL_ENTRY_STATUS_TONES[entry.status]}`}
          >
            {JOURNAL_ENTRY_STATUS_LABELS[entry.status]}
          </span>
        }
      />
      <PageBody>
        <JournalEntryDetailClient entry={entry} />
      </PageBody>
    </PageShell>
  );
}
