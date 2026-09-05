"use client";

import { useEffect, useState, useTransition } from "react";
import {
  Hash,
  Landmark,
  Loader2,
  Plus,
  RefreshCw,
  Tag,
  Tags,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  ControlInput,
  ControlTextarea,
  FieldHint,
  StandaloneField as Field,
  standaloneLabelClass,
} from "@/components/ui/field";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

import { SettingsSection } from "../shared/settings-section";
import {
  RowTag,
  SettingsTableCard,
  tableHeadRowClass,
  tdActionsClass,
  tdClass,
  thClass,
  trClass,
} from "../shared/settings-table";
import { ConfirmDeleteButton } from "../shared/confirm-delete-button";
import { ChartOfAccountSelector } from "@/components/widgets/chart-of-account-selector";
import {
  createExpenseCategory,
  deleteExpenseCategory,
  fetchExpenseCategories,
  updateExpenseCategory,
} from "@/lib/actions/expense-categories-actions";
import type { ExpenseCategory } from "@/types/expense-category/type";

export function ExpenseCategoriesPanel() {
  const { toast } = useToast();
  const [items, setItems] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState<ExpenseCategory | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    code: "",
    parentId: "",
    chartOfAccountId: "",
  });

  const reload = async () => {
    setLoading(true);
    const data = await fetchExpenseCategories();
    setItems(data);
    setLoading(false);
  };

  useEffect(() => {
    reload();
  }, []);

  const openNew = () => {
    setEditing(null);
    setForm({
      name: "",
      description: "",
      code: "",
      parentId: "",
      chartOfAccountId: "",
    });
    setOpen(true);
  };

  const openEdit = (c: ExpenseCategory) => {
    setEditing(c);
    setForm({
      name: c.name,
      description: c.description ?? "",
      code: c.code ?? "",
      parentId: c.parentId ?? "",
      chartOfAccountId: c.chartOfAccountId ?? "",
    });
    setOpen(true);
  };

  const submit = () =>
    startTransition(async () => {
      const result = editing
        ? await updateExpenseCategory(editing.id, form)
        : await createExpenseCategory(form);
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

  const onDelete = (c: ExpenseCategory) =>
    startTransition(async () => {
      const result = await deleteExpenseCategory(c.id);
      toast({
        variant: result.responseType === "success" ? "success" : "destructive",
        title: result.responseType === "success" ? "Deleted" : "Error",
        description: result.message,
      });
      if (result.responseType === "success") await reload();
    });

  // The API returns creation order; displayOrder is the merchant's own ranking.
  const sorted = [...items].sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <SettingsSection
      title="Expense categories"
      description="Categorize spending. Each category can map to a default GL expense account."
      icon={<Tags className="h-4 w-4" />}
      footer={
        <div className="flex flex-wrap items-center gap-2">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={openNew}>
                <Plus className="h-3.5 w-3.5" /> Add category
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editing ? `Edit ${editing.name}` : "New expense category"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3.5">
                <div className="grid grid-cols-1 gap-x-4 gap-y-3.5 sm:grid-cols-3">
                  <Field label="Name" required className="sm:col-span-2">
                    {(id) => (
                      <ControlInput
                        id={id}
                        maxLength={100}
                        prefix={<Tag className="h-3.5 w-3.5" />}
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="Utilities"
                      />
                    )}
                  </Field>
                  <Field label="Code" hint="Your own reference." optional>
                    {(id) => (
                      <ControlInput
                        id={id}
                        mono
                        maxLength={20}
                        prefix={<Hash className="h-3.5 w-3.5" />}
                        value={form.code}
                        onChange={(e) => setForm({ ...form, code: e.target.value })}
                        placeholder="EXP-001"
                      />
                    )}
                  </Field>
                  <Field
                    label="Description"
                    hint="Shown to staff when they pick a category."
                    optional
                    className="sm:col-span-3"
                  >
                    {(id) => (
                      <ControlTextarea
                        id={id}
                        value={form.description}
                        onChange={(e) =>
                          setForm({ ...form, description: e.target.value })
                        }
                        rows={2}
                        maxLength={500}
                        placeholder="Electricity, water and internet bills"
                      />
                    )}
                  </Field>
                  {/* The account picker is its own combobox trigger, so it gets a
                      bare label instead of a Field render-prop id. */}
                  <div className="min-w-0 space-y-[7px] sm:col-span-3">
                    <span className={standaloneLabelClass}>
                      <Landmark className="h-3.5 w-3.5 text-muted-2" />
                      Default GL account
                      <span className="ml-auto font-mono text-[10px] font-medium uppercase tracking-[0.05em] text-muted-foreground">
                        Optional
                      </span>
                    </span>
                    <ChartOfAccountSelector
                      accountType="EXPENSE"
                      value={form.chartOfAccountId}
                      onChange={(v) => setForm({ ...form, chartOfAccountId: v })}
                      placeholder="Optional"
                    />
                    <FieldHint>
                      Expenses filed under this category post here by default.
                    </FieldHint>
                  </div>
                </div>
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
                  disabled={isPending || !form.name.trim()}
                >
                  {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {isPending
                    ? "Saving…"
                    : editing
                      ? "Save changes"
                      : "Create category"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => reload()}
            disabled={loading || isPending}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      }
    >
      <SettingsTableCard
        loading={loading}
        isEmpty={items.length === 0}
        emptyLabel="No categories defined yet."
      >
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className={tableHeadRowClass}>
              <th className={thClass}>Name</th>
              <th className={thClass}>Code</th>
              <th className={thClass}>Default account</th>
              <th className={`${thClass} text-right`}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((c) => (
              <tr key={c.id} className={trClass}>
                <td className={tdClass}>
                  {/* Child categories sit one notch in from their parent. */}
                  {c.parentId && <span className="ml-3" />}
                  {c.name}
                  {c.systemSeeded && <RowTag>System</RowTag>}
                </td>
                <td className={`${tdClass} font-mono text-[12px]`}>
                  {c.code ?? "—"}
                </td>
                <td
                  className={`${tdClass} font-mono text-[12px] text-muted-foreground`}
                >
                  {c.chartOfAccountId
                    ? c.chartOfAccountId.slice(0, 8) + "…"
                    : "—"}
                </td>
                <td className={tdActionsClass}>
                  <div className="inline-flex items-center gap-1">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(c)}>
                      Edit
                    </Button>
                    <ConfirmDeleteButton
                      disabled={isPending}
                      onConfirm={() => onDelete(c)}
                      title={`Delete ${c.name}?`}
                      description="Expenses already filed under this category keep their history, but it can no longer be picked when recording new spending."
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </SettingsTableCard>
    </SettingsSection>
  );
}
