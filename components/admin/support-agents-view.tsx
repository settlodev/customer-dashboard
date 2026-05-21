"use client";

import { useCallback, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeftIcon, ArrowRightIcon, MoreHorizontal, Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

import { CreateSupportAgentDialog } from "@/components/admin/create-support-agent-dialog";
import {
  deactivateSupportAgent,
  reactivateSupportAgent,
} from "@/lib/actions/admin/support-agents";
import {
  SupportAgentPage,
  SupportAgentResponse,
} from "@/types/admin/support-agent";

interface SupportAgentsViewProps {
  initialPage: SupportAgentPage;
  canManage: boolean;
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return value;
  }
}

export function SupportAgentsView({
  initialPage,
  canManage,
}: SupportAgentsViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [busyAgentId, setBusyAgentId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const updateParams = useCallback(
    (changes: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(changes)) {
        if (value === null || value === "") next.delete(key);
        else next.set(key, value);
      }
      const qs = next.toString();
      startTransition(() => {
        router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      });
    },
    [pathname, router, searchParams],
  );

  const goToPage = (page: number) => {
    updateParams({ page: page > 0 ? String(page) : null });
  };

  const handleToggle = (agent: SupportAgentResponse) => {
    if (busyAgentId) return;
    setBusyAgentId(agent.id);
    startTransition(async () => {
      const result = agent.active
        ? await deactivateSupportAgent(agent.id)
        : await reactivateSupportAgent(agent.id);
      setBusyAgentId(null);
      if (result.responseType === "error") {
        toast({
          title: "Action failed",
          description: result.message,
          variant: "destructive",
        });
        return;
      }
      toast({ title: result.message });
      router.refresh();
    });
  };

  const {
    content,
    totalElements,
    totalPages,
    number,
    first,
    last,
    size,
  } = initialPage;
  const fromIndex = number * size + 1;
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

      <div className="overflow-hidden rounded-lg border border-line">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Agent</TableHead>
              <TableHead>Referral code</TableHead>
              <TableHead className="text-right">Active referrals</TableHead>
              <TableHead className="text-right">Total referrals</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[60px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {content.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-10 text-center text-sm text-muted-foreground"
                >
                  No support agents yet. Create one to issue referral codes.
                </TableCell>
              </TableRow>
            ) : (
              content.map((agent) => (
                <TableRow key={agent.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-ink">
                        {agent.fullName}
                      </span>
                      <span className="font-mono text-[11px] text-muted-foreground">
                        {agent.email}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-[12px]">
                    {agent.referralCode ?? "—"}
                  </TableCell>
                  <TableCell className="text-right font-mono text-[12px] tabular-nums">
                    {agent.activeReferrals.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right font-mono text-[12px] tabular-nums">
                    {agent.totalReferrals.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        agent.active
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20"
                          : "border-muted bg-muted text-muted-foreground"
                      }
                    >
                      {agent.active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-[12px] text-muted-foreground">
                    {formatDate(agent.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    {canManage ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            aria-label={`Actions for ${agent.fullName}`}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            disabled={isPending && busyAgentId === agent.id}
                            onSelect={() => handleToggle(agent)}
                            className={
                              agent.active
                                ? "text-amber-700 focus:bg-amber-50 focus:text-amber-800 dark:text-amber-300 dark:focus:bg-amber-500/10"
                                : "text-emerald-700 focus:bg-emerald-50 focus:text-emerald-800 dark:text-emerald-300 dark:focus:bg-emerald-500/10"
                            }
                          >
                            {agent.active ? "Deactivate" : "Reactivate"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-2">
          <p className="font-mono text-[12px] text-muted-foreground">
            Page {number + 1} of {totalPages}
          </p>
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => goToPage(number - 1)}
              disabled={first || isPending}
            >
              <ArrowLeftIcon className="mr-1 h-3.5 w-3.5" />
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => goToPage(number + 1)}
              disabled={last || isPending}
            >
              Next
              <ArrowRightIcon className="ml-1 h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

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
