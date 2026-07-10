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
import { listChartOfAccounts } from "@/lib/actions/accounting-mapping-actions";
import {
  createChartOfAccount,
  deleteChartOfAccount,
  toggleChartOfAccountActive,
  updateChartOfAccount,
} from "@/lib/actions/chart-of-account-actions";
import type { ChartOfAccountFormValues } from "@/types/chart-of-account/schema";
import {
  ACCOUNT_TYPE_LABELS,
  type AccountType,
  type ChartOfAccount,
} from "@/types/accounting-mapping/type";

const NORMAL_BALANCE_BY_TYPE: Record<AccountType, "DEBIT" | "CREDIT"> = {
  ASSET: "DEBIT",
  LIABILITY: "CREDIT",
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
    accountSubType: "",
    normalBalance: "DEBIT",
    parentId: "",
  });

  const reload = async () => {
    setLoading(true);
    const data = await listChartOfAccounts();
    setItems(data);
    setLoading(false);
  };

  useEffect(() => {
    reload();
  }, []);

  const openNew = () => {
    setEditing(null);
    setForm({
      code: "",
      name: "",
      description: "",
      accountType: "EXPENSE",
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
                    onValueChange={(v) =>
                      setForm({
                        ...form,
                        accountType: v as AccountType,
                        normalBalance: NORMAL_BALANCE_BY_TYPE[v as AccountType],
                      })
                    }
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
                <Input
                  value={form.accountSubType ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, accountSubType: e.target.value })
                  }
                  maxLength={50}
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
