"use client";

import { useEffect, useState, useTransition } from "react";
import { CornerDownRight, Hash, Landmark, Layers, Loader2, Plus, Tag } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  ControlInput,
  ControlTextarea,
  StandaloneField as Field,
  controlSelectTriggerClass,
} from "@/components/ui/field";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

import { SettingsSection } from "../shared/settings-section";
import { ConfirmDeleteButton } from "../shared/confirm-delete-button";
import {
  RowTag,
  SettingsTableCard,
  tableHeadRowClass,
  tdActionsClass,
  tdClass,
  thClass,
  trClass,
} from "../shared/settings-table";
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

  // Sub-lines are indented under the account they roll into, so the tree the
  // parent picker builds is visible in the flat list the API returns. Purely
  // cosmetic — row order stays exactly as the service sent it.
  const byId = new Map(items.map((a) => [a.id, a] as const));
  const depthOf = (a: ChartOfAccount) => {
    let depth = 0;
    let cursor = a.parentId ? byId.get(a.parentId) : undefined;
    // Bounded walk: a cycle in bad data must not hang the render.
    while (cursor && depth < 4) {
      depth += 1;
      cursor = cursor.parentId ? byId.get(cursor.parentId) : undefined;
    }
    return depth;
  };

  return (
    <SettingsSection
      title="Chart of accounts"
      description="The general-ledger account structure for this location."
      icon={<Landmark className="h-4 w-4" />}
      footer={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={openNew}>
              <Plus className="h-3.5 w-3.5" /> Add account
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editing ? `Edit ${editing.code}` : "New account"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3.5">
              <div className="grid grid-cols-1 gap-x-4 gap-y-3.5 sm:grid-cols-2">
                <Field label="Code" hint="Ledger number, e.g. 1100." required>
                  {(id) => (
                    <ControlInput
                      id={id}
                      mono
                      prefix={<Hash className="h-3.5 w-3.5" />}
                      value={form.code}
                      onChange={(e) =>
                        setForm({ ...form, code: e.target.value })
                      }
                      placeholder="1100"
                      maxLength={20}
                    />
                  )}
                </Field>
                <Field label="Type" required>
                  {(id) => (
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
                      <SelectTrigger id={id} className={controlSelectTriggerClass}>
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
                  )}
                </Field>
              </div>
              {PL_SECTIONS_BY_ACCOUNT_TYPE[form.accountType].length > 0 && (
                <Field label="P&L section">
                  {(id) => (
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
                      <SelectTrigger id={id} className={controlSelectTriggerClass}>
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
                  )}
                </Field>
              )}
              {(form.plSection || parentTypes) && (
                // One wording for both classes: the candidate list is
                // filtered to exactly what will nest — same section for
                // a P&L account, same type for a balance-sheet one — so
                // anything offered here does roll up.
                <Field
                  label="Reports under"
                  hint="Pick a parent to report this account as a sub-line rolled into that account's total, or leave it as its own line."
                >
                  {(id) => (
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <Button
                        id={id}
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
                          onChange={(nextParentId) =>
                            setForm({ ...form, parentId: nextParentId })
                          }
                          excludeIds={parentExcludeIds}
                          placeholder="Choose a parent account"
                        />
                      </div>
                    </div>
                  )}
                </Field>
              )}
              <Field label="Name" required>
                {(id) => (
                  <ControlInput
                    id={id}
                    prefix={<Tag className="h-3.5 w-3.5" />}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Office rent"
                  />
                )}
              </Field>
              <Field label="Description" optional>
                {(id) => (
                  <ControlTextarea
                    id={id}
                    value={form.description ?? ""}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                    rows={2}
                    placeholder="What belongs in this account?"
                  />
                )}
              </Field>
              <Field
                label="Sub-type"
                optional
                hint={
                  subTypes.length === 0
                    ? "Sub-type options are unavailable right now, so this field can't be changed. Any existing value is kept as it is."
                    : "Groups this account for analytics. Reporting matches these codes exactly, so pick one rather than inventing a label."
                }
              >
                {(id) =>
                  subTypes.length === 0 ? (
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
                    <ControlInput
                      id={id}
                      mono
                      prefix={<Layers className="h-3.5 w-3.5" />}
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
                      <SelectTrigger id={id} className={controlSelectTriggerClass}>
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
                  )
                }
              </Field>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={submit}
                disabled={isPending || !form.code.trim() || !form.name.trim()}
              >
                {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {isPending
                  ? "Saving…"
                  : editing
                    ? "Save changes"
                    : "Create account"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      }
    >
      <OpeningBalanceSection accounts={items} />
      <SettingsTableCard
        loading={loading}
        isEmpty={items.length === 0}
        emptyLabel="No accounts defined yet."
      >
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className={tableHeadRowClass}>
              <th className={thClass}>Code</th>
              <th className={thClass}>Name</th>
              <th className={thClass}>Type</th>
              <th className={thClass}>Status</th>
              <th className={`${thClass} text-right`}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((a) => {
              const depth = depthOf(a);
              return (
                <tr key={a.id} className={trClass}>
                  <td className={`${tdClass} font-mono text-[12px]`}>
                    <span
                      className="flex items-center gap-1.5"
                      style={{ paddingLeft: depth * 14 }}
                    >
                      {depth > 0 && (
                        <CornerDownRight className="h-3 w-3 shrink-0 text-ink-3" />
                      )}
                      {a.code}
                    </span>
                  </td>
                  <td className={tdClass}>
                    {a.name}
                    {a.systemAccount && <RowTag>System</RowTag>}
                  </td>
                  <td className={`${tdClass} whitespace-nowrap text-ink-2`}>
                    {ACCOUNT_TYPE_LABELS[a.accountType]}
                  </td>
                  <td className={tdClass}>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={isPending}
                      onClick={() => onToggle(a)}
                      title={
                        a.active
                          ? "Deactivate this account"
                          : "Activate this account"
                      }
                    >
                      <span
                        className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                          a.active ? "bg-pos" : "bg-muted-2"
                        }`}
                      />
                      {a.active ? "Active" : "Inactive"}
                    </Button>
                  </td>
                  <td className={tdActionsClass}>
                    <div className="inline-flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEdit(a)}
                      >
                        Edit
                      </Button>
                      {!a.systemAccount && (
                        <ConfirmDeleteButton
                          disabled={isPending}
                          onConfirm={() => onDelete(a)}
                          title={`Delete ${a.code} · ${a.name}?`}
                          description="Entries already posted to this account keep their history, but it can no longer be picked for new postings, mappings or sub-lines."
                        />
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </SettingsTableCard>
    </SettingsSection>
  );
}
