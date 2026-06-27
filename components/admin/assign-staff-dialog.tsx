"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
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
  SelectGroup,
  SelectItem,
  SelectLabel,
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
  listAssignableExternalAgents,
  unassignSalesPerson,
  unassignSupportStaff,
} from "@/lib/actions/admin/accounts";
import { AssignedStaffInfo, StaffAssigneeType } from "@/types/admin/account";

interface AssignStaffDialogProps {
  accountId: string;
  kind: "sales" | "support";
  current: AssignedStaffInfo | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone: () => void;
}

interface AssignOption {
  /** Encoded `${type}:${id}` — disambiguates internal staff vs external agent ids. */
  value: string;
  id: string;
  type: StaffAssigneeType;
  fullName: string;
  email: string;
  role: string;
}

function roleLabel(role: string): string {
  return role.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) =>
    c.toUpperCase(),
  );
}

function optionValue(type: StaffAssigneeType, id: string): string {
  return `${type}:${id}`;
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
  const [options, setOptions] = useState<AssignOption[]>([]);
  const currentValue = current
    ? optionValue(current.type ?? "INTERNAL_STAFF", current.id)
    : "";
  const [selectedValue, setSelectedValue] = useState<string>(currentValue);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [error, setError] = useState<string>("");
  const [isSaving, startSave] = useTransition();
  const [isRemoving, startRemove] = useTransition();

  const isSales = kind === "sales";
  const title = isSales ? "Assign sales person" : "Assign support staff";
  const fieldLabel = isSales ? "Sales person" : "Support staff";
  // Internal candidates are scoped by role CAPABILITY (works for dynamic roles):
  // SALES for the sales picker, SUPPORT for support (also enforced server-side).
  // Sales additionally allows external agents (influencers); support is internal-only.
  const eligibleCapability = isSales ? "SALES" : "SUPPORT";

  useEffect(() => {
    if (!open) {
      setError("");
      setSelectedValue(currentValue);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    Promise.all([
      listActiveInternalStaff(eligibleCapability),
      isSales
        ? listAssignableExternalAgents()
        : Promise.resolve<AssignedStaffInfo[]>([]),
    ])
      .then(([internal, external]) => {
        if (cancelled) return;
        const internalOptions: AssignOption[] = internal
          // Server scopes by capability; filter again so a not-yet-deployed
          // backend (ignoring the param) can't surface the wrong staff.
          .filter((s) => s.assignableAs === eligibleCapability)
          .map((s) => ({
            value: optionValue("INTERNAL_STAFF", s.id),
            id: s.id,
            type: "INTERNAL_STAFF" as const,
            fullName: s.fullName,
            email: s.email,
            role: s.internalRole,
          }));
        const externalOptions: AssignOption[] = external.map((a) => ({
          value: optionValue("EXTERNAL_AGENT", a.id),
          id: a.id,
          type: "EXTERNAL_AGENT" as const,
          fullName: a.fullName,
          email: a.email,
          role: a.role || "EXTERNAL_AGENT",
        }));
        setOptions([...internalOptions, ...externalOptions]);
        setSelectedValue(currentValue);
      })
      .catch((err: any) => {
        if (cancelled) return;
        setLoadError(err?.message ?? "Failed to load candidates.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // currentValue derives from current.id/type; depend on the primitives.
  }, [open, current?.id, current?.type, eligibleCapability, isSales]);

  const internalOptions = useMemo(
    () => options.filter((o) => o.type === "INTERNAL_STAFF"),
    [options],
  );
  const externalOptions = useMemo(
    () => options.filter((o) => o.type === "EXTERNAL_AGENT"),
    [options],
  );

  const handleSave = () => {
    setError("");
    if (!selectedValue) {
      setError("Choose someone to assign");
      return;
    }
    if (selectedValue === currentValue) {
      onOpenChange(false);
      return;
    }
    const sep = selectedValue.indexOf(":");
    const type = selectedValue.slice(0, sep) as StaffAssigneeType;
    const id = selectedValue.slice(sep + 1);

    startSave(async () => {
      const result = isSales
        ? await assignSalesPerson(accountId, id, type)
        : await assignSupportStaff(accountId, id);
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
      const fn = isSales ? unassignSalesPerson : unassignSupportStaff;
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

  const renderOption = (o: AssignOption) => (
    <SelectItem key={o.value} value={o.value}>
      <div className="flex flex-col">
        <span className="font-medium">{o.fullName}</span>
        <span className="text-xs text-muted-foreground">
          {roleLabel(o.role)} · {o.email}
        </span>
      </div>
    </SelectItem>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {current
              ? `Currently assigned: ${current.fullName} (${current.email}).`
              : isSales
                ? "Assign an internal sales-team member or an external agent."
                : "No one is currently assigned."}
          </DialogDescription>
        </DialogHeader>

        {(error || loadError) && (
          <FormError message={error || loadError || ""} />
        )}

        <div className="space-y-2">
          <Label className="text-xs">{fieldLabel}</Label>
          <Select
            value={selectedValue}
            onValueChange={setSelectedValue}
            disabled={loading || isSaving || isRemoving}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={loading ? "Loading…" : "Choose someone to assign"}
              />
            </SelectTrigger>
            <SelectContent>
              {isSales ? (
                <>
                  <SelectGroup>
                    <SelectLabel>Internal sales team</SelectLabel>
                    {internalOptions.map(renderOption)}
                    {internalOptions.length === 0 && (
                      <p className="px-3 py-1.5 text-xs text-muted-foreground">
                        No active sales-team staff.
                      </p>
                    )}
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel>External agents</SelectLabel>
                    {externalOptions.map(renderOption)}
                    {externalOptions.length === 0 && (
                      <p className="px-3 py-1.5 text-xs text-muted-foreground">
                        No active external agents.
                      </p>
                    )}
                  </SelectGroup>
                </>
              ) : (
                <>
                  {internalOptions.map(renderOption)}
                  {internalOptions.length === 0 && !loading && (
                    <p className="px-3 py-2 text-sm text-muted-foreground">
                      No active support agents available.
                    </p>
                  )}
                </>
              )}
            </SelectContent>
          </Select>
          {isSales && (
            <p className="text-[11px] text-muted-foreground">
              External agents (e.g. influencers) can be the sales person; support
              staff is always internal.
            </p>
          )}
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
            disabled={isSaving || isRemoving || !selectedValue}
          >
            {isSaving ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving…
              </span>
            ) : selectedValue === currentValue ? (
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
