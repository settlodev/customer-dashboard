"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Plus, Trash2, Save, Settings2, Archive, ArchiveRestore } from "lucide-react";
import { NumericFormat } from "react-number-format";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import styles from "./styles/form-shell.module.css";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useToast } from "@/hooks/use-toast";
import type { ModifierGroup } from "@/types/product/type";
import { SELECTION_TYPE_OPTIONS } from "@/types/catalogue/enums";

import {
  listModifierGroups,
  createModifierGroup,
  updateModifierGroup,
  deleteModifierGroup,
  archiveModifierGroup,
  unarchiveModifierGroup,
  createModifierOption,
  updateModifierOption,
  deleteModifierOption,
} from "@/lib/actions/modifier-actions";

export interface StockVariantOption {
  id: string;
  label: string;
}

interface Props {
  initialGroups: ModifierGroup[];
  stockVariants: StockVariantOption[];
}

export default function ModifierGroupsManager({
  initialGroups,
  stockVariants,
}: Props) {
  const [groups, setGroups] = useState<ModifierGroup[]>(initialGroups);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const { toast } = useToast();

  const refresh = useCallback(async () => {
    const fresh = await listModifierGroups();
    setGroups(fresh);
  }, []);

  const handleCreate = async (name: string) => {
    setBusy(true);
    try {
      const result = await createModifierGroup({
        name,
        selectionType: "SINGLE",
        minSelections: 0,
        maxSelections: 1,
        sortOrder: groups.length,
        active: true,
        options: [],
      });
      if ("responseType" in result && result.responseType === "error") {
        toast({ variant: "destructive", title: "Error", description: result.message });
      } else {
        toast({ title: "Group created" });
        await refresh();
        setCreating(false);
      }
    } finally {
      setBusy(false);
    }
  };

  const visible = groups.filter((g) =>
    showArchived ? g.archivedAt != null : g.archivedAt == null,
  );

  return (
    <div className={styles.formRoot}>
      <div className={styles.formStack}>
        <section className={styles.formCard}>
          <header className={styles.formCardHead}>
            <div className={styles.icoBox}>
              <Settings2 className="h-3.5 w-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3>Modifier groups</h3>
              <p className={styles.formCardHeadDesc}>
                Reusable groups of customer-facing tweaks (milk type, spice
                level). Attach a group to any number of products.
              </p>
            </div>
            <div className={styles.formCardActions}>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowArchived((v) => !v)}
                disabled={busy}
              >
                {showArchived ? "Show active" : "Show archived"}
              </Button>
              {!creating && !showArchived && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCreating(true)}
                  disabled={busy}
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> New group
                </Button>
              )}
            </div>
          </header>

          <div className={styles.formBody}>
            <div className="space-y-4">
              {creating && (
                <InlineNameForm
                  placeholder="e.g. Milk type, Spice level"
                  onSubmit={handleCreate}
                  onCancel={() => setCreating(false)}
                  disabled={busy}
                />
              )}

              {visible.map((g) => (
                <GroupEditor
                  key={g.id}
                  group={g}
                  stockVariants={stockVariants}
                  onChanged={refresh}
                />
              ))}

              {visible.length === 0 && !creating && (
                <p className="text-sm text-muted-foreground text-center py-3">
                  {showArchived
                    ? "No archived groups."
                    : "No modifier groups yet."}
                </p>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Group editor (inline name + meta + options list)
// ─────────────────────────────────────────────────────────────────────

function GroupEditor({
  group,
  stockVariants,
  onChanged,
}: {
  group: ModifierGroup;
  stockVariants: StockVariantOption[];
  onChanged: () => Promise<void>;
}) {
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);

  const [name, setName] = useState(group.name);
  const [selectionType, setSelectionType] = useState(group.selectionType);
  const [minSel, setMinSel] = useState(group.minSelections);
  const [maxSel, setMaxSel] = useState(group.maxSelections);
  const [active, setActive] = useState(group.active);

  useEffect(() => {
    setName(group.name);
    setSelectionType(group.selectionType);
    setMinSel(group.minSelections);
    setMaxSel(group.maxSelections);
    setActive(group.active);
  }, [group]);

  const isArchived = group.archivedAt != null;

  const save = async () => {
    setBusy(true);
    try {
      const result = await updateModifierGroup(group.id, {
        name,
        selectionType,
        minSelections: minSel,
        maxSelections: maxSel,
        sortOrder: group.sortOrder,
        active,
        options: [],
      });
      if ("responseType" in result && result.responseType === "error") {
        toast({ variant: "destructive", title: "Error", description: result.message });
      } else {
        toast({ title: "Saved" });
        setEditing(false);
        await onChanged();
      }
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!confirm(`Delete modifier group "${group.name}"? This will detach it from every product that uses it.`)) return;
    setBusy(true);
    try {
      await deleteModifierGroup(group.id);
      toast({ title: "Deleted" });
      await onChanged();
    } finally {
      setBusy(false);
    }
  };

  const archive = async () => {
    setBusy(true);
    try {
      await archiveModifierGroup(group.id);
      toast({ title: "Archived" });
      await onChanged();
    } finally {
      setBusy(false);
    }
  };

  const unarchive = async () => {
    setBusy(true);
    try {
      await unarchiveModifierGroup(group.id);
      toast({ title: "Unarchived" });
      await onChanged();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-lg border p-4 space-y-3 bg-gray-50/50 dark:bg-gray-900/30">
      <div className="flex items-center justify-between gap-2">
        {editing ? (
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={busy}
            className="max-w-sm"
          />
        ) : (
          <div>
            <div className="font-medium text-sm flex items-center gap-2">
              {group.name}
              {isArchived && <Badge variant="outline" className="text-xs">archived</Badge>}
            </div>
            <div className="text-xs text-muted-foreground">
              {group.selectionType === "SINGLE" ? "Single" : "Multi"} ·{" "}
              {group.minSelections}–{group.maxSelections}
              {!group.active && " · inactive"}
            </div>
          </div>
        )}
        <div className="flex items-center gap-1">
          {editing ? (
            <>
              <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)} disabled={busy}>
                Cancel
              </Button>
              <Button type="button" size="sm" onClick={save} disabled={busy || !name.trim()}>
                <Save className="h-3.5 w-3.5 mr-1" /> Save
              </Button>
            </>
          ) : (
            <>
              {!isArchived && (
                <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(true)} disabled={busy}>
                  Edit
                </Button>
              )}
              {isArchived ? (
                <Button type="button" variant="ghost" size="sm" onClick={unarchive} disabled={busy}>
                  <ArchiveRestore className="h-3.5 w-3.5 mr-1" /> Unarchive
                </Button>
              ) : (
                <Button type="button" variant="ghost" size="sm" onClick={archive} disabled={busy}>
                  <Archive className="h-3.5 w-3.5" />
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={remove}
                disabled={busy}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
        </div>
      </div>

      {editing && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="text-xs text-muted-foreground">Selection</label>
            <Select
              value={selectionType}
              onValueChange={(v) => setSelectionType(v as "SINGLE" | "MULTI")}
              disabled={busy}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SELECTION_TYPE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Min</label>
            <Input
              type="number"
              min={0}
              value={minSel}
              onChange={(e) => setMinSel(Number(e.target.value))}
              className="mt-1"
              disabled={busy}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Max</label>
            <Input
              type="number"
              min={1}
              value={maxSel}
              onChange={(e) => setMaxSel(Number(e.target.value))}
              className="mt-1"
              disabled={busy}
            />
          </div>
          <div className="flex items-center gap-2 mt-6">
            <Switch checked={active} onCheckedChange={setActive} disabled={busy} />
            <span className="text-sm">Active</span>
          </div>
        </div>
      )}

      <Separator />

      <OptionsList
        groupId={group.id}
        options={group.options}
        stockVariants={stockVariants}
        disabled={isArchived}
        onChanged={onChanged}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Options list (add / remove / edit options inline)
// ─────────────────────────────────────────────────────────────────────

function OptionsList({
  groupId,
  options,
  stockVariants,
  disabled,
  onChanged,
}: {
  groupId: string;
  options: ModifierGroup["options"];
  stockVariants: StockVariantOption[];
  disabled: boolean;
  onChanged: () => Promise<void>;
}) {
  const { toast } = useToast();
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const blank = () => ({
    name: "",
    priceAdjustment: 0,
    isDefault: false,
    stockVariantId: "" as string,
    stockQuantity: undefined as number | undefined,
    sortOrder: options.length,
    active: true,
  });
  const [draft, setDraft] = useState(blank());

  const add = async () => {
    if (!draft.name.trim()) return;
    setBusy(true);
    try {
      const result = await createModifierOption(groupId, {
        name: draft.name,
        priceAdjustment: draft.priceAdjustment,
        isDefault: draft.isDefault,
        stockVariantId: draft.stockVariantId || undefined,
        stockQuantity: draft.stockQuantity,
        sortOrder: draft.sortOrder,
        active: draft.active,
      });
      if ("responseType" in result && result.responseType === "error") {
        toast({ variant: "destructive", title: "Error", description: result.message });
      } else {
        toast({ title: "Option added" });
        setDraft(blank());
        setAdding(false);
        await onChanged();
      }
    } finally {
      setBusy(false);
    }
  };

  const remove = async (optionId: string, name: string) => {
    if (!confirm(`Delete option "${name}"?`)) return;
    setBusy(true);
    try {
      await deleteModifierOption(groupId, optionId);
      toast({ title: "Option deleted" });
      await onChanged();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Options ({options.length})
        </div>
        {!adding && !disabled && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setAdding(true)}
            disabled={busy}
            className="text-xs h-7"
          >
            <Plus className="h-3 w-3 mr-1" /> Add option
          </Button>
        )}
      </div>

      {options.length === 0 && !adding && (
        <p className="text-xs text-muted-foreground text-center py-2">No options yet.</p>
      )}

      {options.map((o) => (
        editingId === o.id ? (
          <OptionEditRow
            key={o.id}
            groupId={groupId}
            option={o}
            stockVariants={stockVariants}
            onCancel={() => setEditingId(null)}
            onSaved={async () => {
              setEditingId(null);
              await onChanged();
            }}
          />
        ) : (
          <div
            key={o.id}
            className="flex items-center justify-between rounded-md bg-background p-2 px-3 text-sm"
          >
            <div>
              <div className="font-medium flex items-center gap-2">
                {o.name}
                {o.isDefault && <Badge variant="secondary" className="text-xs">default</Badge>}
                {!o.active && <Badge variant="outline" className="text-xs">inactive</Badge>}
              </div>
              <div className="text-xs text-muted-foreground">
                {o.priceAdjustment > 0 && `+${o.priceAdjustment} `}
                {o.priceAdjustment < 0 && `${o.priceAdjustment} `}
                {o.stockVariantName && `· deducts ${o.stockQuantity ?? "?"} ${o.stockVariantName}`}
              </div>
            </div>
            <div className="flex items-center gap-1">
              {!disabled && (
                <Button type="button" variant="ghost" size="sm" onClick={() => setEditingId(o.id)} disabled={busy}>
                  Edit
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => remove(o.id, o.name)}
                disabled={busy || disabled}
                className="text-red-600 hover:text-red-700 h-7 w-7 p-0"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )
      ))}

      {adding && (
        <div className="rounded-md border p-3 space-y-3 bg-background">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">Name</label>
              <Input
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder="e.g. Oat Milk"
                className="mt-1"
                disabled={busy}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Price adjustment</label>
              <NumericFormat
                customInput={Input}
                value={draft.priceAdjustment}
                onValueChange={(v) => setDraft({ ...draft, priceAdjustment: v.floatValue ?? 0 })}
                decimalScale={4}
                thousandSeparator=","
                className="mt-1"
                disabled={busy}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">Stock item (optional)</label>
              <Select
                value={draft.stockVariantId || "__none__"}
                onValueChange={(v) =>
                  setDraft({ ...draft, stockVariantId: v === "__none__" ? "" : v })
                }
                disabled={busy}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="No deduction" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">No deduction</SelectItem>
                  {stockVariants.map((sv) => (
                    <SelectItem key={sv.id} value={sv.id}>{sv.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Stock qty per selection</label>
              <NumericFormat
                customInput={Input}
                value={draft.stockQuantity ?? ""}
                onValueChange={(v) => setDraft({ ...draft, stockQuantity: v.floatValue })}
                decimalScale={6}
                allowNegative={false}
                placeholder="e.g. 250"
                className="mt-1"
                disabled={busy || !draft.stockVariantId}
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <Switch
                checked={draft.isDefault}
                onCheckedChange={(v) => setDraft({ ...draft, isDefault: v })}
                disabled={busy}
              />
              Default selection
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Switch
                checked={draft.active}
                onCheckedChange={(v) => setDraft({ ...draft, active: v })}
                disabled={busy}
              />
              Active
            </label>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => { setDraft(blank()); setAdding(false); }}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button type="button" size="sm" onClick={add} disabled={busy || !draft.name.trim()}>
              <Save className="h-3.5 w-3.5 mr-1" /> Add option
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function OptionEditRow({
  groupId,
  option,
  stockVariants,
  onCancel,
  onSaved,
}: {
  groupId: string;
  option: ModifierGroup["options"][number];
  stockVariants: StockVariantOption[];
  onCancel: () => void;
  onSaved: () => Promise<void>;
}) {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState({
    name: option.name,
    priceAdjustment: option.priceAdjustment,
    isDefault: option.isDefault,
    stockVariantId: option.stockVariantId ?? "",
    stockQuantity: option.stockQuantity ?? undefined,
    sortOrder: option.sortOrder,
    active: option.active,
  });

  const save = async () => {
    setBusy(true);
    try {
      const result = await updateModifierOption(groupId, option.id, {
        name: draft.name,
        priceAdjustment: draft.priceAdjustment,
        isDefault: draft.isDefault,
        stockVariantId: draft.stockVariantId || undefined,
        stockQuantity: draft.stockQuantity,
        sortOrder: draft.sortOrder,
        active: draft.active,
      });
      if ("responseType" in result && result.responseType === "error") {
        toast({ variant: "destructive", title: "Error", description: result.message });
      } else {
        toast({ title: "Option saved" });
        await onSaved();
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-md border p-3 space-y-3 bg-background">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground">Name</label>
          <Input
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            className="mt-1"
            disabled={busy}
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Price adjustment</label>
          <NumericFormat
            customInput={Input}
            value={draft.priceAdjustment}
            onValueChange={(v) => setDraft({ ...draft, priceAdjustment: v.floatValue ?? 0 })}
            decimalScale={4}
            thousandSeparator=","
            className="mt-1"
            disabled={busy}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground">Stock item (optional)</label>
          <Select
            value={draft.stockVariantId || "__none__"}
            onValueChange={(v) =>
              setDraft({ ...draft, stockVariantId: v === "__none__" ? "" : v })
            }
            disabled={busy}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="No deduction" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">No deduction</SelectItem>
              {stockVariants.map((sv) => (
                <SelectItem key={sv.id} value={sv.id}>{sv.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Stock qty per selection</label>
          <NumericFormat
            customInput={Input}
            value={draft.stockQuantity ?? ""}
            onValueChange={(v) => setDraft({ ...draft, stockQuantity: v.floatValue })}
            decimalScale={6}
            allowNegative={false}
            className="mt-1"
            disabled={busy || !draft.stockVariantId}
          />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm">
          <Switch
            checked={draft.isDefault}
            onCheckedChange={(v) => setDraft({ ...draft, isDefault: v })}
            disabled={busy}
          />
          Default selection
        </label>
        <label className="flex items-center gap-2 text-sm">
          <Switch
            checked={draft.active}
            onCheckedChange={(v) => setDraft({ ...draft, active: v })}
            disabled={busy}
          />
          Active
        </label>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
        <Button type="button" size="sm" onClick={save} disabled={busy || !draft.name.trim()}>
          <Save className="h-3.5 w-3.5 mr-1" /> Save
        </Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Reusable inline-name form (create new group)
// ─────────────────────────────────────────────────────────────────────

function InlineNameForm({
  placeholder,
  onSubmit,
  onCancel,
  disabled,
}: {
  placeholder: string;
  onSubmit: (name: string) => Promise<void>;
  onCancel: () => void;
  disabled: boolean;
}) {
  const [name, setName] = useState("");
  return (
    <div className="flex items-center gap-2">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="max-w-sm"
        autoFocus
      />
      <Button
        type="button"
        size="sm"
        onClick={() => onSubmit(name)}
        disabled={disabled || !name.trim()}
      >
        <Save className="h-3.5 w-3.5 mr-1" /> Create
      </Button>
      <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={disabled}>
        Cancel
      </Button>
    </div>
  );
}
