"use client";

import { useEffect, useState, useTransition } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

import { SettingsSection } from "../shared/settings-section";
import { OpeningBalanceSection } from "../opening-balance/opening-balance-section";
import { ChartOfAccountSelector } from "@/components/widgets/chart-of-account-selector";
import {
  listChartOfAccounts,
  listCoaSubTypes,
} from "@/lib/actions/accounting-mapping-actions";
import {
  createChartOfAccount,
  deleteChartOfAccount,
  toggleChartOfAccountActive,
  updateChartOfAccount,
} from "@/lib/actions/chart-of-account-actions";
import type { ChartOfAccountFormValues } from "@/types/chart-of-account/schema";
import {
  ACCOUNT_TYPE_LABELS,
  BALANCE_SHEET_PARENT_TYPES,
  DEFAULT_PL_SECTION_BY_ACCOUNT_TYPE,
  PL_SECTION_LABELS,
  PL_SECTIONS_BY_ACCOUNT_TYPE,
  type AccountType,
  type ChartOfAccount,
  type CoaSubTypeOption,
  type PlSection,
} from "@/types/accounting-mapping/type";

// Radix Select rejects an empty-string item value, so "no sub-type" needs a
// sentinel; it is mapped back to "" before it reaches the form state.
const NO_SUB_TYPE = "__none__";

const NORMAL_BALANCE_BY_TYPE: Record<AccountType, "DEBIT" | "CREDIT"> = {
  CURRENT_ASSET: "DEBIT",
  NON_CURRENT_ASSET: "DEBIT",
  CURRENT_LIABILITY: "CREDIT",
  NON_CURRENT_LIABILITY: "CREDIT",
  EQUITY: "CREDIT",
  REVENUE: "CREDIT",
  EXPENSE: "DEBIT",
};

export function ChartOfAccountsPanel() {
  const { toast } = useToast();
  const [items, setItems] = useState<ChartOfAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ChartOfAccount | null>(null);
  const [form, setForm] = useState<ChartOfAccountFormValues>({
    code: "",
    name: "",
    description: "",
    accountType: "EXPENSE",
    plSection: DEFAULT_PL_SECTION_BY_ACCOUNT_TYPE.EXPENSE,
    accountSubType: "",
    normalBalance: "DEBIT",
    parentId: "",
  });

  const [subTypes, setSubTypes] = useState<CoaSubTypeOption[]>([]);

  const reload = async () => {
    setLoading(true);
    const data = await listChartOfAccounts();
    setItems(data);
    setLoading(false);
  };

  useEffect(() => {
    reload();
    listCoaSubTypes().then(setSubTypes);
  }, []);

  const openNew = () => {
    setEditing(null);
    setForm({
      code: "",
      name: "",
      description: "",
      accountType: "EXPENSE",
      plSection: DEFAULT_PL_SECTION_BY_ACCOUNT_TYPE.EXPENSE,
      accountSubType: "",
      normalBalance: "DEBIT",
      parentId: "",
    });
    setOpen(true);
  };

  const openEdit = (a: ChartOfAccount) => {
    setEditing(a);
    setForm({
      code: a.code,
      name: a.name,
      description: a.description ?? "",
      accountType: a.accountType,
      plSection: a.plSection,
      accountSubType: a.accountSubType ?? "",
      normalBalance: a.normalBalance,
      parentId: a.parentId ?? "",
    });
    setOpen(true);
  };

  const submit = () =>
    startTransition(async () => {
      const result = editing
        ? await updateChartOfAccount(editing.id, form)
        : await createChartOfAccount(form);
      toast({
        variant: result.responseType === "success" ? "success" : "destructive",
        title: result.responseType === "success" ? "Saved" : "Error",
        description: result.message,
      });
      if (result.responseType === "success") {
        setOpen(false);
        await reload();
      }
    });

  const onDelete = (a: ChartOfAccount) =>
    startTransition(async () => {
      if (a.systemAccount) {
        toast({
          variant: "destructive",
          title: "Cannot delete",
          description: "System accounts are protected.",
        });
        return;
      }
      const result = await deleteChartOfAccount(a.id);
      toast({
        variant: result.responseType === "success" ? "success" : "destructive",
        title: result.responseType === "success" ? "Deleted" : "Error",
        description: result.message,
      });
      if (result.responseType === "success") await reload();
    });

  const onToggle = (a: ChartOfAccount) =>
    startTransition(async () => {
      const result = await toggleChartOfAccountActive(a.id);
      toast({
        variant: result.responseType === "success" ? "success" : "destructive",
        title: result.responseType === "success" ? "Updated" : "Error",
        description: result.message,
      });
      if (result.responseType === "success") await reload();
    });

  // Candidate parents, by the rule that applies to this account's class:
  // a P&L sub-line must sit in the same section as its parent, while a
  // balance-sheet account (which has no section at all) is constrained to
  // its own type family. Either way an account can't be its own parent.
  // Hide the bad rows rather than let the picker offer a choice the
  // backend (PARENT_SECTION_MISMATCH / "An account cannot be its own
  // parent") would reject anyway — or, for the balance sheet, would
  // silently accept as a nonsense tree.
  //
  // The filtering lives here rather than in the selector's `accountTypes`
  // prop because that prop only takes effect on the selector's initial
  // fetch (its effect is guarded on `accounts.length === 0`), so it would
  // go stale the moment the account type changed in this form.
  // Sub-types valid for the type being edited, plus — critically — whatever
  // this account already carries, even if it is not in the catalogue. A
  // value typed before this field became a picker (or seeded under a type
  // since changed) must stay selectable: the update path writes sub-type
  // from the form on every save and republishes it, so dropping it from the
  // list would silently rewrite the account's sub-type downstream the next
  // time someone opened the dialog and pressed Save.
  const subTypeChoices = (() => {
    const forType = subTypes.filter((s) => s.accountType === form.accountType);
    const current = form.accountSubType;
    if (!current || forType.some((s) => s.code === current)) return forType;
    return [
      ...forType,
      { code: current, label: `${current} (current)`, accountType: form.accountType },
    ];
  })();

  const parentTypes = BALANCE_SHEET_PARENT_TYPES[form.accountType];
  const parentExcludeIds = items
    .filter(
      (a) =>
        a.id === editing?.id ||
        (parentTypes
          ? !parentTypes.includes(a.accountType)
          : a.plSection !== form.plSection),
    )
    .map((a) => a.id);

  return (
    <SettingsSection
      title="Chart of accounts"
      description="The general-ledger account structure for this location."
      footer={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={openNew}>
              <Plus className="h-3.5 w-3.5 mr-1.5" /> Add account
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editing ? `Edit ${editing.code}` : "New account"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Code</Label>
                  <Input
                    value={form.code}
                    onChange={(e) =>
                      setForm({ ...form, code: e.target.value })
                    }
                    placeholder="1100"
                    maxLength={20}
                  />
                </div>
                <div>
                  <Label>Type</Label>
                  <Select
                    value={form.accountType}
                    onValueChange={(v) => {
                      const nextType = v as AccountType;
                      setForm({
                        ...form,
                        accountType: nextType,
                        normalBalance: NORMAL_BALANCE_BY_TYPE[nextType],
                        // A section, parent or sub-type picked for the
                        // previous account type is almost never valid for
                        // the new one — stale values here get silently
                        // submitted and rejected by the backend, so reset
                        // all three. Sub-type in particular is validated
                        // as a (code, account type) pair server-side, so
                        // carrying one across a type change is a
                        // guaranteed INVALID_ACCOUNT_SUB_TYPE. The default
                        // section is type-specific (see
                        // DEFAULT_PL_SECTION_BY_ACCOUNT_TYPE), not just
                        // "whichever section sorts first" — expenses must
                        // default to Operating Expenses, not Cost of Sales.
                        plSection: DEFAULT_PL_SECTION_BY_ACCOUNT_TYPE[nextType],
                        parentId: "",
                        accountSubType: "",
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(ACCOUNT_TYPE_LABELS) as AccountType[]).map(
                        (t) => (
                          <SelectItem key={t} value={t}>
                            {ACCOUNT_TYPE_LABELS[t]}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {PL_SECTIONS_BY_ACCOUNT_TYPE[form.accountType].length > 0 && (
                <div>
                  <Label>P&L section</Label>
                  <Select
                    value={form.plSection ?? undefined}
                    onValueChange={(v) =>
                      setForm({
                        ...form,
                        plSection: v as PlSection,
                        // The parent picker below is filtered by section —
                        // a parent chosen under the old section is very
                        // likely no longer a legal (or even visible) choice.
                        parentId: "",
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a section" />
                    </SelectTrigger>
                    <SelectContent>
                      {PL_SECTIONS_BY_ACCOUNT_TYPE[form.accountType].map(
                        (s) => (
                          <SelectItem key={s} value={s}>
                            {PL_SECTION_LABELS[s]}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {(form.plSection || parentTypes) && (
                <div>
                  <Label>Reports under</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={form.parentId === "" ? "default" : "outline"}
                      onClick={() => setForm({ ...form, parentId: "" })}
                    >
                      Its own line
                    </Button>
                    <div className="min-w-0 flex-1">
                      <ChartOfAccountSelector
                        value={form.parentId || undefined}
                        onChange={(id) =>
                          setForm({ ...form, parentId: id })
                        }
                        excludeIds={parentExcludeIds}
                        placeholder="Choose a parent account"
                      />
                    </div>
                  </div>
                  {/* One wording for both classes: the candidate list is
                      filtered to exactly what will nest — same section for
                      a P&L account, same type for a balance-sheet one — so
                      anything offered here does roll up. */}
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Pick a parent to report this account as a sub-line
                    rolled into that account&apos;s total, or leave it as
                    its own line.
                  </p>
                </div>
              )}
              <div>
                <Label>Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={form.description ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  rows={2}
                />
              </div>
              <div>
                <Label>Sub-type (optional)</Label>
                {subTypes.length === 0 ? (
                  // Catalogue unavailable — the accounting service predates
                  // /sub-types, or the call failed. Deliberately read-only
                  // rather than free text: the server validates sub-type
                  // against the same catalogue, so anything typed here would
                  // come back INVALID_ACCOUNT_SUB_TYPE on save. A disabled
                  // field is a visibly unavailable control instead of a
                  // save-time error with no obvious cause.
                  //
                  // The account's existing value still round-trips untouched
                  // — it stays in form state and submits unchanged, which the
                  // server grandfathers.
                  <Input
                    value={form.accountSubType || ""}
                    placeholder="None"
                    disabled
                    readOnly
                  />
                ) : (
                  <Select
                    value={form.accountSubType || NO_SUB_TYPE}
                    onValueChange={(v) =>
                      setForm({
                        ...form,
                        accountSubType: v === NO_SUB_TYPE ? "" : v,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_SUB_TYPE}>None</SelectItem>
                      {subTypeChoices.map((s) => (
                        <SelectItem key={s.code} value={s.code}>
                          {s.label} · {s.code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {subTypes.length === 0
                    ? "Sub-type options are unavailable right now, so this field can't be changed. Any existing value is kept as it is."
                    : "Groups this account for analytics. Reporting matches these codes exactly, so pick one rather than inventing a label."}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => setOpen(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button onClick={submit} disabled={isPending}>
                {isPending && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
                {editing ? "Save" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      }
    >
      <div className="space-y-3">
        <OpeningBalanceSection accounts={items} />
        <Card className="border-line">
        <CardContent className="px-0 py-0">
          {loading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Loading…
            </div>
          ) : items.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No accounts defined yet.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50/60 text-left text-xs font-semibold uppercase text-gray-400">
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {items.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-mono text-xs">{a.code}</td>
                    <td className="px-4 py-3">
                      {a.name}
                      {a.systemAccount && (
                        <span className="ml-2 inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
                          System
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {ACCOUNT_TYPE_LABELS[a.accountType]}
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={isPending}
                        onClick={() => onToggle(a)}
                      >
                        {a.active ? "Active" : "Inactive"}
                      </Button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEdit(a)}
                      >
                        Edit
                      </Button>
                      {!a.systemAccount && (
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={isPending}
                          onClick={() => onDelete(a)}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-red-500" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
      </div>
    </SettingsSection>
  );
}
