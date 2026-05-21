"use client";

import { useEffect, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormError } from "@/components/widgets/form-error";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

import {
  assignSalesPerson,
  assignSupportStaff,
  listActiveInternalStaff,
  unassignSalesPerson,
  unassignSupportStaff,
} from "@/lib/actions/admin/accounts";
import {
  AssignedStaffInfo,
} from "@/types/admin/account";
import { InternalStaffSummary } from "@/types/admin/internal-staff";

interface AssignStaffDialogProps {
  accountId: string;
  kind: "sales" | "support";
  current: AssignedStaffInfo | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone: () => void;
}

function roleLabel(role: string): string {
  return role.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) =>
    c.toUpperCase(),
  );
}

export function AssignStaffDialog({
  accountId,
  kind,
  current,
  open,
  onOpenChange,
  onDone,
}: AssignStaffDialogProps) {
  const { toast } = useToast();
  const [staff, setStaff] = useState<InternalStaffSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string>(current?.id ?? "");
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [staffError, setStaffError] = useState<string | null>(null);
  const [error, setError] = useState<string>("");
  const [isSaving, startSave] = useTransition();
  const [isRemoving, startRemove] = useTransition();

  const title =
    kind === "sales" ? "Assign sales person" : "Assign support staff";
  const fieldLabel = kind === "sales" ? "Sales person" : "Support staff";

  useEffect(() => {
    if (!open) {
      setError("");
      setSelectedId(current?.id ?? "");
      return;
    }
    let cancelled = false;
    setLoadingStaff(true);
    setStaffError(null);
    listActiveInternalStaff()
      .then((list) => {
        if (cancelled) return;
        setStaff(list);
        setSelectedId(current?.id ?? "");
      })
      .catch((err: any) => {
        if (cancelled) return;
        setStaffError(err?.message ?? "Failed to load internal staff.");
      })
      .finally(() => {
        if (!cancelled) setLoadingStaff(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, current?.id]);

  const handleSave = () => {
    setError("");
    if (!selectedId) {
      setError("Choose a staff member");
      return;
    }
    if (selectedId === current?.id) {
      onOpenChange(false);
      return;
    }
    startSave(async () => {
      const fn = kind === "sales" ? assignSalesPerson : assignSupportStaff;
      const result = await fn(accountId, selectedId);
      if (result.responseType === "error") {
        setError(result.message);
        return;
      }
      toast({ title: result.message });
      onDone();
      onOpenChange(false);
    });
  };

  const handleRemove = () => {
    setError("");
    startRemove(async () => {
      const fn = kind === "sales" ? unassignSalesPerson : unassignSupportStaff;
      const result = await fn(accountId);
      if (result.responseType === "error") {
        setError(result.message);
        return;
      }
      toast({ title: result.message });
      onDone();
      onOpenChange(false);
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {current
              ? `Currently assigned: ${current.fullName} (${current.email}).`
              : "No one is currently assigned."}
          </DialogDescription>
        </DialogHeader>

        {(error || staffError) && (
          <FormError message={error || staffError || ""} />
        )}

        <div className="space-y-2">
          <Label className="text-xs">{fieldLabel}</Label>
          <Select
            value={selectedId}
            onValueChange={setSelectedId}
            disabled={loadingStaff || isSaving || isRemoving}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={loadingStaff ? "Loading…" : "Choose a staff member"}
              />
            </SelectTrigger>
            <SelectContent>
              {staff.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  <div className="flex flex-col">
                    <span className="font-medium">{s.fullName}</span>
                    <span className="text-xs text-muted-foreground">
                      {roleLabel(s.internalRole)} · {s.email}
                    </span>
                  </div>
                </SelectItem>
              ))}
              {staff.length === 0 && !loadingStaff && (
                <p className="px-3 py-2 text-sm text-muted-foreground">
                  No active internal staff available.
                </p>
              )}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter className="gap-2">
          {current && (
            <Button
              type="button"
              variant="outline"
              onClick={handleRemove}
              disabled={isSaving || isRemoving}
              className="text-destructive hover:bg-destructive/10"
            >
              {isRemoving ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Removing…
                </span>
              ) : (
                "Unassign"
              )}
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving || isRemoving}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving || isRemoving || !selectedId}
          >
            {isSaving ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving…
              </span>
            ) : current?.id === selectedId ? (
              "Close"
            ) : (
              "Save"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
