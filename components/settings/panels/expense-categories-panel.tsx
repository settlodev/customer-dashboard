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
import { useToast } from "@/hooks/use-toast";

import { SettingsSection } from "../shared/settings-section";
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

  return (
    <SettingsSection
      title="Expense categories"
      description="Categorize spending. Each category can map to a default GL expense account."
      footer={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={openNew}>
              <Plus className="h-3.5 w-3.5 mr-1.5" /> Add category
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editing ? `Edit ${editing.name}` : "New expense category"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
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
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Code</Label>
                  <Input
                    value={form.code}
                    onChange={(e) =>
                      setForm({ ...form, code: e.target.value })
                    }
                    placeholder="EXP-001"
                  />
                </div>
              </div>
              <div>
                <Label>Default GL account</Label>
                <ChartOfAccountSelector
                  accountType="EXPENSE"
                  value={form.chartOfAccountId}
                  onChange={(v) => setForm({ ...form, chartOfAccountId: v })}
                  placeholder="Optional"
                />
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
              No categories defined yet.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50/60 text-left text-xs font-semibold uppercase text-gray-400">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Default account</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {[...items]
                  .sort((a, b) => a.displayOrder - b.displayOrder)
                  .map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      {c.parentId && <span className="ml-3" />}
                      {c.name}
                      {c.systemSeeded && (
                        <span className="ml-2 inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
                          System
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {c.code ?? "—"}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {c.chartOfAccountId
                        ? c.chartOfAccountId.slice(0, 8) + "…"
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEdit(c)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={isPending}
                        onClick={() => onDelete(c)}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-red-500" />
                      </Button>
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
