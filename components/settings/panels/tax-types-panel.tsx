"use client";

import { useState, useTransition } from "react";
import { Loader2, Plus, Star, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

import { SettingsSection } from "../shared/settings-section";
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
      if (t.systemSeeded) {
        toast({
          variant: "destructive",
          title: "Cannot delete",
          description: "System-seeded tax types are protected.",
        });
        return;
      }
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
              <Plus className="h-3.5 w-3.5 mr-1.5" /> Add tax type
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editing ? `Edit ${editing.name}` : "New tax type"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Code</Label>
                <Input
                  value={form.code}
                  onChange={(e) =>
                    setForm({ ...form, code: e.target.value.toUpperCase() })
                  }
                  maxLength={10}
                  placeholder="A"
                />
              </div>
              <div>
                <Label>Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Standard Rate (VAT 18%)"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Rate (%)</Label>
                  <Input
                    type="number"
                    step="0.0001"
                    value={form.ratePercent}
                    onChange={(e) =>
                      setForm({ ...form, ratePercent: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Sort order</Label>
                  <Input
                    type="number"
                    value={form.sortOrder}
                    onChange={(e) =>
                      setForm({ ...form, sortOrder: e.target.value })
                    }
                  />
                </div>
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
      <Card className="border-line">
        <CardContent className="px-0 py-0">
          {loading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Loading…
            </div>
          ) : items.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No tax types defined yet.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50/60 text-left text-xs font-semibold uppercase text-gray-400">
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3 text-right">Rate</th>
                  <th className="px-4 py-3">Default</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {items.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-mono text-xs">{t.code}</td>
                    <td className="px-4 py-3">
                      {t.name}
                      {t.systemSeeded && (
                        <span className="ml-2 inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
                          System
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums">
                      {t.ratePercent.toFixed(2)}%
                    </td>
                    <td className="px-4 py-3">
                      {t.isDefault ? (
                        <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
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
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEdit(t)}
                      >
                        Edit
                      </Button>
                      {!t.systemSeeded && (
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={isPending}
                          onClick={() => onDelete(t)}
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
    </SettingsSection>
  );
}
