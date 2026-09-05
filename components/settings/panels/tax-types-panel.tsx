"use client";

import { useState, useTransition } from "react";
import { Hash, Loader2, Percent, Plus, Star, Tag } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  ControlInput,
  StandaloneField as Field,
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
import {
  createTaxType,
  deleteTaxType,
  setDefaultTaxType,
  updateTaxType,
} from "@/lib/actions/tax-type-actions";
import {
  invalidateTaxTypesCache,
  useCachedTaxTypes,
} from "@/lib/cache/reference-data";
import type { TaxType } from "@/types/tax-type/type";

export function TaxTypesPanel() {
  const { toast } = useToast();
  const { data: itemsData, loading } = useCachedTaxTypes();
  const items: TaxType[] = itemsData ?? [];
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState<TaxType | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    code: "",
    name: "",
    ratePercent: "0",
    sortOrder: "0",
  });

  const openNew = () => {
    setEditing(null);
    setForm({ code: "", name: "", ratePercent: "0", sortOrder: "0" });
    setOpen(true);
  };

  const openEdit = (t: TaxType) => {
    setEditing(t);
    setForm({
      code: t.code,
      name: t.name,
      ratePercent: String(t.ratePercent),
      sortOrder: String(t.sortOrder),
    });
    setOpen(true);
  };

  const submit = () =>
    startTransition(async () => {
      const values = {
        code: form.code,
        name: form.name,
        ratePercent: Number(form.ratePercent),
        sortOrder: Number(form.sortOrder),
      };
      const result = editing
        ? await updateTaxType(editing.id, values)
        : await createTaxType(values);
      toast({
        variant: result.responseType === "success" ? "success" : "destructive",
        title: result.responseType === "success" ? "Saved" : "Error",
        description: result.message,
      });
      if (result.responseType === "success") {
        invalidateTaxTypesCache();
        setOpen(false);
      }
    });

  const onDelete = (t: TaxType) =>
    startTransition(async () => {
      const result = await deleteTaxType(t.id);
      toast({
        variant: result.responseType === "success" ? "success" : "destructive",
        title: result.responseType === "success" ? "Deleted" : "Error",
        description: result.message,
      });
      if (result.responseType === "success") invalidateTaxTypesCache();
    });

  const onSetDefault = (t: TaxType) =>
    startTransition(async () => {
      const result = await setDefaultTaxType(t.id);
      toast({
        variant: result.responseType === "success" ? "success" : "destructive",
        title: result.responseType === "success" ? "Default updated" : "Error",
        description: result.message,
      });
      if (result.responseType === "success") invalidateTaxTypesCache();
    });

  return (
    <SettingsSection
      title="Tax types"
      description="VAT classes and other tax rates applied to products and expenses."
      footer={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={openNew}>
              <Plus className="h-3.5 w-3.5" /> Add tax type
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editing ? `Edit ${editing.name}` : "New tax type"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3.5">
              <div className="grid grid-cols-1 gap-x-4 gap-y-3.5 sm:grid-cols-3">
                <Field label="Code" hint="Short identifier, e.g. A." required>
                  {(id) => (
                    <ControlInput
                      id={id}
                      mono
                      maxLength={10}
                      prefix={<Tag className="h-3.5 w-3.5" />}
                      value={form.code}
                      onChange={(e) =>
                        setForm({ ...form, code: e.target.value.toUpperCase() })
                      }
                      placeholder="A"
                    />
                  )}
                </Field>
                <Field label="Name" required className="sm:col-span-2">
                  {(id) => (
                    <ControlInput
                      id={id}
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Standard Rate (VAT 18%)"
                    />
                  )}
                </Field>
                <Field label="Rate" className="sm:col-span-2">
                  {(id) => (
                    <ControlInput
                      id={id}
                      type="number"
                      inputMode="decimal"
                      mono
                      step="0.0001"
                      suffix="%"
                      prefix={<Percent className="h-3.5 w-3.5" />}
                      value={form.ratePercent}
                      onChange={(e) =>
                        setForm({ ...form, ratePercent: e.target.value })
                      }
                    />
                  )}
                </Field>
                <Field label="Sort order" hint="Lower shows first.">
                  {(id) => (
                    <ControlInput
                      id={id}
                      type="number"
                      inputMode="numeric"
                      mono
                      prefix={<Hash className="h-3.5 w-3.5" />}
                      value={form.sortOrder}
                      onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
                    />
                  )}
                </Field>
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
              <Button onClick={submit} disabled={isPending || !form.code.trim() || !form.name.trim()}>
                {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {editing ? "Save changes" : "Create tax type"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      }
    >
      <SettingsTableCard
        loading={loading}
        isEmpty={items.length === 0}
        emptyLabel="No tax types defined yet."
      >
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className={tableHeadRowClass}>
              <th className={thClass}>Code</th>
              <th className={thClass}>Name</th>
              <th className={`${thClass} text-right`}>Rate</th>
              <th className={thClass}>Default</th>
              <th className={`${thClass} text-right`}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((t) => (
              <tr key={t.id} className={trClass}>
                <td className={`${tdClass} font-mono text-[12px]`}>{t.code}</td>
                <td className={tdClass}>
                  {t.name}
                  {t.systemSeeded && <RowTag>System</RowTag>}
                </td>
                <td className={`${tdClass} text-right font-mono tabular-nums`}>
                  {t.ratePercent.toFixed(2)}%
                </td>
                <td className={tdClass}>
                  {t.isDefault ? (
                    <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-ink-2">
                      <Star className="h-3.5 w-3.5 fill-warn text-warn" />
                      Default
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={isPending}
                      onClick={() => onSetDefault(t)}
                    >
                      Set default
                    </Button>
                  )}
                </td>
                <td className={tdActionsClass}>
                  <div className="inline-flex items-center gap-1">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(t)}>
                      Edit
                    </Button>
                    {!t.systemSeeded && (
                      <ConfirmDeleteButton
                        disabled={isPending}
                        onConfirm={() => onDelete(t)}
                        title={`Delete ${t.name}?`}
                        description="Products and expenses already using this tax type keep their recorded rate, but it can no longer be selected."
                      />
                    )}
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
