"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, Loader2, ThumbsDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogIcon,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { SectionCard } from "@/components/admin/shared/section-card";
import { DefList, DefRow } from "@/components/admin/shared/def-list";
import { formatDateTime } from "@/components/admin/shared/format";
import { MatchCandidatesPanel } from "@/components/admin/settlo-suppliers/match-candidates-panel";
import { useToast } from "@/hooks/use-toast";
import {
  approveNomination,
  rejectNomination,
} from "@/lib/actions/admin/supplier-nominations";
import type { NominationReview } from "@/types/supplier/nomination";

interface NominationDecisionClientProps {
  nomination: NominationReview;
  canManage: boolean;
}

const RESOLUTION_LABELS: Record<string, string> = {
  CREATED: "Created new directory entry",
  MATCHED: "Matched to existing supplier",
};

/**
 * NominationDecisionClient — owns every interactive part of the nomination
 * detail page: the match-candidates panel, the approve/reject actions, and
 * (once decided) the decision summary. The server page keeps the static
 * submitted-snapshot / note / deleted-source-supplier sections; everything
 * that mutates state lives here so `useTransition` + toast + `router`
 * plumbing stays in one place.
 */
export function NominationDecisionClient({
  nomination,
  canManage,
}: NominationDecisionClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [reason, setReason] = useState("");

  const handleApproveNew = () => {
    startTransition(async () => {
      const res = await approveNomination(nomination.id, { mode: "CREATE" });
      if (res.responseType === "error") {
        toast({
          variant: "destructive",
          title: "Couldn't approve nomination",
          description: res.message,
        });
        return;
      }
      toast({ title: res.message });
      const newSupplierId = res.data?.settloSupplierId;
      if (newSupplierId) {
        router.push(`/settlo-suppliers/${newSupplierId}`);
      } else {
        router.refresh();
      }
    });
  };

  const handleMatch = (settloSupplierId: string) => {
    startTransition(async () => {
      const res = await approveNomination(nomination.id, {
        mode: "MATCH",
        settloSupplierId,
      });
      if (res.responseType === "error") {
        toast({
          variant: "destructive",
          title: "Couldn't match nomination",
          description: res.message,
        });
        return;
      }
      toast({ title: res.message });
      router.refresh();
    });
  };

  const handleReject = () => {
    startTransition(async () => {
      const res = await rejectNomination(nomination.id, reason);
      if (res.responseType === "error") {
        toast({
          variant: "destructive",
          title: "Couldn't reject nomination",
          description: res.message,
        });
        return;
      }
      toast({ title: res.message });
      router.refresh();
    });
  };

  if (nomination.status !== "SUBMITTED") {
    if (nomination.status === "WITHDRAWN") {
      return (
        <SectionCard title="Decision">
          <p className="text-sm text-muted-foreground">
            The merchant withdrew this nomination before it was reviewed.
          </p>
        </SectionCard>
      );
    }

    return (
      <SectionCard title="Decision">
        <DefList>
          <DefRow
            label="Outcome"
            value={
              nomination.resolution
                ? (RESOLUTION_LABELS[nomination.resolution] ?? nomination.resolution)
                : "—"
            }
            rawValue
          />
          <DefRow
            label="Reviewed"
            value={formatDateTime(nomination.reviewedAt)}
            rawValue
          />
          {nomination.settloSupplierId && (
            <DefRow
              label="Directory entry"
              value={
                <Link
                  href={`/settlo-suppliers/${nomination.settloSupplierId}`}
                  className="text-primary hover:underline"
                >
                  View supplier
                </Link>
              }
              rawValue
            />
          )}
          {nomination.rejectionReason && (
            <DefRow
              label="Reason"
              value={nomination.rejectionReason}
              rawValue
            />
          )}
        </DefList>
      </SectionCard>
    );
  }

  return (
    <div className="space-y-4">
      <MatchCandidatesPanel
        candidates={nomination.matchCandidates}
        canManage={canManage}
        onMatch={handleMatch}
        isPending={isPending}
      />

      {canManage && (
        <SectionCard
          title="Decision"
          subtitle="Approve to add this supplier to the directory, or reject with a reason."
        >
          <div className="space-y-3">
            <Button
              type="button"
              onClick={handleApproveNew}
              disabled={isPending}
              className="w-full justify-center bg-pos hover:bg-pos/90"
            >
              {isPending ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="mr-1.5 h-3.5 w-3.5" />
              )}
              Approve as new directory entry
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isPending}
                  className="w-full justify-center border-neg/40 text-neg hover:bg-neg/5 hover:text-neg"
                >
                  <ThumbsDown className="mr-1.5 h-3.5 w-3.5" />
                  Reject
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent tone="danger">
                <AlertDialogIcon>
                  <ThumbsDown className="h-5 w-5" />
                </AlertDialogIcon>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Reject {nomination.name}?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    The merchant sees this reason. The nomination won&apos;t be
                    added to the directory.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="space-y-1.5">
                  <Label htmlFor="reject-reason" className="text-xs">
                    Reason <span className="text-primary">*</span>
                  </Label>
                  <Textarea
                    id="reject-reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Why is this nomination being rejected?"
                    rows={3}
                    maxLength={2000}
                    disabled={isPending}
                  />
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isPending}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={(e) => {
                      e.preventDefault();
                      handleReject();
                    }}
                    disabled={isPending || reason.trim().length === 0}
                  >
                    {isPending ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Working…
                      </span>
                    ) : (
                      "Reject nomination"
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </SectionCard>
      )}
    </div>
  );
}
