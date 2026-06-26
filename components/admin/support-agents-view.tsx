"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/tables/data-table";
import { buildSupportAgentColumns } from "@/components/tables/admin-support-agents/column";
import { CreateSupportAgentDialog } from "@/components/admin/create-support-agent-dialog";
import { SupportAgentPage } from "@/types/admin/support-agent";

interface SupportAgentsViewProps {
  initialPage: SupportAgentPage;
  canManage: boolean;
}

export function SupportAgentsView({
  initialPage,
  canManage,
}: SupportAgentsViewProps) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);

  const columns = useMemo(
    () => buildSupportAgentColumns({ canManage }),
    [canManage],
  );

  const { content, totalElements, totalPages, number, size } = initialPage;
  const fromIndex = totalElements === 0 ? 0 : number * size + 1;
  const toIndex = Math.min((number + 1) * size, totalElements);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="font-mono text-[12px] text-muted-foreground">
          {totalElements === 0
            ? "No support agents yet"
            : `${fromIndex}–${toIndex} of ${totalElements}`}
        </p>
        {canManage && (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            New support agent
          </Button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={content}
        searchKey="fullName"
        hideSearch
        pageNo={number}
        total={totalElements}
        pageCount={Math.max(1, totalPages)}
        defaultPageSize={size}
        disableArchive
      />

      {canManage && (
        <CreateSupportAgentDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          onCreated={() => router.refresh()}
        />
      )}
    </div>
  );
}
