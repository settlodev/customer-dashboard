"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Plus, Trash2, Save, Tag as TagIcon, Archive, ArchiveRestore } from "lucide-react";
import { NumericFormat } from "react-number-format";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";

import styles from "./styles/form-shell.module.css";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useToast } from "@/hooks/use-toast";
import type { AddonGroup } from "@/types/product/type";

import {
  listAddonGroups,
  createAddonGroup,
  updateAddonGroup,
  deleteAddonGroup,
  archiveAddonGroup,
  unarchiveAddonGroup,
  createAddonGroupItem,
  updateAddonGroupItem,
  deleteAddonGroupItem,
} from "@/lib/actions/addon-actions";

export interface ProductVariantOption {
  id: string;
  label: string;
}

interface Props {
  initialGroups: AddonGroup[];
  productVariants: ProductVariantOption[];
}

export default function AddonGroupsManager({
  initialGroups,
  productVariants,
}: Props) {
  const [groups, setGroups] = useState<AddonGroup[]>(initialGroups);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const { toast } = useToast();

  const refresh = useCallback(async () => {
    const fresh = await listAddonGroups();
    setGroups(fresh);
  }, []);

  const handleCreate = async (name: string) => {
    setBusy(true);
    try {
      const result = await createAddonGroup({
        name,
        minSelections: 0,
        maxSelections: 10,
        sortOrder: groups.length,
        active: true,
        items: [],
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
              <TagIcon className="h-3.5 w-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3>Addon groups</h3>
              <p className={styles.formCardHeadDesc}>
                Reusable groups of optional sides or extras that get added to an
                order. Each item references an existing product variant.
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
                  placeholder="e.g. Extras, Sides"
                  onSubmit={handleCreate}
                  onCancel={() => setCreating(false)}
                  disabled={busy}
                />
              )}

              {visible.map((g) => (
                <GroupEditor
                  key={g.id}
                  group={g}
                  productVariants={productVariants}
                  onChanged={refresh}
                />
              ))}

              {visible.length === 0 && !creating && (
                <p className="text-sm text-muted-foreground text-center py-3">
                  {showArchived
                    ? "No archived groups."
                    : "No addon groups yet."}
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
// Group editor
// ─────────────────────────────────────────────────────────────────────

function GroupEditor({
  group,
  productVariants,
  onChanged,
}: {
  group: AddonGroup;
  productVariants: ProductVariantOption[];
  onChanged: () => Promise<void>;
}) {
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);

  const [name, setName] = useState(group.name);
  const [minSel, setMinSel] = useState(group.minSelections);
  const [maxSel, setMaxSel] = useState(group.maxSelections);
  const [active, setActive] = useState(group.active);

  useEffect(() => {
    setName(group.name);
    setMinSel(group.minSelections);
    setMaxSel(group.maxSelections);
    setActive(group.active);
  }, [group]);

  const isArchived = group.archivedAt != null;

  const save = async () => {
    setBusy(true);
    try {
      const result = await updateAddonGroup(group.id, {
        name,
        minSelections: minSel,
        maxSelections: maxSel,
        sortOrder: group.sortOrder,
        active,
        items: [],
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
    if (!confirm(`Delete addon group "${group.name}"? This will detach it from every product that uses it.`)) return;
    setBusy(true);
    try {
      await deleteAddonGroup(group.id);
      toast({ title: "Deleted" });
      await onChanged();
    } finally {
      setBusy(false);
    }
  };

  const archive = async () => {
    setBusy(true);
    try {
      await archiveAddonGroup(group.id);
      toast({ title: "Archived" });
      await onChanged();
    } finally {
      setBusy(false);
    }
  };

  const unarchive = async () => {
    setBusy(true);
    try {
      await unarchiveAddonGroup(group.id);
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
              {group.minSelections}–{group.maxSelections} addon
              {group.maxSelections !== 1 && "s"}
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

      <ItemsList
        groupId={group.id}
        items={group.items}
        productVariants={productVariants}
        disabled={isArchived}
        onChanged={onChanged}
      />
    </div>
  );
}

function ItemsList({
  groupId,
  items,
  productVariants,
  disabled,
  onChanged,
}: {
  groupId: string;
  items: AddonGroup["items"];
  productVariants: ProductVariantOption[];
  disabled: boolean;
  onChanged: () => Promise<void>;
}) {
  const { toast } = useToast();
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState({
    productVariantId: "",
    priceOverride: undefined as number | undefined,
  });

  const add = async () => {
    if (!draft.productVariantId) return;
    setBusy(true);
    try {
      const result = await createAddonGroupItem(groupId, {
        productVariantId: draft.productVariantId,
        priceOverride: draft.priceOverride,
        sortOrder: items.length,
        active: true,
      });
      if ("responseType" in result && result.responseType === "error") {
        toast({ variant: "destructive", title: "Error", description: result.message });
      } else {
        toast({ title: "Item added" });
        setDraft({ productVariantId: "", priceOverride: undefined });
        setAdding(false);
        await onChanged();
      }
    } finally {
      setBusy(false);
    }
  };

  const remove = async (itemId: string) => {
    setBusy(true);
    try {
      await deleteAddonGroupItem(groupId, itemId);
      await onChanged();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Items ({items.length})
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
            <Plus className="h-3 w-3 mr-1" /> Add item
          </Button>
        )}
      </div>

      {items.length === 0 && !adding && (
        <p className="text-xs text-muted-foreground text-center py-2">No items yet.</p>
      )}

      {items.map((it) => (
        editingId === it.id ? (
          <ItemEditRow
            key={it.id}
            groupId={groupId}
            item={it}
            productVariants={productVariants}
            onCancel={() => setEditingId(null)}
            onSaved={async () => {
              setEditingId(null);
              await onChanged();
            }}
          />
        ) : (
          <div
            key={it.id}
            className="flex items-center justify-between rounded-md bg-background p-2 px-3 text-sm"
          >
            <div>
              <div className="font-medium flex items-center gap-2">
                {it.productVariantDisplayName}
                {!it.active && <Badge variant="outline" className="text-xs">inactive</Badge>}
              </div>
              <div className="text-xs text-muted-foreground">
                {it.priceOverride != null
                  ? `Override price: ${it.priceOverride}`
                  : `Price: ${it.price}`}
              </div>
            </div>
            <div className="flex items-center gap-1">
              {!disabled && (
                <Button type="button" variant="ghost" size="sm" onClick={() => setEditingId(it.id)} disabled={busy}>
                  Edit
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => remove(it.id)}
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
              <label className="text-xs text-muted-foreground">Product variant</label>
              <Select
                value={draft.productVariantId}
                onValueChange={(v) => setDraft({ ...draft, productVariantId: v })}
                disabled={busy}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Pick a product variant" />
                </SelectTrigger>
                <SelectContent>
                  {productVariants.map((pv) => (
                    <SelectItem key={pv.id} value={pv.id}>{pv.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Price override (optional)</label>
              <NumericFormat
                customInput={Input}
                value={draft.priceOverride ?? ""}
                onValueChange={(v) => setDraft({ ...draft, priceOverride: v.floatValue })}
                decimalScale={4}
                allowNegative={false}
                thousandSeparator=","
                className="mt-1"
                disabled={busy}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => { setDraft({ productVariantId: "", priceOverride: undefined }); setAdding(false); }}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button type="button" size="sm" onClick={add} disabled={busy || !draft.productVariantId}>
              <Save className="h-3.5 w-3.5 mr-1" /> Add
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function ItemEditRow({
  groupId,
  item,
  productVariants,
  onCancel,
  onSaved,
}: {
  groupId: string;
  item: AddonGroup["items"][number];
  productVariants: ProductVariantOption[];
  onCancel: () => void;
  onSaved: () => Promise<void>;
}) {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState({
    productVariantId: item.productVariantId,
    priceOverride: item.priceOverride ?? undefined,
    sortOrder: item.sortOrder,
    active: item.active,
  });

  const save = async () => {
    setBusy(true);
    try {
      const result = await updateAddonGroupItem(groupId, item.id, {
        productVariantId: draft.productVariantId,
        priceOverride: draft.priceOverride,
        sortOrder: draft.sortOrder,
        active: draft.active,
      });
      if ("responseType" in result && result.responseType === "error") {
        toast({ variant: "destructive", title: "Error", description: result.message });
      } else {
        toast({ title: "Item saved" });
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
          <label className="text-xs text-muted-foreground">Product variant</label>
          <Select
            value={draft.productVariantId}
            onValueChange={(v) => setDraft({ ...draft, productVariantId: v })}
            disabled={busy}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {productVariants.map((pv) => (
                <SelectItem key={pv.id} value={pv.id}>{pv.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Price override (optional)</label>
          <NumericFormat
            customInput={Input}
            value={draft.priceOverride ?? ""}
            onValueChange={(v) => setDraft({ ...draft, priceOverride: v.floatValue })}
            decimalScale={4}
            allowNegative={false}
            thousandSeparator=","
            className="mt-1"
            disabled={busy}
          />
        </div>
      </div>
      <div className="flex items-center gap-4">
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
        <Button type="button" size="sm" onClick={save} disabled={busy || !draft.productVariantId}>
          <Save className="h-3.5 w-3.5 mr-1" /> Save
        </Button>
      </div>
    </div>
  );
}

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
